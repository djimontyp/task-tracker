import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clipboard, ChevronDown, ChevronRight } from 'lucide-react'
import { Progress } from '@/shared/ui/progress'
import { Badge } from '@/shared/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'
import type { MessageInspectData } from '@/features/messages/types'

interface ClassificationTabProps {
  data: MessageInspectData['classification']
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

interface ConfidenceLevelConfig {
  labelKey: string
  descriptionKey: string
  color: string
  bgColor: string
  badgeVariant: 'success' | 'default' | 'destructive'
}

const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceLevelConfig> = {
  high: {
    labelKey: 'classification.confidenceLevels.high.label',
    descriptionKey: 'classification.confidenceLevels.high.description',
    color: 'bg-semantic-success',
    bgColor: 'bg-semantic-success',
    badgeVariant: 'success',
  },
  medium: {
    labelKey: 'classification.confidenceLevels.medium.label',
    descriptionKey: 'classification.confidenceLevels.medium.description',
    color: 'bg-semantic-warning',
    bgColor: 'bg-semantic-warning',
    badgeVariant: 'default',
  },
  low: {
    labelKey: 'classification.confidenceLevels.low.label',
    descriptionKey: 'classification.confidenceLevels.low.description',
    color: 'bg-semantic-error',
    bgColor: 'bg-semantic-error',
    badgeVariant: 'destructive',
  },
}

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 71) return 'high'
  if (score >= 41) return 'medium'
  return 'low'
}

function getConfidenceConfig(score: number): ConfidenceLevelConfig {
  return CONFIDENCE_LEVELS[getConfidenceLevel(score)]
}

interface DimensionScore {
  labelKey: string
  descriptionKey: string
  value: number
  inverted?: boolean
}

