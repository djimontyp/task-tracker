import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, Badge, Button, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Diamond,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Ban,
  AlertTriangle,
  FileText,
  RefreshCw,
  GitMerge,
  Link2,
} from 'lucide-react'
import { LanguageMismatchBadge } from '@/shared/components/LanguageMismatchBadge'
import { badges } from '@/shared/tokens/patterns'
import { MergeAtomDialog } from './MergeAtomDialog'
import type { Atom, AtomType } from '../types'

export interface AtomCardProps {
  atom: Atom
  className?: string
  onClick?: () => void
  isError?: boolean
  error?: Error
  onRetry?: () => void
  /** Project language for mismatch detection (defaults to 'uk') */
  projectLanguage?: string
  /** Slot for version history component - enables composition over cross-feature imports */
  versionHistorySlot?: React.ReactNode
}

const atomTypeIcons: Record<AtomType, React.ComponentType<{ className?: string }>> = {
  problem: AlertCircle,
  solution: CheckCircle,
  decision: Diamond,
  question: HelpCircle,
  insight: Lightbulb,
  idea: Sparkles,
  blocker: Ban,
  risk: AlertTriangle,
  requirement: FileText,
}

const DEFAULT_PROJECT_LANGUAGE = 'uk'

const AtomCard = React.forwardRef<HTMLDivElement, AtomCardProps>(
  ({ atom, className, onClick, isError, error, onRetry, projectLanguage = DEFAULT_PROJECT_LANGUAGE, versionHistorySlot }, ref) => {
    const { t } = useTranslation('atoms')
    const [showVersionHistory, setShowVersionHistory] = useState(false)
    const [showMergeDialog, setShowMergeDialog] = useState(false)

    // Check if atom has similar_to in meta (similarity 0.85-0.95)
    const similarAtomId = atom.meta?.similar_to as string | undefined
    const hasSimilar = !!similarAtomId

    // Check for similarity score from auto-linking
    const similarityScore = atom.similarity_score
    const isAutoLinked = similarityScore !== undefined && similarityScore !== null

    if (isError) {
      return (
        <Card ref={ref} className="p-4">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center gap-4 text-center py-6">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('card.error.title', 'Failed to load')}</p>
                {error && <p className="text-xs text-muted-foreground">{error.message}</p>}
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('card.error.retry', 'Retry')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    // Map atom types to translation keys where available, fallback to capitalized type
    const getTypeLabel = (type: AtomType): string => {
      const typeKeyMap: Partial<Record<AtomType, string>> = {
        decision: 'type.decision',
        question: 'type.question',
        insight: 'type.insight',
      }
      const key = typeKeyMap[type]
      if (key) {
        return t(key)
      }
      // Fallback for types not in translation file
      return type.charAt(0).toUpperCase() + type.slice(1)
    }

    // pending_versions_count comes from backend now (no N+1 queries!)
    const pendingVersionsCount = atom.pending_versions_count ?? 0

    const isFeatured = atom.confidence !== null && atom.confidence > 0.8
    // Featured atoms: always glow + stronger on hover
    // Regular atoms: no glow by default, subtle glow on hover
    const glowClass = isFeatured
      ? 'shadow-glow-sm hover:shadow-glow-md border-primary/50'
      : 'hover:shadow-glow-sm hover:border-primary/30'

    return (
      <Card
        ref={ref}
        className={cn(
          'p-4 transition-all duration-300',
          glowClass,
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={badges.atom[atom.type]}>
                {React.createElement(atomTypeIcons[atom.type], { className: 'h-3.5 w-3.5' })}
                {getTypeLabel(atom.type)}
              </Badge>
              <LanguageMismatchBadge
                detectedLanguage={atom.detected_language ?? undefined}
                expectedLanguage={projectLanguage}
              />
              {isAutoLinked && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          similarityScore >= 0.9 ? badges.semantic.success :
                          similarityScore >= 0.8 ? badges.semantic.info :
                          badges.semantic.warning,
                          'cursor-default'
                        )}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {t('card.percentMatch', '{{percent}}% match', { percent: Math.round(similarityScore * 100) })}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('card.autoLinkedTooltip', 'Auto-linked based on semantic similarity')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {hasSimilar && !isAutoLinked && (
                <Badge
                  variant="outline"
                  className={cn(badges.semantic.warning, 'cursor-default')}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {t('card.similar', 'Similar')}
                </Badge>
              )}
            </div>
            {atom.confidence !== null && (
              <span className="text-xs text-muted-foreground">
                {Math.round(atom.confidence * 100)}%
              </span>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-base mb-2 line-clamp-2">{atom.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3">{atom.content}</p>
          </div>

          {atom.user_approved && (
            <div className="flex items-center gap-2 text-semantic-success">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">{t('status.approved')}</span>
            </div>
          )}

          {pendingVersionsCount > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Badge className="text-xs bg-semantic-warning text-white hover:bg-semantic-warning/90">
                {t('card.pendingVersions', { count: pendingVersionsCount, defaultValue: `${pendingVersionsCount} pending version${pendingVersionsCount > 1 ? 's' : ''}` })}
              </Badge>
              {versionHistorySlot && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowVersionHistory(true)
                  }}
                  aria-label={t('card.viewHistory', 'View version history')}
                >
                  <Clock className="h-3 w-3 mr-2" />
                  {t('card.viewHistory', 'View History')}
                </Button>
              )}
            </div>
          )}

          {hasSimilar && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="h-11 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMergeDialog(true)
                }}
                aria-label={t('card.mergeAtom', 'Merge with similar atom')}
              >
                <GitMerge className="h-3 w-3 mr-2" />
                {t('card.merge', 'Merge')}
              </Button>
            </div>
          )}
        </div>

        {versionHistorySlot && (
          <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('card.versionHistoryTitle', { title: atom.title, defaultValue: `Version History - ${atom.title}` })}</DialogTitle>
              </DialogHeader>
              {versionHistorySlot}
            </DialogContent>
          </Dialog>
        )}

        {hasSimilar && similarAtomId && (
          <MergeAtomDialog
            open={showMergeDialog}
            onOpenChange={setShowMergeDialog}
            sourceAtom={atom}
            similarAtomId={similarAtomId}
          />
        )}
      </Card>
    )
  })

AtomCard.displayName = 'AtomCard'

export { AtomCard }
