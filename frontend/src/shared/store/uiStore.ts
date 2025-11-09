import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  expandedGroups: Record<string, boolean>
  setExpandedGroup: (group: string, expanded: boolean) => void

  theme: 'light' | 'dark' | 'system'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  isAdminMode: boolean
  toggleAdminMode: () => void
  setAdminMode: (enabled: boolean) => void
}

export const useUiStore = create<UiStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      expandedGroups: {},
      setExpandedGroup: (group, expanded) =>
        set((state) => ({
          expandedGroups: { ...state.expandedGroups, [group]: expanded },
        })),

      theme: 'system',
      toggleTheme: () => set((state) => {
        if (state.theme === 'light') return { theme: 'dark' }
        if (state.theme === 'dark') return { theme: 'system' }
        return { theme: 'light' }
      }),
      setTheme: (theme) => set({ theme }),

      isAdminMode: false,
      toggleAdminMode: () => set((state) => ({ isAdminMode: !state.isAdminMode })),
      setAdminMode: (enabled) => set({ isAdminMode: enabled }),
    }),
    {
      name: 'ui-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        expandedGroups: state.expandedGroups,
        isAdminMode: state.isAdminMode,
      }),
    }
  )
)
