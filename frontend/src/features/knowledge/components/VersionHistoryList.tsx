import React, { useEffect, useState } from 'react';
import { Card, Badge, Spinner } from '@/shared/ui';
import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { versioningService } from '../api/versioningService';
import type { TopicVersion, AtomVersion } from '../types';

interface VersionHistoryListProps {
  entityType: 'topic' | 'atom';
  entityId: number;
  onSelectVersion?: (version: number) => void;
}

export function VersionHistoryList({
  entityType,
  entityId,
  onSelectVersion,
}: VersionHistoryListProps) {
  const [versions, setVersions] = useState<(TopicVersion | AtomVersion)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [entityType, entityId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const fetchedVersions =
        entityType === 'topic'
          ? await versioningService.getTopicVersions(entityId)
          : await versioningService.getAtomVersions(entityId);
      setVersions(fetchedVersions);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No version history available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((version) => (
        <Card
          key={version.id}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => onSelectVersion?.(version.version)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">v{version.version}</div>

              {version.approved ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {new Date(version.created_at).toLocaleString()}
            </div>
          </div>

          {version.created_by && (
            <div className="mt-2 text-sm text-gray-500">
              By {version.created_by}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
