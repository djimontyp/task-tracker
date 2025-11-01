import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  theme: 'light' | 'dark' | 'system'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      theme: 'system',
      toggleTheme: () => set((state) => {
        if (state.theme === 'light') return { theme: 'dark' }
        if (state.theme === 'dark') return { theme: 'system' }
        return { theme: 'light' }
      }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
