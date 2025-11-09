import { apiClient } from '@/shared/lib/api/client';
import type {
  TopicVersion,
  AtomVersion,
  VersionDiff,
  BulkVersionActionRequest,
  BulkVersionActionResponse,
  AutoApprovalRule,
  PendingVersionsCount
} from '../types';

export const versioningService = {
  async getTopicVersions(topicId: string): Promise<TopicVersion[]> {
    const response = await apiClient.get<TopicVersion[]>(
      `/api/v1/versions/topics/${topicId}/versions`
    );
    return response.data;
  },

  async getTopicVersionDiff(
    topicId: string,
    version: number,
    compareToVersion: number
  ): Promise<VersionDiff> {
    const response = await apiClient.get<VersionDiff>(
      `/api/v1/versions/topics/${topicId}/versions/${version}/diff`,
      { params: { compare_to: compareToVersion } }
    );
    return response.data;
  },

  async approveTopicVersion(topicId: string, version: number): Promise<TopicVersion> {
    const response = await apiClient.post<TopicVersion>(
      `/api/v1/versions/topics/${topicId}/versions/${version}/approve`,
      {}
    );
    return response.data;
  },

  async rejectTopicVersion(topicId: string, version: number): Promise<TopicVersion> {
    const response = await apiClient.post<TopicVersion>(
      `/api/v1/versions/topics/${topicId}/versions/${version}/reject`,
      {}
    );
    return response.data;
  },

  async getAtomVersions(atomId: number): Promise<AtomVersion[]> {
    const response = await apiClient.get<AtomVersion[]>(
      `/api/v1/versions/atoms/${atomId}/versions`
    );
    return response.data;
  },

  async getAtomVersionDiff(
    atomId: number,
    version: number,
    compareToVersion: number
  ): Promise<VersionDiff> {
    const response = await apiClient.get<VersionDiff>(
      `/api/v1/versions/atoms/${atomId}/versions/${version}/diff`,
      { params: { compare_to: compareToVersion } }
    );
    return response.data;
  },

  async approveAtomVersion(atomId: number, version: number): Promise<AtomVersion> {
    const response = await apiClient.post<AtomVersion>(
      `/api/v1/versions/atoms/${atomId}/versions/${version}/approve`,
      {}
    );
    return response.data;
  },

  async rejectAtomVersion(atomId: number, version: number): Promise<AtomVersion> {
    const response = await apiClient.post<AtomVersion>(
      `/api/v1/versions/atoms/${atomId}/versions/${version}/reject`,
      {}
    );
    return response.data;
  },

  async bulkApproveVersions(request: BulkVersionActionRequest): Promise<BulkVersionActionResponse> {
    const response = await apiClient.post<BulkVersionActionResponse>(
      '/api/v1/versions/bulk-approve',
      request
    );
    return response.data;
  },

  async bulkRejectVersions(request: BulkVersionActionRequest): Promise<BulkVersionActionResponse> {
    const response = await apiClient.post<BulkVersionActionResponse>(
      '/api/v1/versions/bulk-reject',
      request
    );
    return response.data;
  },

  async getAutoApprovalRule(): Promise<AutoApprovalRule> {
    const response = await apiClient.get<AutoApprovalRule>(
      '/api/v1/approval-rules'
    );
    return response.data;
  },

  async updateAutoApprovalRule(rule: AutoApprovalRule): Promise<AutoApprovalRule> {
    const response = await apiClient.post<AutoApprovalRule>(
      '/api/v1/approval-rules',
      rule
    );
    return response.data;
  },

  async getPendingVersionsCount(): Promise<PendingVersionsCount> {
    const response = await apiClient.get<PendingVersionsCount>(
      '/api/v1/versions/pending-count'
    );
    return response.data;
  },

  async previewAutoApprovalImpact(rule: AutoApprovalRule): Promise<{ affected_count: number }> {
    const response = await apiClient.post<{ affected_count: number }>(
      '/api/v1/approval-rules/preview',
      rule
    );
    return response.data;
  },
};
