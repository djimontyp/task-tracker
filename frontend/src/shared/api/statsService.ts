/**
 * Stats API Service
 *
 * Service for fetching application statistics including sidebar counts.
 */

import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'

export interface SidebarCounts {
  unclosed_runs: number
  pending_proposals: number
}

class StatsService {
  /**
   * Get sidebar notification counts
   *
   * Returns counts for:
   * - unclosed_runs: Analysis runs not closed (pending/running/completed/reviewed)
   * - pending_proposals: Task proposals awaiting review
   */
  async getSidebarCounts(): Promise<SidebarCounts> {
    const { data } = await apiClient.get<SidebarCounts>(API_ENDPOINTS.sidebarCounts)
    return data
  }
}

export const statsService = new StatsService()
