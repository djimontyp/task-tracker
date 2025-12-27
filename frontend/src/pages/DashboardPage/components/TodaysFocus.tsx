/**
 * TodaysFocus Component
 *
 * Displays top-3 priority atoms with PENDING_REVIEW status
 * that need user attention. Provides quick access to pending items.
 *
 * Design: Visual Designer audit - Focus card pattern
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Target,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  Diamond,
  Cog,
  FileText,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState } from '@/shared/patterns/EmptyState'
import { cn } from '@/shared/lib'
import { atom as atomColors } from '@/shared/tokens/colors'
import type { TodaysFocusProps, FocusAtom, FocusAtomType } from '../types'

// Atom type configuration with icons and colors
type AtomConfigItem = {
  icon: typeof AlertCircle
  label: string
  badgeClass: string
}

const ATOM_TYPE_CONFIG: Record<FocusAtomType, AtomConfigItem> = {
  TASK: {
    icon: FileText,
    label: 'Task',
    badgeClass: cn('gap-2', atomColors.requirement.border, atomColors.requirement.text, 'bg-atom-requirement/10'),
  },
  IDEA: {
    icon: Lightbulb,
    label: 'Idea',
    badgeClass: cn('gap-2', atomColors.insight.border, atomColors.insight.text, 'bg-atom-insight/10'),
  },
  QUESTION: {
    icon: HelpCircle,
    label: 'Question',
    badgeClass: cn('gap-2', atomColors.question.border, atomColors.question.text, 'bg-atom-question/10'),
  },
  DECISION: {
    icon: Diamond,
    label: 'Decision',
    badgeClass: cn('gap-2', atomColors.decision.border, atomColors.decision.text, 'bg-atom-decision/10'),
  },
  INSIGHT: {
    icon: Cog,
    label: 'Insight',
    badgeClass: cn('gap-2', atomColors.pattern.border, atomColors.pattern.text, 'bg-atom-pattern/10'),
  },
}

// Fallback for unknown types
const DEFAULT_CONFIG: AtomConfigItem = {
  icon: FileText,
  label: 'Item',
  badgeClass: 'gap-1.5 border-muted text-muted-foreground bg-muted/10',
}

const FocusItem = ({ atom }: { atom: FocusAtom }) => {
  const config = ATOM_TYPE_CONFIG[atom.atom_type] || DEFAULT_CONFIG
  const Icon = config.icon

  return (
    <Link
      to={`/atoms/${atom.id}`}
      className={cn(
        'flex items-start gap-4 rounded-lg border bg-card p-4',
        'transition-all duration-200',
        'hover:shadow-md hover:border-primary/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      {/* Atom type badge */}
      <Badge variant="outline" className={config.badgeClass}>
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {config.label}
      </Badge>

      {/* Title */}
      <span className="flex-1 text-sm font-medium text-foreground line-clamp-1">
        {atom.title}
      </span>
    </Link>
  )
}

const FocusSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 flex-1" />
      </div>
    ))}
  </div>
)

const TodaysFocus = ({ atoms, isLoading = false }: TodaysFocusProps) => {
  const { t } = useTranslation('dashboard')

  // Limit to top 3 items
  const displayAtoms = atoms?.slice(0, 3) ?? []

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" aria-hidden="true" />
            {t('todaysFocus.title')}
          </CardTitle>
          {!isLoading && displayAtoms.length > 0 && (
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link to="/atoms?status=pending_review">
                {t('todaysFocus.viewAll')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <FocusSkeleton />
        ) : displayAtoms.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title={t('todaysFocus.empty')}
            description={t('todaysFocus.emptyDescription')}
            variant="compact"
          />
        ) : (
          <div className="space-y-4" role="list" aria-label={t('todaysFocus.title')}>
            {displayAtoms.map((atom) => (
              <FocusItem key={atom.id} atom={atom} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TodaysFocus
