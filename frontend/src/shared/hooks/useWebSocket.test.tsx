import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { useWebSocket } from './useWebSocket'
import { WebSocketProvider } from '@/shared/providers/WebSocketProvider'

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

// Wrapper component with WebSocketProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <WebSocketProvider>{children}</WebSocketProvider>
)

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

describe('useWebSocket with Provider', () => {
  describe('Connection via Provider', () => {
    it('creates WebSocket connection when topic is subscribed', () => {
      renderHook(() => useWebSocket({ topics: ['test'] }), { wrapper })

      expect(MockWebSocket.instances.length).toBe(1)
    })

    it('does not create connection when no topics provided', () => {
      renderHook(() => useWebSocket(), { wrapper })

      // Provider only connects when there are topics
      expect(MockWebSocket.instances.length).toBe(0)
    })

    it('includes topics in URL when provided', () => {
      renderHook(() =>
        useWebSocket({
          topics: ['analysis', 'proposals'],
        }),
        { wrapper }
      )

      const ws = MockWebSocket.lastInstance
      expect(ws.url).toContain('topics=analysis,proposals')
    })

    it('sets isConnected to true when connection opens', () => {
      const { result } = renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

      expect(result.current.isConnected).toBe(false)

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      expect(result.current.isConnected).toBe(true)
      expect(result.current.connectionState).toBe('connected')
    })

    it('calls onConnect callback when connection opens', () => {
      const onConnect = vi.fn()

      renderHook(() =>
        useWebSocket({ topics: ['test'], onConnect }),
        { wrapper }
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      expect(onConnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Message Handling', () => {
    it('calls onMessage callback with parsed data', () => {
      const onMessage = vi.fn()

      renderHook(() =>
        useWebSocket({ topics: ['test'], onMessage }),
        { wrapper }
      )

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

      renderHook(() =>
        useWebSocket({ topics: ['test'], onMessage }),
        { wrapper }
      )

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
      renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

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

      renderHook(() =>
        useWebSocket({ topics: ['test'], onMessage }),
        { wrapper }
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      act(() => {
        MockWebSocket.lastInstance.simulateMessage({ type: 'ping', ts: 12345 })
      })

      // Ping should be handled internally, not passed to callback
      expect(onMessage).not.toHaveBeenCalled()
    })
  })

  // Note: Singleton behavior is tested in browser/E2E tests
  // because each renderHook creates its own Provider context.
  // The real singleton behavior happens at the application level
  // where one WebSocketProvider wraps all components.

  describe('Cleanup', () => {
    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      unmount()

      // After unmount and cleanup delay, connection should close
      // because no subscriptions remain
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(MockWebSocket.lastInstance.close).toHaveBeenCalled()
    })
  })

  describe('Manual Controls', () => {
    it('send() sends JSON data when connected', () => {
      const { result } = renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      expect(result.current.isConnected).toBe(true)

      act(() => {
        result.current.send({ type: 'test', data: 'hello' })
      })

      expect(MockWebSocket.lastInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: 'hello' })
      )
    })

    it('send() does nothing when not connected', () => {
      const { result } = renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

      // Don't open connection
      act(() => {
        result.current.send({ type: 'test' })
      })

      expect(MockWebSocket.lastInstance.send).not.toHaveBeenCalled()
    })
  })

  describe('Reconnection', () => {
    it('attempts to reconnect when connection closes unexpectedly', async () => {
      renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

      // Initial connection
      act(() => {
        MockWebSocket.lastInstance.simulateOpen()
      })

      const initialInstanceCount = MockWebSocket.instances.length

      // Simulate disconnect
      act(() => {
        MockWebSocket.lastInstance.simulateClose(1006, 'Connection lost')
      })

      // Advance timer to trigger reconnect (exponential backoff)
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      // Should have created a new connection
      expect(MockWebSocket.instances.length).toBeGreaterThan(initialInstanceCount)
    })

    it('sets state to reconnecting when connection closes', () => {
      const { result } = renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
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

    it('calls onDisconnect callback when connection closes', () => {
      const onDisconnect = vi.fn()

      renderHook(() =>
        useWebSocket({
          topics: ['test'],
          onDisconnect,
        }),
        { wrapper }
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

  describe('Ping Timeout', () => {
    it('closes connection after ping timeout (45s without ping)', async () => {
      renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

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
      renderHook(() =>
        useWebSocket({ topics: ['test'] }),
        { wrapper }
      )

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
})
