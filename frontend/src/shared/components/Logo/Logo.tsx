import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'

export interface LogoProps {
  /** Hide text when true (collapsed state) */
  collapsed?: boolean
  /** Logo size: sm (32px), md (40px), lg (48px) */
  size?: 'sm' | 'md' | 'lg'
  /** Enable radar sweep rotation animation on hover */
  animated?: boolean
  /** Show "Pulse Radar" text next to icon */
  showText?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Pulse Radar Logo Component
 *
 * Radar-inspired logo with blue → purple gradient.
 * Used in sidebar header and navbar (mobile).
 *
 * @example
 * ```tsx
 * // Sidebar (collapsed state)
 * <Logo collapsed={state === 'collapsed'} size="sm" animated />
 *
 * // Navbar mobile
 * <Logo size="sm" showText />
 * ```
 */
export function Logo({
  collapsed = false,
  size = 'md',
  animated = false,
  showText = true,
  className,
}: LogoProps) {
  const appName = import.meta.env.VITE_APP_NAME || 'Pulse Radar'

  return (
    <Link
      to="/"
      className={cn('flex items-center gap-2', className)}
      aria-label={`${appName} home`}
      data-testid="sidebar-logo"
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
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            'h-full w-full',
            animated && 'hover:[&_line]:animate-spin-slow hover:[&_line]:origin-center'
          )}
          aria-hidden="true"
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Outer radar circle */}
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="url(#pulseGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.3"
          />

          {/* Middle radar circle */}
          <circle
            cx="16"
            cy="16"
            r="10"
            stroke="url(#pulseGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />

          {/* Inner radar circle */}
          <circle
            cx="16"
            cy="16"
            r="6"
            stroke="url(#pulseGradient)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />

          {/* Radar sweep line */}
          <line
            x1="16"
            y1="16"
            x2="16"
            y2="2"
            stroke="url(#pulseGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transformOrigin: '16px 16px' }}
          />

          {/* Task dots (representing tracked items) */}
          <circle cx="22" cy="12" r="1.5" fill="#3b82f6" />
          <circle cx="10" cy="20" r="1.5" fill="#8b5cf6" />
          <circle cx="24" cy="22" r="1.5" fill="#3b82f6" />

          {/* Center pulse dot */}
          <circle cx="16" cy="16" r="2" fill="url(#pulseGradient)" />
        </svg>
      </div>

      {/* Text Label */}
      {showText && !collapsed && (
        <span className="font-semibold text-base whitespace-nowrap">
          {appName}
        </span>
      )}
    </Link>
  )
}
