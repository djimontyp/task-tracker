import { create } from 'zustand'

type ConnectionStatus = 'unknown' | 'checking' | 'connected' | 'warning' | 'error'

interface TelegramState {
  connectionStatus: ConnectionStatus
  lastChecked: Date | null
  connectionError: string | null
  isOperationPending: boolean
  setConnectionStatus: (status: ConnectionStatus) => void
  setLastChecked: (date: Date | null) => void
  setConnectionError: (error: string | null) => void
  setOperationPending: (pending: boolean) => void
  reset: () => void
}

const initialState = {
  connectionStatus: 'unknown' as ConnectionStatus,
  lastChecked: null,
  connectionError: null,
  isOperationPending: false,
}

export const useTelegramStore = create<TelegramState>((set) => ({
  ...initialState,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLastChecked: (date) => set({ lastChecked: date }),
  setConnectionError: (error) => set({ connectionError: error }),
  setOperationPending: (pending) => set({ isOperationPending: pending }),
  reset: () => set(initialState),
}))
