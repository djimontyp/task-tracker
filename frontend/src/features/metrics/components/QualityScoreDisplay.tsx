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
  if (score >= 71) return 'bg-green-500 text-white border-green-500'
  if (score >= 41) return 'bg-yellow-500 text-white border-yellow-500'
  return 'bg-red-500 text-white border-red-500'
}

const getScoreLabel = (score: number): string => {
  if (score >= 71) return 'Good'
  if (score >= 41) return 'Fair'
  return 'Poor'
}

export const QualityScoreDisplay = ({
  score,
  topicName,
  showTooltip = true,
}: QualityScoreProps) => {
  const scoreContent = (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          'text-xs font-semibold px-2 py-1',
          getScoreColor(score)
        )}
        aria-label={`Quality score: ${score} out of 100, ${getScoreLabel(score)}`}
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
          <div className="text-xs space-y-1">
            <p className="font-semibold">Quality Score: {score}/100</p>
            <p className="text-muted-foreground">Based on:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
              <li>Message relevance</li>
              <li>Atom completeness</li>
              <li>Topic coherence</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
