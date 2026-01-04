import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/index'

interface ZoomableCardProps {
  /** Compact preview shown in grid */
  preview: React.ReactNode
  /** Full version shown on zoom */
  full: React.ReactNode
  className?: string
  /** Enable reduced motion (disables animation) */
  reducedMotion?: boolean
  /** Zoom trigger: 'hover' or 'click' */
  trigger?: 'hover' | 'click'
}

/**
 * ZoomableCard - Card that zooms to center viewport on hover/click
 *
 * Features:
 * - Portal-based overlay to bypass overflow:hidden
 * - Smooth transform animation from source to center
 * - Reduced motion support
 * - Touch events for mobile
 * - Escape key to close
 */
export function ZoomableCard({
  preview,
  full,
  className,
  reducedMotion = false,
  trigger = 'hover',
}: ZoomableCardProps) {
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [sourceRect, setSourceRect] = React.useState<DOMRect | null>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const openTimerRef = React.useRef<number>()
  const closeTimerRef = React.useRef<number>()

  // Capture source position on zoom (with delay)
  const handleZoomIn = React.useCallback(() => {
    // Cancel any pending close
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = undefined
    }

    // Don't start new timer if already zoomed or timer pending
    if (isZoomed || openTimerRef.current) return

    // Delay opening by 350ms
    openTimerRef.current = window.setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        setSourceRect(rect)
        setIsZoomed(true)
      }
      openTimerRef.current = undefined
    }, 350)
  }, [isZoomed])

  // Instant zoom on click (no delay)
  const handleZoomInInstant = React.useCallback(() => {
    // Cancel any pending timers
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = undefined
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = undefined
    }

    if (cardRef.current && !isZoomed) {
      const rect = cardRef.current.getBoundingClientRect()
      setSourceRect(rect)
      setIsZoomed(true)
    }
  }, [isZoomed])

  const handleZoomOut = React.useCallback(() => {
    // Cancel any pending open timer
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = undefined
    }

    // Cancel any pending close timer
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = undefined
    }

    setIsZoomed(false)
    // Clear sourceRect after animation completes
    setTimeout(() => setSourceRect(null), 300)
  }, [])

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current)
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  // Escape key to close
  React.useEffect(() => {
    if (!isZoomed) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleZoomOut()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isZoomed, handleZoomOut])

  // Event handlers
  // Click always triggers instant zoom
  // Hover adds delayed zoom (350ms)
  const triggerProps = {
    onClick: handleZoomInInstant, // Click = instant zoom
    ...(trigger === 'hover' && {
      onMouseEnter: handleZoomIn, // Hover = delayed zoom (350ms)
      onMouseLeave: isZoomed ? undefined : handleZoomOut, // Cancel if not zoomed yet
    }),
  }

  return (
    <>
      {/* Source card (always visible) - shows preview */}
      <div
        ref={cardRef}
        className={cn(
          'transition-opacity duration-200',
          isZoomed && 'pointer-events-none', // Disable interactions when zoomed
          className
        )}
        {...triggerProps}
      >
        {preview}
      </div>

      {/* Portal overlay (only when zoomed) - shows full version */}
      {isZoomed &&
        sourceRect &&
        createPortal(
          <ZoomedOverlay
            sourceRect={sourceRect}
            onClose={handleZoomOut}
            onContentMouseLeave={handleZoomOut}
            reducedMotion={reducedMotion}
          >
            {full}
          </ZoomedOverlay>,
          document.body
        )}
    </>
  )
}

interface ZoomedOverlayProps {
  children: React.ReactNode
  sourceRect: DOMRect
  onClose: () => void
  onContentMouseLeave: () => void
  reducedMotion: boolean
}

function ZoomedOverlay({
  children,
  sourceRect,
  onClose,
  onContentMouseLeave,
  reducedMotion,
}: ZoomedOverlayProps) {
  const [isAnimating, setIsAnimating] = React.useState(true)
  const [allowClose, setAllowClose] = React.useState(false)

  // Trigger animation on mount
  React.useEffect(() => {
    // Force reflow to ensure initial state is applied
    requestAnimationFrame(() => {
      setIsAnimating(false)
    })

    // Allow closing only after animation completes
    const timer = setTimeout(() => {
      setAllowClose(true)
    }, 350) // Slightly longer than animation duration

    return () => clearTimeout(timer)
  }, [])

  // Calculate initial transform (source position)
  const viewportCenterX = window.innerWidth / 2
  const viewportCenterY = window.innerHeight / 2
  const sourceCenterX = sourceRect.left + sourceRect.width / 2
  const sourceCenterY = sourceRect.top + sourceRect.height / 2

  // Target size: 90vw x 80vh
  const targetWidth = window.innerWidth * 0.9
  const targetHeight = window.innerHeight * 0.8

  const initialTransform = {
    translateX: sourceCenterX - viewportCenterX,
    translateY: sourceCenterY - viewportCenterY,
    scale: Math.min(sourceRect.width / targetWidth, sourceRect.height / targetHeight),
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={allowClose ? onClose : undefined} // Click backdrop = close (only after animation)
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-background/80 backdrop-blur-sm',
          reducedMotion ? '' : 'transition-opacity duration-300',
          isAnimating ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Zoomed content - mouse leave from here closes */}
      <div
        className={cn(
          'relative w-[90vw] max-h-[80vh]',
          reducedMotion
            ? ''
            : 'transition-transform duration-300 ease-out motion-reduce:transition-none'
        )}
        style={{
          transform: isAnimating
            ? `translate(${initialTransform.translateX}px, ${initialTransform.translateY}px) scale(${initialTransform.scale})`
            : 'translate(0, 0) scale(1)',
        }}
        onClick={(e) => e.stopPropagation()} // Prevent close on content click
        onMouseLeave={allowClose ? onContentMouseLeave : undefined} // Close only after animation
      >
        {children}
      </div>
    </div>
  )
}
