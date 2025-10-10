/**
 * Proposal API Service
 */

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

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

class ProposalService {
  /**
   * List all proposals with optional filters
   */
  async listProposals(params?: ProposalFilters): Promise<ProposalListResponse> {
    const queryParams = new URLSearchParams()
    if (params?.run_id) queryParams.set('run_id', params.run_id)
    if (params?.status) queryParams.set('status', params.status)
    if (params?.confidence_min !== undefined)
      queryParams.set('confidence_min', params.confidence_min.toString())
    if (params?.confidence_max !== undefined)
      queryParams.set('confidence_max', params.confidence_max.toString())
    if (params?.skip !== undefined) queryParams.set('skip', params.skip.toString())
    if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString())

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.proposals}?${queryParams.toString()}`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch proposals: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get single proposal by ID
   */
  async getProposal(proposalId: string): Promise<TaskProposal> {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.proposal(proposalId)}`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Proposal not found')
      }
      throw new Error(`Failed to fetch proposal: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Approve proposal
   */
  async approveProposal(
    proposalId: string,
    data?: ApproveProposalRequest
  ): Promise<TaskProposal> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.proposal(proposalId)}/approve`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Failed to approve proposal')
    }

    return response.json()
  }

  /**
   * Reject proposal
   */
  async rejectProposal(
    proposalId: string,
    data: RejectProposalRequest
  ): Promise<TaskProposal> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.proposal(proposalId)}/reject`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Failed to reject proposal')
    }

    return response.json()
  }

  /**
   * Merge proposal with existing task
   */
  async mergeProposal(
    proposalId: string,
    data: MergeProposalRequest
  ): Promise<TaskProposal> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.proposal(proposalId)}/merge`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Failed to merge proposal')
    }

    return response.json()
  }

  /**
   * Update proposal
   */
  async updateProposal(
    proposalId: string,
    data: UpdateProposalRequest
  ): Promise<TaskProposal> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.proposal(proposalId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || 'Failed to update proposal')
    }

    return response.json()
  }
}

export const proposalService = new ProposalService()
