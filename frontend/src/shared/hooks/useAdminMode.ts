import { useState, useEffect, useCallback } from 'react'

const ADMIN_MODE_KEY = 'taskTracker_adminMode'

export const useAdminMode = () => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(ADMIN_MODE_KEY)
    return stored === 'true'
  })

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(ADMIN_MODE_KEY, String(isAdminMode))
  }, [isAdminMode])

  const toggleAdminMode = useCallback(() => {
    setIsAdminMode(prev => !prev)
  }, [])

  const enableAdminMode = useCallback(() => {
    setIsAdminMode(true)
  }, [])

  const disableAdminMode = useCallback(() => {
    setIsAdminMode(false)
  }, [])

  return {
    isAdminMode,
    toggleAdminMode,
    enableAdminMode,
    disableAdminMode,
  }
}
