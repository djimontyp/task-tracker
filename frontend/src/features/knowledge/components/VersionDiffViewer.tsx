import { useEffect, useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from '@/shared/ui';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { versioningService } from '../api/versioningService';
import { formatDiffChanges } from '../utils/diffFormatters';
import type { VersionDiff } from '../types';

interface VersionDiffViewerProps {
  entityType: 'topic' | 'atom';
  entityId: number;
  version: number;
  compareToVersion: number;
  onApprove?: () => void;
  onReject?: () => void;
}

export function VersionDiffViewer({
  entityType,
  entityId,
  version,
  compareToVersion,
  onApprove,
  onReject,
}: VersionDiffViewerProps) {
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDiff();
  }, [entityType, entityId, version, compareToVersion]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const fetchedDiff =
        entityType === 'topic'
          ? await versioningService.getTopicVersionDiff(entityId, version, compareToVersion)
          : await versioningService.getAtomVersionDiff(entityId, version, compareToVersion);
      setDiff(fetchedDiff);
    } catch (error) {
      console.error('Failed to load diff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      if (entityType === 'topic') {
        await versioningService.approveTopicVersion(entityId, version);
      } else {
        await versioningService.approveAtomVersion(entityId, version);
      }
      onApprove?.();
    } catch (error) {
      console.error('Failed to approve version:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      if (entityType === 'topic') {
        await versioningService.rejectTopicVersion(entityId, version);
      } else {
        await versioningService.rejectAtomVersion(entityId, version);
      }
      onReject?.();
    } catch (error) {
      console.error('Failed to reject version:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!diff) {
    return <div className="text-center p-4 text-gray-500">No diff available</div>;
  }

  const { added, removed, modified } = formatDiffChanges(diff.changes);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Version {compareToVersion} → Version {version}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={actionLoading}
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
        {diff.summary && (
          <p className="text-sm text-gray-600 mt-2">{diff.summary}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex gap-2">
          {added.length > 0 && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              +{added.length} added
            </Badge>
          )}
          {removed.length > 0 && (
            <Badge variant="default" className="bg-red-500 hover:bg-red-600">
              -{removed.length} removed
            </Badge>
          )}
          {modified.length > 0 && (
            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
              {modified.length} modified
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {modified.map((change, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 py-2 text-sm font-medium">
                {change.field}
              </div>
              <ReactDiffViewer
                oldValue={change.oldValue}
                newValue={change.newValue}
                splitView={false}
                useDarkTheme={false}
                hideLineNumbers
              />
            </div>
          ))}

          {added.length > 0 && (
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-green-700 mb-2">Added</h4>
              <ul className="space-y-1">
                {added.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {removed.length > 0 && (
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-medium text-red-700 mb-2">Removed</h4>
              <ul className="space-y-1">
                {removed.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
