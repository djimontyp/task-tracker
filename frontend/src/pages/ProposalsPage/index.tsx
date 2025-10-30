/**
 * Proposals Page - Review AI-generated task proposals
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Spinner,
  Input,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { proposalService } from '@/features/proposals/api/proposalService'
import { ProposalCard, RejectProposalDialog } from '@/features/proposals/components'
import type { ProposalFilters, ProposalListResponse } from '@/features/proposals/types'
import { toast } from 'sonner'
import { FunnelIcon } from '@heroicons/react/24/outline'

const ProposalsPage = () => {
  const queryClient = useQueryClient()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch proposals
  const { data, isLoading, error } = useQuery<ProposalListResponse>({
    queryKey: ['proposals', statusFilter, confidenceFilter],
    queryFn: async () => {
      const filters: ProposalFilters = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (confidenceFilter === 'low') {
        filters.confidence_min = 0
        filters.confidence_max = 0.7
      } else if (confidenceFilter === 'medium') {
        filters.confidence_min = 0.7
        filters.confidence_max = 0.9
      } else if (confidenceFilter === 'high') {
        filters.confidence_min = 0.9
        filters.confidence_max = 1.0
      }
      return proposalService.listProposals(filters)
    },
  })

  const proposals = data?.items ?? []
  const totalProposals = data?.total ?? proposals.length

  // Filter by search query
  const filteredProposals = proposals.filter((proposal) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      proposal.proposed_title.toLowerCase().includes(query) ||
      proposal.proposed_description.toLowerCase().includes(query) ||
      proposal.proposed_category.toLowerCase().includes(query) ||
      proposal.proposed_tags.some((tag) => tag.toLowerCase().includes(query)) ||
      proposal.reasoning.toLowerCase().includes(query)
    )
  })

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (proposalId: string) => proposalService.approveProposal(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success('Proposal approved successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve proposal')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ proposalId, reason }: { proposalId: string; reason: string }) =>
      proposalService.rejectProposal(proposalId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      toast.success('Proposal rejected')
      setRejectDialogOpen(false)
      setSelectedProposalId(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject proposal')
    },
  })

  const handleApprove = (proposalId: string) => {
    approveMutation.mutate(proposalId)
  }

  const handleReject = (proposalId: string) => {
    setSelectedProposalId(proposalId)
    setRejectDialogOpen(true)
  }

  const handleConfirmReject = (reason: string) => {
    if (selectedProposalId) {
      rejectMutation.mutate({ proposalId: selectedProposalId, reason })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Task Proposals</h1>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-1">Error loading data</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Proposals</h1>
          <p className="text-muted-foreground">
            Review and approve AI-generated task proposals from analysis runs
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="merged">Merged</SelectItem>
              </SelectContent>
            </Select>

            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="low">Low (&lt;70%)</SelectItem>
                <SelectItem value="medium">Medium (70-90%)</SelectItem>
                <SelectItem value="high">High (&gt;90%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
          <FunnelIcon className="h-4 w-4" />
          <span>
            Showing {filteredProposals.length} of {totalProposals} proposals
          </span>
        </div>
      </Card>

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              {totalProposals === 0
                ? 'Create an analysis run to generate task proposals'
                : 'Try adjusting your filters'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={
                approveMutation.isPending || rejectMutation.isPending
              }
            />
          ))}
        </div>
      )}

      <RejectProposalDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleConfirmReject}
        isLoading={rejectMutation.isPending}
      />
    </div>
  )
}

export default ProposalsPage
