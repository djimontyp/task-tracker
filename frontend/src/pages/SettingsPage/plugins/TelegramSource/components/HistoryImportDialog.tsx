import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { HistoryImportSection } from '@/features/onboarding/components/HistoryImportSection';
import { ImportProgress } from '@/features/onboarding/components/ImportProgress';
import { useHistoryImport } from '@/features/onboarding/hooks/useHistoryImport';
import { toast } from 'sonner';

export interface HistoryImportDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Dialog for importing Telegram message history
 *
 * Wraps HistoryImportSection and ImportProgress components
 * with Dialog UI. Closes automatically on completion.
 */
export function HistoryImportDialog({ open, onClose }: HistoryImportDialogProps) {
  const { t } = useTranslation('settings');

  const {
    status,
    progress,
    isImporting,
    startImport,
    cancelImport,
    reset,
    isStarting,
  } = useHistoryImport({
    onComplete: () => {
      toast.success(t('telegram.historyImport.completed'));
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Close dialog when import completes successfully
  useEffect(() => {
    if (status === 'completed' && open) {
      // Small delay to show completion state
      const timer = setTimeout(() => {
        onClose();
        reset();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, open, onClose, reset]);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      // Only reset if not currently importing
      if (!isImporting) {
        reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('telegram.historyImport.title')}</DialogTitle>
          <DialogDescription>
            {t('telegram.historyImport.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!isImporting ? (
            <HistoryImportSection
              onStartImport={startImport}
              isStarting={isStarting}
              className="border-0 shadow-none p-0"
            />
          ) : (
            <ImportProgress
              progress={progress}
              status={status}
              onCancel={cancelImport}
              className="border-0 shadow-none p-0"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HistoryImportDialog;
