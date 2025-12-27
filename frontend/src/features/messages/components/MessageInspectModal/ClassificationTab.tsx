import { useState } from 'react'
import { Clipboard, ChevronDown, ChevronRight } from 'lucide-react'
import { Progress } from '@/shared/ui/progress'
import { Badge } from '@/shared/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'
import type { MessageInspectData } from './types'

interface ClassificationTabProps {
  data: MessageInspectData['classification']
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

interface ConfidenceLevelConfig {
  label: string
  color: string
  bgColor: string
  badgeVariant: 'success' | 'default' | 'destructive'
  description: string
}

const CONFIDENCE_LEVELS: Record<ConfidenceLevel, ConfidenceLevelConfig> = {
  high: {
    label: 'High Confidence',
    color: 'bg-semantic-success',
    bgColor: 'bg-semantic-success',
    badgeVariant: 'success',
    description: '71-100% - Classification is reliable',
  },
  medium: {
    label: 'Medium Confidence',
    color: 'bg-semantic-warning',
    bgColor: 'bg-semantic-warning',
    badgeVariant: 'default',
    description: '41-70% - Manual review recommended',
  },
  low: {
    label: 'Low Confidence',
    color: 'bg-semantic-error',
    bgColor: 'bg-semantic-error',
    badgeVariant: 'destructive',
    description: '0-40% - Likely misclassified',
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
  label: string
  value: number
  description: string
  inverted?: boolean
}

export function ClassificationTab({ data }: ClassificationTabProps) {
  const [whyTopicOpen, setWhyTopicOpen] = useState(true)
  const [whyNotNoiseOpen, setWhyNotNoiseOpen] = useState(false)
  const [keyIndicatorsOpen, setKeyIndicatorsOpen] = useState(false)

  const overallConfig = getConfidenceConfig(data.confidence)

  const dimensions: DimensionScore[] = [
    {
      label: 'Topic Relevance',
      value: data.confidence,
      description: 'How well this message matches the assigned topic',
    },
    {
      label: 'Noise Score',
      value: data.noise_score,
      description: 'Signal quality (lower is better)',
      inverted: true,
    },
    {
      label: 'Urgency Score',
      value: data.urgency_score,
      description: 'How urgent or time-sensitive this message is',
    },
  ]

  const handleCopyReasoning = () => {
    navigator.clipboard.writeText(data.reasoning)
    toast.success('Reasoning copied to clipboard')
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
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
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
          <h3 className="text-lg font-semibold text-foreground">Overall confidence</h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">{data.confidence}%</span>
            <Badge variant={overallConfig.badgeVariant}>{overallConfig.label}</Badge>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Progress
                  value={data.confidence}
                  className="h-4"
                  aria-label={`Confidence: ${data.confidence}%`}
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
              <p className="font-semibold">{overallConfig.label}</p>
              <p className="text-xs">{overallConfig.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low (0-40)</span>
          <span>Medium (41-70)</span>
          <span>High (71-100)</span>
        </div>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Dimension breakdown</h3>

        {dimensions.map((dimension) => {
          const displayValue = dimension.inverted ? 100 - dimension.value : dimension.value
          const config = getConfidenceConfig(displayValue)

          return (
            <div key={dimension.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{dimension.label}</span>
                <span className="text-sm font-semibold text-foreground">{dimension.value}%</span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Progress value={displayValue} className="h-2" aria-label={`${dimension.label}: ${dimension.value}%`} />
                      <div
                        className={cn('absolute inset-0 h-full rounded-full transition-all', config.bgColor)}
                        style={{ width: `${displayValue}%` }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{dimension.description}</p>
                    {dimension.inverted && <p className="text-xs mt-2">Lower scores are better</p>}
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
          <h3 className="text-lg font-semibold text-foreground">Decision rationale</h3>
          <Button variant="ghost" size="sm" onClick={handleCopyReasoning}>
            <Clipboard className="size-4 mr-2" />
            Copy Reasoning
          </Button>
        </div>

        {/* Why this topic? */}
        <Collapsible open={whyTopicOpen} onOpenChange={setWhyTopicOpen}>
          <div className="rounded-lg border border-border bg-card">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between p-4 hover:bg-muted transition-colors">
                <span className="text-sm font-semibold text-foreground">Why this topic?</span>
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
                    {reasoning.whyTopic || `This message was classified to "${data.topic_title}" based on content analysis and semantic similarity.`}
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
                <span className="text-sm font-semibold text-foreground">Why not noise?</span>
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
                    {reasoning.whyNotNoise || 'Message contains actionable content with clear signals, not casual conversation or spam.'}
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
                <span className="text-sm font-semibold text-foreground">Key indicators</span>
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
                        <span className="text-semantic-success mt-0.5">✓</span>
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-semantic-success mt-0.5">✓</span>
                      <span>Content matched topic criteria</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-semantic-success mt-0.5">✓</span>
                      <span>Signal-to-noise ratio above threshold</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-semantic-success mt-0.5">✓</span>
                      <span>Semantic similarity score acceptable</span>
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
          <span className="text-sm font-medium text-foreground">Assigned topic</span>
          <span className="text-sm font-semibold text-foreground">{data.topic_title}</span>
        </div>
      </div>
    </div>
  )
}
