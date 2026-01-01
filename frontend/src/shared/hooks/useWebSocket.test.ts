import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from './useWebSocket'

// Mock logger to avoid console noise
vi.mock('@/shared/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_WS_HOST: '',
      VITE_WS_PATH: '/ws',
    },
  },
})

// Mock WebSocket class
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  url: string
  readyState = MockWebSocket.CONNECTING

  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  send = vi.fn()
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED
  })

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  simulateOpen() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  simulateMessage(data: unknown) {
    this.onmessage?.(
      new MessageEvent('message', {
        data: JSON.stringify(data),
      })
    )
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(
      new CloseEvent('close', {
        code,
        reason,
        wasClean: code === 1000,
      })
    )
  }

  simulateError() {
    this.onerror?.(new Event('error'))
  }

  // Track all instances for testing
  static instances: MockWebSocket[] = []
  static clearInstances() {
    MockWebSocket.instances = []
  }
  static get lastInstance() {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1]
  }
}

// Setup global mocks
beforeEach(() => {
  vi.useFakeTimers()
  MockWebSocket.clearInstances()

  vi.stubGlobal('WebSocket', MockWebSocket)

  Object.defineProperty(window, 'location', {
    value: {
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000',
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  MockWebSocket.clearInstances()
})

describe('useWebSocket', () => {
  describe('Connection', () => {
    it('creates WebSocket connection on mount', () => {
      renderHook(() => useWebSocket())

      expect(MockWebSocket.instances.length).toBe(1)
    })

    it('includes topics in URL when provided', () => {
      renderHook(() =>
        useWebSocket({
          topics: ['analysis', 'proposals'],
        })
      )

      const ws = MockWebSocket.lastInstance
      expect(ws.url).toContain('topics=analysis,proposals')
    })

    it('sets isConnected to true when connection opens', () => {
      const { result } = renderHook(() => useWebSocket())

      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionState).toBe('connecting')

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.connectionState).toBe('connected')
    })

    it('calls onConnect callback when connection opens', () => {
      const onConnect = vi.fn()

      renderHook(() => useWebSocket({ onConnect }))

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      expect(onConnect).toHaveBeenCalledTimes(1)
    })

    it('handles connection error gracefully', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        MockWebSocket.lastInstance.simulateError()
      })

      // Should not crash, state should indicate connecting still
      expect(result.current.connectionState).toBe('connecting')
    })
  })

  describe('Message Handling', () => {
    it('calls onMessage callback with parsed data', () => {
      const onMessage = vi.fn()

      renderHook(() => useWebSocket({ onMessage }))

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      const testData = { topic: 'test', event: 'data', payload: { id: 1 } }

      act(() => {
        MockWebSocket.lastInstance.simulateMessage(testData)
      })

      expect(onMessage).toHaveBeenCalledWith(testData)
    })

    it('handles malformed JSON gracefully', () => {
      const onMessage = vi.fn()

      renderHook(() => useWebSocket({ onMessage }))

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      // Send malformed JSON directly
      act(() => {
        MockWebSocket.lastInstance.onmessage?.(
          new MessageEvent('message', { data: 'not valid json {' })
        )
      })

      // Should not call onMessage and should not crash
      expect(onMessage).not.toHaveBeenCalled()
    })

    it('responds to ping messages with pong', () => {
      renderHook(() => useWebSocket())

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      const pingData = { type: 'ping', ts: 12345 }

      act(() => {
        MockWebSocket.lastInstance.simulateMessage(pingData)
      })

      expect(MockWebSocket.lastInstance.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      )
    })

    it('does not pass ping messages to onMessage callback', () => {
      const onMessage = vi.fn()

      renderHook(() => useWebSocket({ onMessage }))

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      act(() => {
        MockWebSocket.lastInstance.simulateMessage({ type: 'ping', ts: 12345 })
      })

      // Ping should be handled internally, not passed to callback
      expect(onMessage).not.toHaveBeenCalled()
    })

    // Note: connectionId is stored in a ref and doesn't trigger re-render
    // Testing it would require accessing internal implementation
    // The actual functionality is that the hook stores connectionId for replay on reconnect
  })

  describe('Reconnection', () => {
    it('attempts to reconnect when connection closes unexpectedly', async () => {
      renderHook(() =>
        useWebSocket({
          reconnect: true,
          reconnectInterval: 1000,
        })
      )

      // Initial connection
      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      // Simulate disconnect
      act(() => {
        MockWebSocket.lastInstance.simulateClose(1006, 'Connection lost')
      })

      // Advance timer to trigger reconnect
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      // Should have created a new connection
      expect(MockWebSocket.instances.length).toBe(2)
    })

    it('sets state to reconnecting when connection closes', () => {
      const { result } = renderHook(() =>
        useWebSocket({
          reconnect: true,
          reconnectInterval: 1000,
        })
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      expect(result.current.isConnected).toBe(true)

      act(() => {
        MockWebSocket.lastInstance.simulateClose(1006)
      })

      expect(result.current.connectionState).toBe('reconnecting')
    })

    it('does not reconnect when reconnect option is false', async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          reconnect: false,
        })
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      act(() => {
        MockWebSocket.lastInstance.simulateClose(1006)
      })

      // Advance time significantly
      await act(async () => {
        vi.advanceTimersByTime(10000)
      })

      // Should only have the initial connection
      expect(MockWebSocket.instances.length).toBe(1)
      expect(result.current.connectionState).toBe('disconnected')
    })

    it('calls onDisconnect callback when connection closes', () => {
      const onDisconnect = vi.fn()

      renderHook(() =>
        useWebSocket({
          onDisconnect,
          reconnect: false,
        })
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      act(() => {
        MockWebSocket.lastInstance.simulateClose(1006)
      })

      expect(onDisconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cleanup', () => {
    it('closes connection on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket())

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      unmount()

      expect(MockWebSocket.lastInstance.close).toHaveBeenCalled()
    })

    it('clears reconnection timer on unmount', async () => {
      const { unmount } = renderHook(() =>
        useWebSocket({
          reconnect: true,
          reconnectInterval: 1000,
        })
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      act(() => {
        MockWebSocket.lastInstance.simulateClose(1006)
      })

      // Unmount before reconnection timer fires
      unmount()

      // Advance time - should NOT create new connection
      await act(async () => {
        vi.advanceTimersByTime(5000)
      })

      // Only the original connection should exist
      expect(MockWebSocket.instances.length).toBe(1)
    })
  })

  describe('Manual Controls', () => {
    it('send() sends JSON data when connected', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      // After simulateOpen, isConnected should be true synchronously
      expect(result.current.isConnected).toBe(true)

      act(() => {
        result.current.send({ type: 'test', data: 'hello' })
      })

      expect(MockWebSocket.lastInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: 'hello' })
      )
    })

    it('send() does nothing when not connected', () => {
      const { result } = renderHook(() => useWebSocket())

      // Don't open connection
      act(() => {
        result.current.send({ type: 'test' })
      })

      expect(MockWebSocket.lastInstance.send).not.toHaveBeenCalled()
    })

    it('disconnect() closes the connection', () => {
      const { result } = renderHook(() => useWebSocket())

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      expect(result.current.isConnected).toBe(true)

      act(() => {
        result.current.disconnect()
      })

      expect(MockWebSocket.lastInstance.close).toHaveBeenCalled()
      expect(result.current.isConnected).toBe(false)
      expect(result.current.connectionState).toBe('disconnected')
    })

    it('reconnect() creates new connection', () => {
      const { result } = renderHook(() =>
        useWebSocket({
          reconnect: false,
        })
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      act(() => {
        MockWebSocket.lastInstance.simulateClose(1000)
      })

      expect(result.current.isConnected).toBe(false)

      // Manually trigger reconnect
      act(() => {
        result.current.reconnect()
      })

      // Should create new connection
      expect(MockWebSocket.instances.length).toBe(2)
    })
  })

  describe('Ping Timeout', () => {
    it('closes connection after ping timeout (45s without ping)', async () => {
      renderHook(() => useWebSocket())

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      // Advance 45 seconds without any ping
      await act(async () => {
        vi.advanceTimersByTime(45000)
      })

      // Should have closed with ping timeout code
      expect(MockWebSocket.lastInstance.close).toHaveBeenCalledWith(4000, 'Ping timeout')
    })

    it('resets ping timeout when ping is received', async () => {
      renderHook(() => useWebSocket())

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      // Advance 30 seconds
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })

      // Receive ping - this should reset the timeout
      act(() => {
        MockWebSocket.lastInstance.simulateMessage({ type: 'ping', ts: Date.now() })
      })

      // Advance another 30 seconds
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })

      // Connection should still be open because ping reset the timer
      // close should not have been called with ping timeout
      const closeCallsWithPingTimeout = MockWebSocket.lastInstance.close.mock.calls.filter(
        (call: unknown[]) => call[0] === 4000
      )
      expect(closeCallsWithPingTimeout.length).toBe(0)
    })
  })

  describe('Sequence Tracking', () => {
    it('tracks sequence numbers for message replay on reconnect', async () => {
      renderHook(() =>
        useWebSocket({
          topics: ['test-topic'],
          reconnect: true,
          reconnectInterval: 100,
        })
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      // Receive messages with sequence numbers
      act(() => {
        MockWebSocket.lastInstance.simulateMessage({
          topic: 'test-topic',
          seq: 1,
          data: 'first',
        })
      })

      act(() => {
        MockWebSocket.lastInstance.simulateMessage({
          topic: 'test-topic',
          seq: 5,
          data: 'fifth',
        })
      })

      // Disconnect
      act(() => {
        MockWebSocket.lastInstance.simulateClose(1006)
      })

      // Reconnect
      await act(async () => {
        vi.advanceTimersByTime(200)
      })

      // New connection URL should include lastSeq
      const newWs = MockWebSocket.instances[1]
      expect(newWs.url).toContain('lastSeq=test-topic:5')
    })
  })
})
