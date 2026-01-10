import { useTranslation } from 'react-i18next'

import Spinner from '@/shared/ui/Spinner/Spinner'
import { cn } from '@/shared/lib/utils'
import { loading, transitions } from '@/shared/tokens'

/**
 * Humanized loading states with friendly messages instead of spinners alone.
 *
 * @example
 * // Default analyzing variant
 * <HumanizedLoader variant="analyzing" />
 *
 * // Custom message
 * <HumanizedLoader variant="loading" message="Fetching latest updates..." />
 */

export type HumanizedLoaderVariant = 'analyzing' | 'loading' | 'connecting' | 'processing'

export interface HumanizedLoaderProps {
  /** Type of loading state */
  variant: HumanizedLoaderVariant
  /** Custom message to display. If not provided, uses default for variant. */
  message?: string
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

export function HumanizedLoader({
  variant,
  message,
  size = 'md',
  className,
}: HumanizedLoaderProps) {
  const { t } = useTranslation('common')

  // Get default message for variant (no useMemo to avoid t() dependency issues)
  const getDefaultMessage = (v: HumanizedLoaderVariant): string => {
    switch (v) {
      case 'analyzing': return t('loader.analyzing')
      case 'loading': return t('loader.loading')
      case 'connecting': return t('loader.connecting')
      case 'processing': return t('loader.processing')
    }
  }

  const displayMessage = message ?? getDefaultMessage(variant)

  return (
    <div
      className={cn(
        loading.spinner.center,
        'flex-col gap-4',
        transitions.smooth,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size={size} />
      <p className="text-sm text-muted-foreground animate-pulse">
        {displayMessage}
      </p>
    </div>
  )
}
