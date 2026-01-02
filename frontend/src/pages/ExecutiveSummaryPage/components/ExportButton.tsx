/**
 * ExportButton Component
 *
 * T044: Button for exporting executive summary.
 */

import { useTranslation } from 'react-i18next';
import { Download, FileText, FileCode } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import type { ExportFormat } from '@/features/executive-summary/types';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  isExporting: boolean;
  disabled?: boolean;
}

export function ExportButton({
  onExport,
  isExporting,
  disabled = false,
}: ExportButtonProps) {
  const { t } = useTranslation('executiveSummary');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? t('actions.exporting') : t('actions.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('markdown')}>
          <FileCode className="h-4 w-4 mr-2" />
          {t('export.markdown')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('plain_text')}>
          <FileText className="h-4 w-4 mr-2" />
          {t('export.plainText')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportButton;
