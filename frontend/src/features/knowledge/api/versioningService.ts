import { apiClient } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/config/api';
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
      API_ENDPOINTS.versions.topicVersions(topicId)
    );
    return response.data;
  },

  async getTopicVersionDiff(
    topicId: string,
    version: number,
    compareToVersion: number
  ): Promise<VersionDiff> {
    const response = await apiClient.get<VersionDiff>(
      API_ENDPOINTS.versions.topicVersionDiff(topicId, version),
      { params: { compare_to: compareToVersion } }
    );
    return response.data;
  },

  async approveTopicVersion(topicId: string, version: number): Promise<TopicVersion> {
    const response = await apiClient.post<TopicVersion>(
      API_ENDPOINTS.versions.topicVersionApprove(topicId, version),
      {}
    );
    return response.data;
  },

  async rejectTopicVersion(topicId: string, version: number): Promise<TopicVersion> {
    const response = await apiClient.post<TopicVersion>(
      API_ENDPOINTS.versions.topicVersionReject(topicId, version),
      {}
    );
    return response.data;
  },

  async getAtomVersions(atomId: string): Promise<AtomVersion[]> {
    const response = await apiClient.get<AtomVersion[]>(
      API_ENDPOINTS.versions.atomVersions(atomId)
    );
    return response.data;
  },

  async getAtomVersionDiff(
    atomId: string,
    version: number,
    compareToVersion: number
  ): Promise<VersionDiff> {
    const response = await apiClient.get<VersionDiff>(
      API_ENDPOINTS.versions.atomVersionDiff(atomId, version),
      { params: { compare_to: compareToVersion } }
    );
    return response.data;
  },

  async approveAtomVersion(atomId: string, version: number): Promise<AtomVersion> {
    const response = await apiClient.post<AtomVersion>(
      API_ENDPOINTS.versions.atomVersionApprove(atomId, version),
      {}
    );
    return response.data;
  },

  async rejectAtomVersion(atomId: string, version: number): Promise<AtomVersion> {
    const response = await apiClient.post<AtomVersion>(
      API_ENDPOINTS.versions.atomVersionReject(atomId, version),
      {}
    );
    return response.data;
  },

  async bulkApproveVersions(request: BulkVersionActionRequest): Promise<BulkVersionActionResponse> {
    const response = await apiClient.post<BulkVersionActionResponse>(
      API_ENDPOINTS.versions.bulkApprove,
      request
    );
    return response.data;
  },

  async bulkRejectVersions(request: BulkVersionActionRequest): Promise<BulkVersionActionResponse> {
    const response = await apiClient.post<BulkVersionActionResponse>(
      API_ENDPOINTS.versions.bulkReject,
      request
    );
    return response.data;
  },

  async getAutoApprovalRule(): Promise<AutoApprovalRule> {
    const response = await apiClient.get<AutoApprovalRule>(
      API_ENDPOINTS.approvalRules.list
    );
    return response.data;
  },

  async updateAutoApprovalRule(rule: AutoApprovalRule): Promise<AutoApprovalRule> {
    const response = await apiClient.post<AutoApprovalRule>(
      API_ENDPOINTS.approvalRules.create,
      rule
    );
    return response.data;
  },

  async getPendingVersionsCount(): Promise<PendingVersionsCount> {
    const response = await apiClient.get<PendingVersionsCount>(
      API_ENDPOINTS.versions.pendingCount
    );
    return response.data;
  },

  async previewAutoApprovalImpact(rule: AutoApprovalRule): Promise<{ affected_count: number }> {
    const response = await apiClient.post<{ affected_count: number }>(
      API_ENDPOINTS.approvalRules.preview,
      rule
    );
    return response.data;
  },
};
