import { useTranslation } from 'react-i18next'
import type { MessageInspectData } from '@/features/messages/types'

interface HistoryTabProps {
  data: MessageInspectData['history']
}

export function HistoryTab({ data }: HistoryTabProps) {
  const { t } = useTranslation('messages')

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-lg border border-border bg-muted p-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">
          {t('historyTab.placeholder.title')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('historyTab.placeholder.description')}
        </p>
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div>{t('historyTab.historyEvents', { count: data.length })}</div>
          {data.length > 0 && (
            <div>{t('historyTab.lastAction', { action: data[data.length - 1].action })}</div>
          )}
        </div>
      </div>
    </div>
  )
}
