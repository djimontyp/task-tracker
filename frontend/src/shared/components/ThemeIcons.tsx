import { Sun, Moon, Monitor } from 'lucide-react'

interface ThemeIconProps {
  theme: 'light' | 'dark' | 'system'
  className?: string
}

/**
 * UniversalThemeIcon - Shows appropriate icon for current theme.
 * Uses lucide-react icons per Design System guidelines.
 */
export const UniversalThemeIcon = ({ theme, className = 'size-5' }: ThemeIconProps) => {
  const iconClass = `${className} transition-all duration-300`

  if (theme === 'light') {
    return <Sun className={iconClass} aria-hidden="true" />
  }

  if (theme === 'dark') {
    return <Moon className={iconClass} aria-hidden="true" />
  }

  // System theme
  return <Monitor className={iconClass} aria-hidden="true" />
}
