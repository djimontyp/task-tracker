import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button } from '@/shared/ui';
import { Sparkles } from 'lucide-react';
import { KnowledgeExtractionPanel } from './KnowledgeExtractionPanel';
import { useQueryClient } from '@tanstack/react-query';

export function GlobalKnowledgeExtractionDialog() {
  const { t } = useTranslation('atoms');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full" aria-label={t('extraction.globalAriaLabel')}>
          <Sparkles className="h-4 w-4 mr-2" />
          {t('extraction.extractKnowledge')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('extraction.fromAllMessages')}</DialogTitle>
        </DialogHeader>

        <KnowledgeExtractionPanel
          onComplete={() => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['topics'] });
            queryClient.invalidateQueries({ queryKey: ['atoms'] });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
