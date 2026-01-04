import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { cn } from '@/shared/lib'
import type { QualityScoreProps } from '../types'

const getScoreColor = (score: number): string => {
  if (score >= 71) return 'bg-semantic-success text-white border-semantic-success'
  if (score >= 41) return 'bg-semantic-warning text-white border-semantic-warning'
  return 'bg-semantic-error text-white border-semantic-error'
}

const getScoreLabelKey = (score: number): string => {
  if (score >= 71) return 'qualityScore.labels.good'
  if (score >= 41) return 'qualityScore.labels.fair'
  return 'qualityScore.labels.poor'
}

export const QualityScoreDisplay = ({
  score,
  topicName,
  showTooltip = true,
}: QualityScoreProps) => {
  const { t } = useTranslation('monitoring')

  const scoreContent = (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          'text-xs font-semibold px-2 py-2',
          getScoreColor(score)
        )}
        aria-label={t('qualityScore.ariaLabel', { score, label: t(getScoreLabelKey(score)) })}
      >
        {score}
      </Badge>
      {topicName && (
        <span className="text-sm text-muted-foreground">{topicName}</span>
      )}
    </div>
  )

  if (!showTooltip) {
    return scoreContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {scoreContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-2">
            <p className="font-semibold">{t('qualityScore.tooltip.title', { score })}</p>
            <p className="text-muted-foreground">{t('qualityScore.tooltip.basedOn')}</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>{t('qualityScore.tooltip.factors.relevance')}</li>
              <li>{t('qualityScore.tooltip.factors.completeness')}</li>
              <li>{t('qualityScore.tooltip.factors.coherence')}</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
