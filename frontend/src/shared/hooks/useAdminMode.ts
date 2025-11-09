import { useUiStore } from '@/shared/store/uiStore'

export const useAdminMode = () => {
  const isAdminMode = useUiStore((state) => state.isAdminMode)
  const toggleAdminMode = useUiStore((state) => state.toggleAdminMode)
  const setAdminMode = useUiStore((state) => state.setAdminMode)

  return {
    isAdminMode,
    toggleAdminMode,
    enableAdminMode: () => setAdminMode(true),
    disableAdminMode: () => setAdminMode(false),
  }
}
