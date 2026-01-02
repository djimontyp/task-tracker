import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from '@/shared/ui';
import { Check, X } from 'lucide-react';
import { versioningService } from '../api/versioningService';
import { formatDiffChanges } from '../utils/diffFormatters';
import type { VersionDiff } from '../types';

interface VersionDiffViewerProps {
  entityType: 'topic' | 'atom';
  entityId: string;
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
  const { t } = useTranslation('atoms');
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDiff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return <div className="text-center p-4 text-muted-foreground">{t('versions.diff.noDiff')}</div>;
  }

  const { added, removed, modified } = formatDiffChanges(diff.changes);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {t('versions.diff.comparison', { from: compareToVersion, to: version })}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={actionLoading}
            >
              <X className="h-4 w-4 mr-2" />
              {t('actions.reject')}
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              {t('actions.approve')}
            </Button>
          </div>
        </div>
        {diff.summary && (
          <p className="text-sm text-muted-foreground mt-2">{diff.summary}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex gap-2">
          {added.length > 0 && (
            <Badge variant="default" className="bg-semantic-success hover:bg-semantic-success/90">
              +{added.length} {t('versions.diff.added')}
            </Badge>
          )}
          {removed.length > 0 && (
            <Badge variant="default" className="bg-semantic-error hover:bg-semantic-error/90">
              -{removed.length} {t('versions.diff.removed')}
            </Badge>
          )}
          {modified.length > 0 && (
            <Badge variant="default" className="bg-semantic-warning hover:bg-semantic-warning/90">
              {modified.length} {t('versions.diff.modified')}
            </Badge>
          )}
        </div>

        <div className="space-y-4">
          {modified.map((change, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 text-sm font-medium">
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
            <div className="border-l-4 border-semantic-success pl-4">
              <h4 className="font-medium text-semantic-success mb-2">{t('versions.diff.addedTitle')}</h4>
              <ul className="space-y-2">
                {added.map((item, idx) => (
                  <li key={idx} className="text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {removed.length > 0 && (
            <div className="border-l-4 border-semantic-error pl-4">
              <h4 className="font-medium text-semantic-error mb-2">{t('versions.diff.removedTitle')}</h4>
              <ul className="space-y-2">
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
