import { apiClient } from '@/shared/lib/api/client';
import type { TopicVersion, AtomVersion, VersionDiff } from '../types';

export const versioningService = {
  async getTopicVersions(topicId: number): Promise<TopicVersion[]> {
    const response = await apiClient.get<TopicVersion[]>(
      `/api/v1/topics/${topicId}/versions`
    );
    return response.data;
  },

  async getTopicVersionDiff(
    topicId: number,
    version: number,
    compareToVersion: number
  ): Promise<VersionDiff> {
    const response = await apiClient.get<VersionDiff>(
      `/api/v1/topics/${topicId}/versions/${version}/diff`,
      { params: { compare_to: compareToVersion } }
    );
    return response.data;
  },

  async approveTopicVersion(topicId: number, version: number): Promise<TopicVersion> {
    const response = await apiClient.post<TopicVersion>(
      `/api/v1/topics/${topicId}/versions/${version}/approve`,
      {}
    );
    return response.data;
  },

  async rejectTopicVersion(topicId: number, version: number): Promise<TopicVersion> {
    const response = await apiClient.post<TopicVersion>(
      `/api/v1/topics/${topicId}/versions/${version}/reject`,
      {}
    );
    return response.data;
  },

  async getAtomVersions(atomId: number): Promise<AtomVersion[]> {
    const response = await apiClient.get<AtomVersion[]>(
      `/api/v1/atoms/${atomId}/versions`
    );
    return response.data;
  },

  async getAtomVersionDiff(
    atomId: number,
    version: number,
    compareToVersion: number
  ): Promise<VersionDiff> {
    const response = await apiClient.get<VersionDiff>(
      `/api/v1/atoms/${atomId}/versions/${version}/diff`,
      { params: { compare_to: compareToVersion } }
    );
    return response.data;
  },

  async approveAtomVersion(atomId: number, version: number): Promise<AtomVersion> {
    const response = await apiClient.post<AtomVersion>(
      `/api/v1/atoms/${atomId}/versions/${version}/approve`,
      {}
    );
    return response.data;
  },

  async rejectAtomVersion(atomId: number, version: number): Promise<AtomVersion> {
    const response = await apiClient.post<AtomVersion>(
      `/api/v1/atoms/${atomId}/versions/${version}/reject`,
      {}
    );
    return response.data;
  },
};
