/**
 * Proposal API Service
 */

import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import type {
  TaskProposal,
  ProposalListResponse,
  ProposalFilters,
  ApproveProposalRequest,
  RejectProposalRequest,
  MergeProposalRequest,
  UpdateProposalRequest,
} from '../types'

class ProposalService {
  /**
   * List all proposals with optional filters
   */
  async listProposals(params?: ProposalFilters): Promise<ProposalListResponse> {
    const { data } = await apiClient.get<ProposalListResponse>(
      API_ENDPOINTS.proposals,
      { params }
    )
    return data
  }

  /**
   * Get single proposal by ID
   */
  async getProposal(proposalId: string): Promise<TaskProposal> {
    const { data } = await apiClient.get<TaskProposal>(
      API_ENDPOINTS.proposal(proposalId)
    )
    return data
  }

  /**
   * Approve proposal
   */
  async approveProposal(
    proposalId: string,
    data?: ApproveProposalRequest
  ): Promise<TaskProposal> {
    const response = await apiClient.put<TaskProposal>(
      `${API_ENDPOINTS.proposal(proposalId)}/approve`,
      data || {}
    )
    return response.data
  }

  /**
   * Reject proposal
   */
  async rejectProposal(
    proposalId: string,
    data: RejectProposalRequest
  ): Promise<TaskProposal> {
    const response = await apiClient.put<TaskProposal>(
      `${API_ENDPOINTS.proposal(proposalId)}/reject`,
      data
    )
    return response.data
  }

  /**
   * Merge proposal with existing task
   */
  async mergeProposal(
    proposalId: string,
    data: MergeProposalRequest
  ): Promise<TaskProposal> {
    const response = await apiClient.put<TaskProposal>(
      `${API_ENDPOINTS.proposal(proposalId)}/merge`,
      data
    )
    return response.data
  }

  /**
   * Update proposal
   */
  async updateProposal(
    proposalId: string,
    data: UpdateProposalRequest
  ): Promise<TaskProposal> {
    const response = await apiClient.put<TaskProposal>(
      API_ENDPOINTS.proposal(proposalId),
      data
    )
    return response.data
  }
}

export const proposalService = new ProposalService()
