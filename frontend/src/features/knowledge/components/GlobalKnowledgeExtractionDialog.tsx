import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button } from '@/shared/ui';
import { Sparkles } from 'lucide-react';
import { KnowledgeExtractionPanel } from './KnowledgeExtractionPanel';
import { useQueryClient } from '@tanstack/react-query';

export function GlobalKnowledgeExtractionDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full" aria-label="Extract knowledge globally">
          <Sparkles className="h-4 w-4 mr-2" />
          Extract Knowledge
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Extract Knowledge from All Messages</DialogTitle>
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
