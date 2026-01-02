import { useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'

export interface LogoProps {
  /** Hide text when true (collapsed state) */
  collapsed?: boolean
  /** Logo size: sm (32px), md (40px), lg (48px) */
  size?: 'sm' | 'md' | 'lg'
  /** Enable radar sweep animation (default: true) */
  animated?: boolean
  /** Show "Pulse Radar" text next to icon */
  showText?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Pulse Radar Logo Component
 *
 * Elegant radar-inspired logo with animated sweep line and orbiting atoms.
 * Uses CSS variables for dynamic theming (light/dark mode).
 *
 * Animation behavior (CSS-driven):
 * - On hover: 700ms delay, then starts rotating
 * - While hovered: continuous rotation
 * - On mouse leave: continues for 3s then stops
 * - Respects prefers-reduced-motion
 */
export function Logo({
  collapsed = false,
  size = 'md',
  animated = true,
  showText = true,
  className,
}: LogoProps) {
  const appName = import.meta.env.VITE_APP_NAME || 'Pulse Radar'
  const svgRef = useRef<SVGSVGElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mouse leave: add "animating" class for 3s to continue animation
  const handleMouseLeave = useCallback(() => {
    if (!animated || !svgRef.current) return

    // Check if animation was running (hover was long enough)
    const svg = svgRef.current
    svg.classList.add('animating')

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Remove class after 3 seconds
    timeoutRef.current = setTimeout(() => {
      svg.classList.remove('animating')
    }, 3000)
  }, [animated])

  return (
    <Link
      to="/"
      className={cn(
        'logo-container flex items-center gap-2 rounded-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-label={`${appName} home`}
      data-testid="sidebar-logo"
      onMouseLeave={handleMouseLeave}
    >
      {/* Radar Icon SVG */}
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
          {/* Gradient Definitions - Uses CSS variables for theming */}
          <defs>
            {/* Sweep gradient: primary to transparent */}
            <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.3)" />
            </linearGradient>
            {/* Center dot gradient */}
            <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.8)" />
            </radialGradient>
          </defs>

          {/* Outer radar circle - subtle */}
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth="1"
            fill="none"
          />

          {/* Middle radar circle */}
          <circle
            cx="16"
            cy="16"
            r="10"
            stroke="hsl(var(--primary) / 0.5)"
            strokeWidth="1"
            fill="none"
          />

          {/* Inner radar circle */}
          <circle
            cx="16"
            cy="16"
            r="6"
            stroke="hsl(var(--primary) / 0.7)"
            strokeWidth="1"
            fill="none"
          />

          {/* Animated sweep line */}
          <g className="sweep-group">
            <line
              x1="16"
              y1="16"
              x2="16"
              y2="2"
              stroke="url(#sweepGradient)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* Orbiting atom 1 - slow clockwise */}
          <g className="orbit-group orbit-1">
            <circle cx="22" cy="11" r="1.5" fill="hsl(var(--accent))" />
          </g>

          {/* Orbiting atom 2 - reverse direction */}
          <g className="orbit-group orbit-2">
            <circle cx="9" cy="19" r="1.5" fill="hsl(var(--accent) / 0.7)" />
          </g>

          {/* Orbiting atom 3 - medium speed */}
          <g className="orbit-group orbit-3">
            <circle cx="23" cy="21" r="1" fill="hsl(var(--accent) / 0.5)" />
          </g>

          {/* Center pulse dot */}
          <circle cx="16" cy="16" r="2.5" fill="url(#centerGradient)" />
        </svg>
      </div>

      {/* Text Label */}
      {showText && !collapsed && (
        <span className="font-semibold text-base whitespace-nowrap text-sidebar-foreground">
          {appName}
        </span>
      )}
    </Link>
  )
}
