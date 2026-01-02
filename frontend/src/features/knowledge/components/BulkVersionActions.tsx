import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/ui/alert-dialog';
import { Check, X } from 'lucide-react';
import { versioningService } from '../api/versioningService';
import type { TopicVersion, AtomVersion } from '../types';
import { toast } from 'sonner';

interface BulkVersionActionsProps {
  selectedVersions: (TopicVersion | AtomVersion)[];
  entityType: 'topic' | 'atom';
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export function BulkVersionActions({
  selectedVersions,
  entityType,
  onActionComplete,
  onClearSelection,
}: BulkVersionActionsProps) {
  const { t } = useTranslation('atoms');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    setPendingAction(action);
    setShowConfirmDialog(true);
  };

  const confirmBulkAction = async () => {
    if (!pendingAction) return;

    setIsProcessing(true);
    const versionIds = selectedVersions.map((v) => v.id);

    const loadingToastId = toast.loading(
      t('versions.bulk.processing', { action: pendingAction === 'approve' ? t('versions.bulk.approving') : t('versions.bulk.rejecting'), count: versionIds.length })
    );

    try {
      const response = pendingAction === 'approve'
        ? await versioningService.bulkApproveVersions({ version_ids: versionIds, entity_type: entityType })
        : await versioningService.bulkRejectVersions({ version_ids: versionIds, entity_type: entityType });

      const failureMessage = response.failed_ids.length > 0
        ? ` (${t('versions.bulk.failedCount', { count: response.failed_ids.length })})`
        : '';
      toast.success(
        t('versions.bulk.success', { action: pendingAction === 'approve' ? t('versions.bulk.approved') : t('versions.bulk.rejected'), count: response.success_count }) + failureMessage,
        { id: loadingToastId }
      );

      if (response.failed_ids.length > 0) {
        const errorDetails = Object.entries(response.errors)
          .map(([id, msg]) => `ID ${id}: ${msg}`)
          .join('\n');
        toast.error(`${t('versions.bulk.errors')}:\n${errorDetails}`, { duration: 8000 });
      }

      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error(
        t('versions.bulk.error', { action: pendingAction === 'approve' ? t('versions.bulk.approving') : t('versions.bulk.rejecting') }),
        { id: loadingToastId }
      );
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  if (selectedVersions.length === 0) return null;

  return (
    <>
      <div className="sticky top-0 z-sticky flex items-center justify-between gap-4 rounded-lg border bg-background p-4 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t('versions.selected', { count: selectedVersions.length })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('approve')}
            disabled={isProcessing}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            {t('actions.approveSelected')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('reject')}
            disabled={isProcessing}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t('actions.rejectSelected')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            {t('versions.clearSelection')}
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('versions.confirmDialog.title', { action: pendingAction === 'approve' ? t('versions.confirmDialog.approval') : t('versions.confirmDialog.rejection') })}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('versions.confirmDialog.message', { action: pendingAction === 'approve' ? t('versions.confirmDialog.approve') : t('versions.confirmDialog.reject'), count: selectedVersions.length })}
              </p>
              <div className="mt-4 max-h-32 overflow-y-auto rounded border p-2 text-xs">
                {selectedVersions.slice(0, 10).map((v) => (
                  <div key={v.id} className="text-muted-foreground">
                    {t('versions.confirmDialog.versionItem', { version: v.version, id: v.id })}
                  </div>
                ))}
                {selectedVersions.length > 10 && (
                  <div className="mt-2 text-muted-foreground">
                    {t('versions.confirmDialog.andMore', { count: selectedVersions.length - 10 })}
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm">{t('versions.confirmDialog.areYouSure')}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAction} disabled={isProcessing}>
              {isProcessing ? t('versions.confirmDialog.processing') : t('versions.confirmDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
