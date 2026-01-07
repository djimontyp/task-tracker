import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge, Button, Spinner } from '@/shared/ui'
import {
  AlertCircle,
  CheckCircle,
  Diamond,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Ban,
  AlertTriangle,
  FileText,
  GitMerge,
} from 'lucide-react'
import { badges } from '@/shared/tokens/patterns'
import { atomService } from '../api/atomService'
import type { Atom, AtomType } from '../types'
import { toast } from 'sonner'

interface MergeAtomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceAtom: Atom
  similarAtomId: string
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

/**
 * Dialog for merging similar atoms.
 * Shows both atoms side-by-side and allows user to choose which one to keep.
 */
export function MergeAtomDialog({
  open,
  onOpenChange,
  sourceAtom,
  similarAtomId,
}: MergeAtomDialogProps) {
  const { t } = useTranslation('atoms')
  const queryClient = useQueryClient()

  // Fetch similar atom data
  const {
    data: similarAtom,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['atom', similarAtomId],
    queryFn: () => atomService.getAtomById(similarAtomId),
    enabled: open && !!similarAtomId,
  })

  // Mutation to delete the atom that user doesn't want to keep
  const deleteMutation = useMutation({
    mutationFn: (atomId: string) => atomService.deleteAtom(atomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atoms'] })
      toast.success(t('merge.success', 'Atoms merged successfully'))
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(t('merge.error', 'Failed to merge atoms: {{error}}', { error: String(err) }))
    },
  })

  const handleKeepAtom = (_atomToKeep: Atom, atomToDelete: Atom) => {
    deleteMutation.mutate(atomToDelete.id)
  }

  const renderAtomCard = (atom: Atom, isSource: boolean) => {
    const TypeIcon = atomTypeIcons[atom.type]
    const similarity = isSource
      ? (sourceAtom.meta?.similarity_score as number | undefined)
      : undefined

    return (
      <Card className="flex-1 min-w-0">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="outline" className={badges.atom[atom.type]}>
              <TypeIcon className="h-3.5 w-3.5" />
              {atom.type.charAt(0).toUpperCase() + atom.type.slice(1)}
            </Badge>
            {atom.confidence !== null && (
              <span className="text-xs text-muted-foreground">
                {Math.round(atom.confidence * 100)}%
              </span>
            )}
          </div>
          <CardTitle className="text-base line-clamp-2">{atom.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-4">{atom.content}</p>

          {similarity !== undefined && (
            <div className="text-xs text-muted-foreground">
              {t('merge.similarity', 'Similarity')}: {Math.round(similarity * 100)}%
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {t('card.created', 'Created')}:{' '}
              {new Date(atom.created_at).toLocaleDateString()}
            </span>
          </div>

          <Button
            className="w-full h-11"
            onClick={() =>
              handleKeepAtom(atom, isSource ? similarAtom! : sourceAtom)
            }
            disabled={deleteMutation.isPending || !similarAtom}
            aria-label={t('merge.keepThis', 'Keep this atom')}
          >
            {deleteMutation.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {t('merge.keepThis', 'Keep this')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            {t('merge.title', 'Merge Similar Atoms')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'merge.description',
              'These atoms appear to be similar. Choose which one to keep - the other will be deleted.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {t('merge.loadError', 'Failed to load similar atom')}
              </p>
            </div>
          ) : similarAtom ? (
            <div className="flex flex-col sm:flex-row gap-4">
              {renderAtomCard(sourceAtom, true)}
              <div className="flex items-center justify-center">
                <div className="hidden sm:flex flex-col items-center gap-2 text-muted-foreground">
                  <span className="text-xs">{t('merge.vs', 'VS')}</span>
                </div>
                <div className="sm:hidden border-t border-border w-full" />
              </div>
              {renderAtomCard(similarAtom, false)}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11"
          >
            {t('actions.cancel', 'Cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
