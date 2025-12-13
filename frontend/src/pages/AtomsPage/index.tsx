/**
 * Atoms Page - Daily Review Epic
 *
 * PM views atoms grouped by type, can approve/reject individually and in bulk.
 * Part of the Daily Review workflow for knowledge management.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
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
import AtomCard from '@/features/atoms/components/AtomCard'
import type { Atom, AtomType } from '@/features/atoms/types'
import { API_BASE_PATH } from '@/shared/config/api'

const atomTypeConfig: Record<AtomType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  problem: { icon: AlertCircle, label: 'Problems', color: 'text-semantic-error' },
  solution: { icon: CheckCircle, label: 'Solutions', color: 'text-semantic-success' },
  decision: { icon: Diamond, label: 'Decisions', color: 'text-semantic-info' },
  question: { icon: HelpCircle, label: 'Questions', color: 'text-semantic-warning' },
  insight: { icon: Lightbulb, label: 'Insights', color: 'text-primary' },
  pattern: { icon: Cog, label: 'Patterns', color: 'text-muted-foreground' },
  requirement: { icon: FileText, label: 'Requirements', color: 'text-foreground' },
}

const AtomsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedAtoms, setSelectedAtoms] = useState<Set<string>>(new Set())
  const [expandedAtomId, setExpandedAtomId] = useState<string | null>(null)
  const atomRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // URL param for expanding atom from search
  const expandAtomId = searchParams.get('expand')

  // Fetch atoms
  const { data: atomsData, isLoading } = useQuery({
    queryKey: ['atoms', 'pending'],
    queryFn: async () => {
      const response = await atomService.listAtoms(0, 200)
      // Filter to only pending review (not approved, not archived)
      return {
        ...response,
        items: response.items.filter(a => !a.user_approved && !a.archived)
      }
    },
  })

  const atoms = atomsData?.items ?? []

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
    mutationFn: async (atomIds: string[]) => {
      const response = await fetch(`${API_BASE_PATH}/atoms/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atom_ids: atomIds }),
      })
      if (!response.ok) throw new Error('Failed to approve atoms')
      return response.json()
    },
    onSuccess: (data) => {
      toast.success(`Approved ${data.approved_count} atoms`)
      setSelectedAtoms(new Set())
      queryClient.invalidateQueries({ queryKey: ['atoms'] })
    },
    onError: () => {
      toast.error('Failed to approve atoms')
    },
  })

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async (atomIds: string[]) => {
      const response = await fetch(`${API_BASE_PATH}/atoms/bulk-reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atom_ids: atomIds }),
      })
      if (!response.ok) throw new Error('Failed to reject atoms')
      return response.json()
    },
    onSuccess: (data) => {
      toast.success(`Rejected ${data.rejected_count} atoms`)
      setSelectedAtoms(new Set())
      queryClient.invalidateQueries({ queryKey: ['atoms'] })
    },
    onError: () => {
      toast.error('Failed to reject atoms')
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

  if (atoms.length === 0) {
    return (
      <PageWrapper>
        <EmptyState
          icon={Inbox}
          title="All done!"
          description="No pending atoms to review. Great job keeping up with your knowledge base."
        />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* Header with bulk actions */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Atoms Review</h1>
        <Badge variant="secondary" className="text-sm">
          {atoms.length} pending
        </Badge>

        <div className="flex-1" />

        {selectedAtoms.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedAtoms.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={clearSelection}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleBulkApprove}
              disabled={bulkApproveMutation.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkReject}
              disabled={bulkRejectMutation.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject Selected
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
              Approve All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRejectAll}
              disabled={bulkRejectMutation.isPending}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject All
            </Button>
          </div>
        )}
      </div>

      {/* Grouped atoms */}
      <div className="space-y-6">
        {Object.entries(groupedAtoms).map(([type, groupAtoms]) => {
          const config = atomTypeConfig[type as AtomType]
          const Icon = config?.icon || AlertCircle

          return (
            <Card key={type}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className={`h-5 w-5 ${config?.color || ''}`} />
                    {config?.label || type}
                    <Badge variant="secondary" className="ml-2">
                      {groupAtoms.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => selectAllInGroup(groupAtoms)}
                  >
                    Select All
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
                      <div className="absolute top-2 right-2 z-10">
                        <Checkbox
                          checked={selectedAtoms.has(String(atom.id))}
                          onCheckedChange={() => toggleSelection(String(atom.id))}
                          aria-label={`Select ${atom.title}`}
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
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(String(atom.id))}
                          className="h-8 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
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
    </PageWrapper>
  )
}

export default AtomsPage
