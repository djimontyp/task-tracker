/**
 * SummaryPeriodSelector Component
 *
 * T048: Period selector for executive summary.
 */

import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Calendar } from 'lucide-react';
import type { SummaryPeriod, PeriodOption } from '@/features/executive-summary/types';

interface SummaryPeriodSelectorProps {
  value: SummaryPeriod;
  onChange: (value: SummaryPeriod) => void;
  options: PeriodOption[];
  disabled?: boolean;
}

export function SummaryPeriodSelector({
  value,
  onChange,
  options,
  disabled = false,
}: SummaryPeriodSelectorProps) {
  const { t } = useTranslation('executiveSummary');

  return (
    <Select
      value={value.toString()}
      onValueChange={(v) => onChange(parseInt(v, 10) as SummaryPeriod)}
      disabled={disabled}
    >
      <SelectTrigger className="w-48">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <SelectValue placeholder={t('periods.selectPeriod')} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SummaryPeriodSelector;
