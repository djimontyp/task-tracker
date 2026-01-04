/**
 * Atoms Page - Daily Review Epic
 *
 * PM views atoms grouped by type, can approve/reject individually and in bulk.
 * Part of the Daily Review workflow for knowledge management.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  XCircle,
  Inbox,
  AlertCircle,
  Diamond,
  HelpCircle,
  Lightbulb,
  Cog,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageWrapper } from '@/shared/primitives'
import { Button, Badge, Checkbox, Skeleton } from '@/shared/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { EmptyState } from '@/shared/patterns'
import { atomService } from '@/features/atoms/api/atomService'
import { AtomCard } from '@/features/atoms/components/AtomCard'
import type { Atom, AtomType } from '@/features/atoms/types'
import { AtomsSmartFilters, type AtomCounts } from './AtomsSmartFilters'
import { useAtomFilterParams } from './useAtomFilterParams'

const atomTypeConfig: Record<AtomType, { icon: React.ComponentType<{ className?: string }>; labelKey: string; color: string }> = {
  problem: { icon: AlertCircle, labelKey: 'typeLabel.problem', color: 'text-semantic-error' },
  solution: { icon: CheckCircle, labelKey: 'typeLabel.solution', color: 'text-semantic-success' },
  decision: { icon: Diamond, labelKey: 'typeLabel.decision', color: 'text-semantic-info' },
  question: { icon: HelpCircle, labelKey: 'typeLabel.question', color: 'text-semantic-warning' },
  insight: { icon: Lightbulb, labelKey: 'typeLabel.insight', color: 'text-primary' },
  pattern: { icon: Cog, labelKey: 'typeLabel.pattern', color: 'text-muted-foreground' },
  requirement: { icon: FileText, labelKey: 'typeLabel.requirement', color: 'text-foreground' },
}

const AtomsPage: React.FC = () => {
  const { t } = useTranslation('atoms')
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedAtoms, setSelectedAtoms] = useState<Set<string>>(new Set())
  const [expandedAtomId, setExpandedAtomId] = useState<string | null>(null)
  const atomRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Smart Filters - URL-synchronized status filter
  const { statusFilter, setStatusFilter } = useAtomFilterParams()

  // URL param for expanding atom from search
  const expandAtomId = searchParams.get('expand')

  // Fetch all atoms (no server-side filtering)
  const { data: atomsData, isLoading } = useQuery({
    queryKey: ['atoms', 'all'],
    queryFn: async () => {
      const response = await atomService.listAtoms(0, 200)
      return response
    },
  })

  // Memoize allAtoms to prevent unnecessary recalculations
  const allAtoms = useMemo(() => atomsData?.items ?? [], [atomsData?.items])

  // Calculate counts for all statuses from the full list
  const counts: AtomCounts = useMemo(() => {
    const pending = allAtoms.filter(a => !a.user_approved && !a.archived).length
    const approved = allAtoms.filter(a => a.user_approved === true).length
    const rejected = allAtoms.filter(a => a.archived === true).length
    return {
      all: allAtoms.length,
      pending,
      approved,
      rejected,
    }
  }, [allAtoms])

  // Filter atoms based on current status filter
  const atoms = useMemo(() => {
    switch (statusFilter) {
      case 'pending':
        return allAtoms.filter(a => !a.user_approved && !a.archived)
      case 'approved':
        return allAtoms.filter(a => a.user_approved === true)
      case 'rejected':
        return allAtoms.filter(a => a.archived === true)
      case 'all':
      default:
        return allAtoms
    }
  }, [allAtoms, statusFilter])

  // Handle expand param from search navigation
  useEffect(() => {
    if (expandAtomId && atoms.length > 0) {
      // Expand and scroll to the atom
      setExpandedAtomId(expandAtomId)

      // Wait for DOM to update, then scroll
      requestAnimationFrame(() => {
        const atomElement = atomRefs.current.get(expandAtomId)
        if (atomElement) {
          atomElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Add a temporary highlight effect
          atomElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
          setTimeout(() => {
            atomElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
          }, 2000)
        }
      })

      // Clear the expand param from URL
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('expand')
      setSearchParams(newParams, { replace: true })
    }
  }, [expandAtomId, atoms, searchParams, setSearchParams])

  // Group atoms by type
  const groupedAtoms = useMemo(() => {
    const groups: Record<string, Atom[]> = {}
    for (const atom of atoms) {
      if (!groups[atom.type]) {
        groups[atom.type] = []
      }
      groups[atom.type].push(atom)
    }
    return groups
  }, [atoms])

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: (atomIds: string[]) => atomService.bulkApprove(atomIds),
    onSuccess: () => {
      toast.success(t('messages.approved'))
      setSelectedAtoms(new Set())
      queryClient.invalidateQueries({ queryKey: ['atoms'] })
    },
    onError: () => {
      toast.error(t('messages.approveError', 'Failed to approve atoms'))
    },
  })

  // Bulk reject (archive) mutation
  const bulkRejectMutation = useMutation({
    mutationFn: (atomIds: string[]) => atomService.bulkArchive(atomIds),
    onSuccess: () => {
      toast.success(t('messages.rejected'))
      setSelectedAtoms(new Set())
      queryClient.invalidateQueries({ queryKey: ['atoms'] })
    },
    onError: () => {
      toast.error(t('messages.rejectError', 'Failed to reject atoms'))
    },
  })

  // Single atom approve
  const handleApprove = useCallback(async (atomId: string) => {
    bulkApproveMutation.mutate([atomId])
  }, [bulkApproveMutation])

  // Single atom reject
  const handleReject = useCallback(async (atomId: string) => {
    bulkRejectMutation.mutate([atomId])
  }, [bulkRejectMutation])

  // Selection handlers
  const toggleSelection = useCallback((atomId: string) => {
    setSelectedAtoms(prev => {
      const next = new Set(prev)
      if (next.has(atomId)) {
        next.delete(atomId)
      } else {
        next.add(atomId)
      }
      return next
    })
  }, [])

  const selectAllInGroup = useCallback((groupAtoms: Atom[]) => {
    setSelectedAtoms(prev => {
      const next = new Set(prev)
      groupAtoms.forEach(a => next.add(String(a.id)))
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedAtoms(new Set())
  }, [])

  // Bulk actions
  const handleBulkApprove = useCallback(() => {
    if (selectedAtoms.size === 0) return
    bulkApproveMutation.mutate(Array.from(selectedAtoms))
  }, [selectedAtoms, bulkApproveMutation])

  const handleBulkReject = useCallback(() => {
    if (selectedAtoms.size === 0) return
    bulkRejectMutation.mutate(Array.from(selectedAtoms))
  }, [selectedAtoms, bulkRejectMutation])

  const handleApproveAll = useCallback(() => {
    if (atoms.length === 0) return
    bulkApproveMutation.mutate(atoms.map(a => String(a.id)))
  }, [atoms, bulkApproveMutation])

  const handleRejectAll = useCallback(() => {
    if (atoms.length === 0) return
    bulkRejectMutation.mutate(atoms.map(a => String(a.id)))
  }, [atoms, bulkRejectMutation])

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (allAtoms.length === 0) {
    return (
      <PageWrapper>
        <EmptyState
          icon={Inbox}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* Header with title */}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {/* Smart Filters */}
      <div className="mt-4">
        <AtomsSmartFilters
          counts={counts}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {/* Bulk actions toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Badge variant="secondary" className="text-sm">
          {t('plurals.atom', { count: atoms.length })}
        </Badge>

        <div className="flex-1" />

        {selectedAtoms.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('actions.selected', { count: selectedAtoms.size })}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={clearSelection}
            >
              {t('actions.clear', 'Clear')}
            </Button>
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={bulkApproveMutation.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t('actions.approveSelected', 'Approve Selected')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkReject}
              disabled={bulkRejectMutation.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              {t('actions.rejectSelected', 'Reject Selected')}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleApproveAll}
              disabled={bulkApproveMutation.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {t('actions.approveAll', 'Approve All')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRejectAll}
              disabled={bulkRejectMutation.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              {t('actions.rejectAll', 'Reject All')}
            </Button>
          </div>
        )}
      </div>

      {/* Empty state for filtered results */}
      {atoms.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={statusFilter === 'pending' ? Inbox : statusFilter === 'approved' ? CheckCircle : XCircle}
            title={t(`smartFilters.empty.${statusFilter}.title`, `No ${statusFilter} atoms`)}
            description={t(`smartFilters.empty.${statusFilter}.description`, `There are no ${statusFilter} atoms at the moment`)}
          />
        </div>
      )}

      {/* Grouped atoms */}
      {atoms.length > 0 && (
      <div className="space-y-6 mt-6">
        {Object.entries(groupedAtoms).map(([type, groupAtoms]) => {
          const config = atomTypeConfig[type as AtomType]
          const Icon = config?.icon || AlertCircle

          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className={`h-5 w-5 ${config?.color || ''}`} />
                    {config ? t(config.labelKey) : type}
                    <Badge variant="secondary" className="ml-2">
                      {groupAtoms.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => selectAllInGroup(groupAtoms)}
                  >
                    {t('actions.selectAll', 'Select All')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupAtoms.map(atom => (
                    <div
                      key={atom.id}
                      ref={(el) => {
                        if (el) atomRefs.current.set(String(atom.id), el)
                        else atomRefs.current.delete(String(atom.id))
                      }}
                      className={`relative transition-all duration-300 ${
                        expandedAtomId === String(atom.id) ? 'scale-[1.02]' : ''
                      }`}
                    >
                      {/* Selection checkbox */}
                      <div className="absolute top-2 right-2 z-dropdown">
                        <Checkbox
                          checked={selectedAtoms.has(String(atom.id))}
                          onCheckedChange={() => toggleSelection(String(atom.id))}
                          aria-label={t('actions.selectAriaLabel', { title: atom.title })}
                        />
                      </div>

                      {/* Atom card with approve/reject actions */}
                      <div className="pr-8">
                        <AtomCard atom={atom} />
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(String(atom.id))}
                          className="h-8 gap-2 text-semantic-success hover:text-semantic-success hover:bg-semantic-success/10"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t('actions.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(String(atom.id))}
                          className="h-8 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                          {t('actions.reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}
    </PageWrapper>
  )
}

export default AtomsPage
