import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  Badge,
  Button,
  Separator,
  ScrollArea,
} from '@/shared/ui'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Diamond,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Ban,
  AlertTriangle,
  FileText,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { badges } from '@/shared/tokens/patterns'
import { cn } from '@/shared/lib'
import { format } from 'date-fns'
import type { Atom, AtomType } from '../types'

interface AtomDetailsSheetProps {
  atom: Atom | null
  isOpen: boolean
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  isApproving?: boolean
  isRejecting?: boolean
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

export const AtomDetailsSheet: React.FC<AtomDetailsSheetProps> = ({
  atom,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}) => {
  const { t } = useTranslation('atoms')

  if (!atom) return null

  const Icon = atomTypeIcons[atom.type] || AlertCircle
  const isPending = !atom.user_approved && !atom.archived

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
      return type.charAt(0).toUpperCase() + type.slice(1)
    }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-background border-l shadow-2xl">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("px-2 py-1 text-sm font-medium", badges.atom[atom.type])}>
                <Icon className="mr-2 h-4 w-4" />
                {getTypeLabel(atom.type)}
              </Badge>
              {atom.confidence && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(atom.confidence * 100)}% {t('atomDetails.confidence')}
                </Badge>
              )}
            </div>
            {/* Status Indicators */}
             {atom.user_approved && (
                <Badge className="bg-semantic-success text-white hover:bg-semantic-success">
                    <CheckCircle className="mr-1 h-3 w-3" /> {t('atomDetails.approved')}
                </Badge>
            )}
            {atom.archived && (
                <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" /> {t('atomDetails.rejected')}
                </Badge>
            )}
          </div>

          <SheetTitle className="text-xl font-bold leading-tight">
            {atom.title}
          </SheetTitle>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6">
            {/* Main Content */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t('details.content', 'Content')}
              </h4>
              <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-lg border">
                <p className="whitespace-pre-wrap leading-relaxed">{atom.content}</p>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <span className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        {t('card.created')}
                    </span>
                    <p className="text-sm font-medium">
                        {format(new Date(atom.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                </div>
                {/* Placeholder for Author/Source logic if available in atom meta */}
                 <div className="space-y-1">
                    <span className="flex items-center text-xs text-muted-foreground">
                         <MessageSquare className="mr-2 h-3.5 w-3.5" />
                         {t('card.source')}
                    </span>
                    <p className="text-sm font-medium text-primary hover:underline cursor-pointer">
                        {t('atomDetails.viewMessage')}
                    </p>
                </div>
            </div>

            {/* Version History Stub */}
             {atom.pending_versions_count > 0 && (
                <div className="bg-semantic-warning/10 p-4 rounded-lg border border-semantic-warning/20">
                    <div className="flex items-center gap-2 text-semantic-warning mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold text-sm">{t('atomDetails.versionHistory')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('atomDetails.pendingVersions', { count: atom.pending_versions_count })}
                    </p>
                    <Button variant="link" className="h-auto p-0 text-semantic-warning text-xs mt-2">
                        {t('atomDetails.reviewChanges')}
                    </Button>
                </div>
             )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {isPending && (
            <SheetFooter className="mt-6 pt-4 border-t flex-row gap-3 sm:justify-end">
             <Button
                variant="outline"
                className="flex-1 sm:flex-none border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onReject(atom.id)}
                disabled={isRejecting}
              >
                {isRejecting ? <span className="animate-spin mr-2">⏳</span> : <XCircle className="mr-2 h-4 w-4" />}
                {t('actions.reject')}
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-semantic-success hover:bg-semantic-success/90 text-white"
                onClick={() => onApprove(atom.id)}
                disabled={isApproving}
              >
                {isApproving ? <span className="animate-spin mr-2">⏳</span> : <CheckCircle className="mr-2 h-4 w-4" />}
                {t('actions.approve')}
              </Button>
            </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
