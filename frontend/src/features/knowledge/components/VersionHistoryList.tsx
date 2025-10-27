import { useEffect, useState } from 'react';
import { Card, Badge, Spinner } from '@/shared/ui';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { versioningService } from '../api/versioningService';
import { BulkVersionActions } from './BulkVersionActions';
import type { TopicVersion, AtomVersion } from '../types';

interface VersionHistoryListProps {
  entityType: 'topic' | 'atom';
  entityId: number;
  onSelectVersion?: (version: number) => void;
  enableBulkActions?: boolean;
}

export function VersionHistoryList({
  entityType,
  entityId,
  onSelectVersion,
  enableBulkActions = false,
}: VersionHistoryListProps) {
  const [versions, setVersions] = useState<(TopicVersion | AtomVersion)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersions, setSelectedVersions] = useState<Set<number>>(new Set());

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

  const toggleVersionSelection = (versionId: number) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVersions.size === versions.length) {
      setSelectedVersions(new Set());
    } else {
      setSelectedVersions(new Set(versions.map((v) => v.id)));
    }
  };

  const clearSelection = () => {
    setSelectedVersions(new Set());
  };

  const handleActionComplete = () => {
    loadVersions();
  };

  const getSelectedVersionObjects = () => {
    return versions.filter((v) => selectedVersions.has(v.id));
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

  const allSelected = selectedVersions.size === versions.length && versions.length > 0;
  const someSelected = selectedVersions.size > 0 && selectedVersions.size < versions.length;

  return (
    <div className="space-y-4">
      {enableBulkActions && (
        <>
          <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all versions"
                className={someSelected ? 'opacity-50' : ''}
              />
              <span className="text-sm font-medium">
                {allSelected ? 'Скасувати вибір усіх' : 'Вибрати всі'}
              </span>
            </div>
            {selectedVersions.size > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Очистити ({selectedVersions.size})
              </Button>
            )}
          </div>

          <BulkVersionActions
            selectedVersions={getSelectedVersionObjects()}
            entityType={entityType}
            onActionComplete={handleActionComplete}
            onClearSelection={clearSelection}
          />
        </>
      )}

      <div className="space-y-2">
        {versions.map((version) => {
          const isSelected = selectedVersions.has(version.id);

          return (
            <Card
              key={version.id}
              className={`p-4 transition-colors ${
                enableBulkActions ? '' : 'cursor-pointer hover:bg-gray-50'
              } ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
              onClick={() => {
                if (!enableBulkActions) {
                  onSelectVersion?.(version.version);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {enableBulkActions && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleVersionSelection(version.id)}
                      aria-label={`Select version ${version.version}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

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
          );
        })}
      </div>
    </div>
  );
}