export function ClassificationTab({ data }: ClassificationTabProps) {
  const { t } = useTranslation('messages')
  const [whyTopicOpen, setWhyTopicOpen] = useState(true)
  const [whyNotNoiseOpen, setWhyNotNoiseOpen] = useState(false)
  const [keyIndicatorsOpen, setKeyIndicatorsOpen] = useState(false)

  const overallConfig = getConfidenceConfig(data.confidence)

  const dimensions: DimensionScore[] = [
    {
      labelKey: 'classification.dimensions.topicRelevance.label',
      descriptionKey: 'classification.dimensions.topicRelevance.description',
      value: data.confidence,
    },
    {
      labelKey: 'classification.dimensions.noiseScore.label',
      descriptionKey: 'classification.dimensions.noiseScore.description',
      value: data.noise_score,
      inverted: true,
    },
    {
      labelKey: 'classification.dimensions.urgencyScore.label',
      descriptionKey: 'classification.dimensions.urgencyScore.description',
      value: data.urgency_score,
    },
  ]

  const handleCopyReasoning = () => {
    navigator.clipboard.writeText(data.reasoning)
    toast.success(t('classification.toast.copiedReasoning'))
  }

  const parseReasoning = () => {
    const sections = {
      whyTopic: '',
      whyNotNoise: '',
      keyIndicators: [] as string[],
    }

    const lines = data.reasoning.split('\n')
    let currentSection: 'whyTopic' | 'whyNotNoise' | 'indicators' | null = null

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed) continue

      if (trimmed.toLowerCase().includes('why') && trimmed.toLowerCase().includes('topic')) {
        currentSection = 'whyTopic'
        continue
      }

      if (trimmed.toLowerCase().includes('why not') || trimmed.toLowerCase().includes('noise')) {
        currentSection = 'whyNotNoise'
        continue
      }

      if (trimmed.toLowerCase().includes('indicator') || trimmed.toLowerCase().includes('signal')) {
        currentSection = 'indicators'
        continue
      }

      if (currentSection === 'whyTopic') {
        sections.whyTopic += trimmed + ' '
      } else if (currentSection === 'whyNotNoise') {
        sections.whyNotNoise += trimmed + ' '
      } else if (currentSection === 'indicators') {
        if (trimmed.startsWith('-') || trimmed.startsWith('\u2022') || trimmed.startsWith('*')) {
          sections.keyIndicators.push(trimmed.substring(1).trim())
        } else if (trimmed.match(/^\d+\./)) {
          sections.keyIndicators.push(trimmed.replace(/^\d+\./, '').trim())
        }
      }
    }

    if (!sections.whyTopic && !sections.whyNotNoise && sections.keyIndicators.length === 0) {
      sections.whyTopic = data.reasoning
    }

    return sections
  }

  const reasoning = parseReasoning()

  return (
    <div className="space-y-6 p-4">
      {/* Overall Confidence Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t('classification.overallConfidence')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{data.confidence}%</span>
            <Badge variant={overallConfig.badgeVariant}>{t(overallConfig.labelKey)}</Badge>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Progress
                  value={data.confidence}
                  className="h-4"
                  aria-label={t('classification.ariaLabel.confidence', { value: data.confidence })}
                />
                <div
                  className={cn('absolute inset-0 h-full rounded-full transition-all', overallConfig.bgColor)}
                  style={{ width: `${data.confidence}%` }}
                />

                {/* Threshold markers */}
                <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
                  <div className="relative" style={{ left: '40%' }}>
                    <div className="absolute h-4 w-px bg-card/50" />
                  </div>
                  <div className="relative" style={{ left: '70%' }}>
                    <div className="absolute h-4 w-px bg-card/50" />
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{t(overallConfig.labelKey)}</p>
              <p className="text-xs">{t(overallConfig.descriptionKey)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('classification.thresholds.low')}</span>
          <span>{t('classification.thresholds.medium')}</span>
          <span>{t('classification.thresholds.high')}</span>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t('classification.dimensionBreakdown')}</h3>

        {dimensions.map((dimension) => {
          const displayValue = dimension.inverted ? 100 - dimension.value : dimension.value
          const config = getConfidenceConfig(displayValue)

          return (
            <div key={dimension.labelKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t(dimension.labelKey)}</span>
                <span className="text-sm font-semibold text-foreground">{dimension.value}%</span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Progress value={displayValue} className="h-2" aria-label={`${t(dimension.labelKey)}: ${dimension.value}%`} />
                      <div
                        className={cn('absolute inset-0 h-full rounded-full transition-all', config.bgColor)}
                        style={{ width: `${displayValue}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{t(dimension.descriptionKey)}</p>
                    {dimension.inverted && <p className="text-xs mt-2">{t('classification.dimensions.lowerIsBetter')}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        })}
      </div>

      {/* Decision Rationale */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t('classification.decisionRationale')}</h3>
          <Button variant="ghost" size="sm" onClick={handleCopyReasoning}>
            <Clipboard className="size-4 mr-2" />
            {t('classification.copyReasoning')}
          </Button>
        </div>

        {/* Why this topic? */}
        <Collapsible open={whyTopicOpen} onOpenChange={setWhyTopicOpen}>
          <div className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between p-4 hover:bg-muted transition-colors">
                <span className="text-sm font-semibold text-foreground">{t('classification.sections.whyTopic')}</span>
                {whyTopicOpen ? (
                  <ChevronDown className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                <div className="rounded-md bg-semantic-info/10 p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {reasoning.whyTopic || t('classification.defaultReasoning.whyTopic', { topic: data.topic_title })}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Why not noise? */}
        <Collapsible open={whyNotNoiseOpen} onOpenChange={setWhyNotNoiseOpen}>
          <div className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between p-4 hover:bg-muted transition-colors">
                <span className="text-sm font-semibold text-foreground">{t('classification.sections.whyNotNoise')}</span>
                {whyNotNoiseOpen ? (
                  <ChevronDown className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                <div className="rounded-md bg-semantic-success/10 p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {reasoning.whyNotNoise || t('classification.defaultReasoning.whyNotNoise')}
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Key Indicators */}
        <Collapsible open={keyIndicatorsOpen} onOpenChange={setKeyIndicatorsOpen}>
          <div className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between p-4 hover:bg-muted transition-colors">
                <span className="text-sm font-semibold text-foreground">{t('classification.sections.keyIndicators')}</span>
                {keyIndicatorsOpen ? (
                  <ChevronDown className="size-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                {reasoning.keyIndicators.length > 0 ? (
                  <ul className="space-y-2">
                    {reasoning.keyIndicators.map((indicator, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        {/* eslint-disable-next-line local-rules/no-hardcoded-text */}
                        <span className="text-semantic-success mt-0.5" aria-hidden="true">{'\u2713'}</span>
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      {/* eslint-disable-next-line local-rules/no-hardcoded-text */}
                      <span className="text-semantic-success mt-0.5" aria-hidden="true">{'\u2713'}</span>
                      <span>{t('classification.defaultIndicators.matchedCriteria')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      {/* eslint-disable-next-line local-rules/no-hardcoded-text */}
                      <span className="text-semantic-success mt-0.5" aria-hidden="true">{'\u2713'}</span>
                      <span>{t('classification.defaultIndicators.signalRatio')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      {/* eslint-disable-next-line local-rules/no-hardcoded-text */}
                      <span className="text-semantic-success mt-0.5" aria-hidden="true">{'\u2713'}</span>
                      <span>{t('classification.defaultIndicators.semanticSimilarity')}</span>
                    </li>
                  </ul>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Topic Assignment */}
      <div className="rounded-lg border border-border bg-muted p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{t('classification.assignedTopic')}</span>
          <span className="text-sm font-semibold text-foreground">{data.topic_title}</span>
        </div>
      </div>
    </div>
  )
}
