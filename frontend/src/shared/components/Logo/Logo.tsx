import { useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

export interface LogoProps {
  /** Hide text when true (collapsed state) */
  collapsed?: boolean
  /** Logo size: sm (32px), md (40px), lg (48px) */
  size?: 'sm' | 'md' | 'lg'
  /** Enable animations (default: true) */
  animated?: boolean
  /** Show "Pulse Radar" text next to icon */
  showText?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Pulse Radar Logo Component
 *
 * Minimalist ring design with elegant rotation and pulsing core.
 * Matches the teal/dark theme aesthetic.
 */
export function Logo({
  collapsed = false,
  size = 'md',
  animated = true,
  showText = true,
  className,
}: LogoProps) {
  const { t } = useTranslation('common')
  const appName = import.meta.env.VITE_APP_NAME || 'Pulse Radar'
  const svgRef = useRef<SVGSVGElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Start animation on page load for 3 seconds
  useEffect(() => {
    if (!animated || !svgRef.current) return

    const svg = svgRef.current
    svg.classList.add('animating')

    const timer = setTimeout(() => {
      svg.classList.remove('animating')
    }, 3000)

    return () => clearTimeout(timer)
  }, [animated])

  // On mouse leave: keep animating for a bit
  const handleMouseLeave = useCallback(() => {
    if (!animated || !svgRef.current) return

    const svg = svgRef.current
    svg.classList.add('animating')

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      svg.classList.remove('animating')
    }, 3000)
  }, [animated])

  return (
    <Link
      to="/"
      className={cn(
        'logo-container flex items-center gap-4 rounded-md',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // Ensure 44px touch target
        'min-h-11',
        className
      )}
      aria-label={t('navbar.homeLink', { appName })}
      data-testid="sidebar-logo"
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          'relative shrink-0',
          size === 'sm' && 'h-8 w-8',
          size === 'md' && 'h-10 w-10',
          size === 'lg' && 'h-12 w-12'
        )}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn('logo-svg h-full w-full', !animated && 'pointer-events-none')}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            </radialGradient>
          </defs>

          {/* Rotating Ring */}
          <circle
            className="logo-ring"
            cx="16"
            cy="16"
            r="14"
            stroke="url(#ringGradient)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Inner Static Ring (faint) */}
          <circle
            cx="16"
            cy="16"
            r="9"
            stroke="hsl(var(--primary) / 0.2)"
            strokeWidth="1"
            fill="none"
          />

          {/* Pulsing Core */}
          <circle
            className="logo-core"
            cx="16"
            cy="16"
            r="4"
            fill="url(#coreGradient)"
          />
        </svg>
      </div>

      {showText && !collapsed && (
        <span className="flex items-center gap-2 font-mono text-lg tracking-widest uppercase whitespace-nowrap">
          <span className="font-bold text-sidebar-foreground">
            {appName.split(' ')[0]}
          </span>
          <span className="font-normal text-primary">
            {appName.split(' ').slice(1).join(' ')}
          </span>
        </span>
      )}
    </Link>
  )
}
