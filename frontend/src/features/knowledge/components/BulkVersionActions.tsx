import { useState } from 'react';
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
      `${pendingAction === 'approve' ? 'Схвалення' : 'Відхилення'} ${versionIds.length} версій...`
    );

    try {
      const response = pendingAction === 'approve'
        ? await versioningService.bulkApproveVersions({ version_ids: versionIds, entity_type: entityType })
        : await versioningService.bulkRejectVersions({ version_ids: versionIds, entity_type: entityType });

      const failureMessage = response.failed_ids.length > 0
        ? ` (${response.failed_ids.length} помилок)`
        : '';
      toast.success(
        `Успішно ${pendingAction === 'approve' ? 'схвалено' : 'відхилено'} ${response.success_count} версій${failureMessage}`,
        { id: loadingToastId }
      );

      if (response.failed_ids.length > 0) {
        const errorDetails = Object.entries(response.errors)
          .map(([id, msg]) => `ID ${id}: ${msg}`)
          .join('\n');
        toast.error(`Помилки:\n${errorDetails}`, { duration: 8000 });
      }

      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error(
        `Помилка при ${pendingAction === 'approve' ? 'схваленні' : 'відхиленні'} версій`,
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
            Обрано: {selectedVersions.length} версій
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
            Схвалити вибрані
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('reject')}
            disabled={isProcessing}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Відхилити вибрані
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            Скасувати вибір
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Підтвердження {pendingAction === 'approve' ? 'схвалення' : 'відхилення'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Ви збираєтеся {pendingAction === 'approve' ? 'схвалити' : 'відхилити'}{' '}
                <strong>{selectedVersions.length}</strong> версій.
              </p>
              <div className="mt-4 max-h-32 overflow-y-auto rounded border p-2 text-xs">
                {selectedVersions.slice(0, 10).map((v) => (
                  <div key={v.id} className="text-muted-foreground">
                    • v{v.version} (ID: {v.id})
                  </div>
                ))}
                {selectedVersions.length > 10 && (
                  <div className="mt-2 text-muted-foreground">
                    ...та ще {selectedVersions.length - 10} версій
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm">Ви впевнені?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAction} disabled={isProcessing}>
              {isProcessing ? 'Обробка...' : 'Підтвердити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
