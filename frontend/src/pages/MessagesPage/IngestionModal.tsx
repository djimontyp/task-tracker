import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Checkbox,
  Label,
  Input,
} from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import { apiClient } from '@/shared/lib/api/client'
import { toast } from 'sonner'
import { logger } from '@/shared/utils/logger'
import { API_ENDPOINTS } from '@/shared/config/api'

interface TelegramGroup {
  chat_id: string
  title: string
}

interface TelegramGroupConfig {
  id: string | number
  name?: string
}

interface IngestionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (jobId: number) => void
}

export function IngestionModal({ open, onClose, onSuccess }: IngestionModalProps) {
  const { t } = useTranslation('messages')
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [fetchingGroups, setFetchingGroups] = useState(false)

  useEffect(() => {
    logger.debug('IngestionModal open state changed:', open)
    if (open) {
      fetchGroups()
    }
  }, [open])

  const fetchGroups = async () => {
    setFetchingGroups(true)
    try {
      const response = await apiClient.get(API_ENDPOINTS.webhookSettings)
      const settings = response.data
      logger.debug('Webhook settings:', settings)

      if (settings?.telegram?.groups && settings.telegram.groups.length > 0) {
        const groupsList = settings.telegram.groups.map((g: TelegramGroupConfig) => ({
          chat_id: String(g.id),
          title: g.name || String(g.id),
        }))
        logger.debug('Parsed groups:', groupsList)
        setGroups(groupsList)
      } else {
        logger.warn('No groups found in settings')
        toast.warning(t('common:toast.warning.noGroups'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Failed to fetch groups:', message)
      toast.error(t('common:toast.error.loadFailed', { entity: 'Telegram groups' }))
    } finally {
      setFetchingGroups(false)
    }
  }

  const toggleGroup = (chatId: string) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId)
    } else {
      newSelected.add(chatId)
    }
    setSelectedGroups(newSelected)
  }

  const toggleAll = () => {
    if (selectedGroups.size === groups.length) {
      setSelectedGroups(new Set())
    } else {
      setSelectedGroups(new Set(groups.map(g => g.chat_id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedGroups.size === 0) {
      toast.error(t('common:toast.warning.selectGroup'))
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post(API_ENDPOINTS.ingestion.telegram, {
        chat_ids: Array.from(selectedGroups),
        limit,
      })

      toast.success(t('common:toast.success.started', { entity: t('common:toast.entities.ingestion') }))
      onSuccess(response.data.job_id)
      onClose()
    } catch (error) {
      let message = 'Unknown error'
      if (error instanceof Error) {
        message = error.message
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } }
        message = axiosError.response?.data?.detail || 'Request failed'
      }
      toast.error(t('common:toast.error.createFailed', { entity: t('common:toast.entities.ingestion') }) + `: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('ingestion.title')}</DialogTitle>
          <DialogDescription>
            {t('ingestion.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fetchingGroups ? (
            <div className="text-center py-4">{t('ingestion.loading', 'Loading groups...')}</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {t('ingestion.noGroups', 'No groups configured. Please add groups in Settings first.')}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Checkbox
                    id="select-all"
                    checked={selectedGroups.size === groups.length && groups.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <Label htmlFor="select-all" className="font-medium cursor-pointer">
                    {t('ingestion.selectAll', 'Select All')} ({groups.length} {t('ingestion.groups', 'groups')})
                  </Label>
                </div>

                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {groups.map((group) => (
                    <div key={group.chat_id} className="flex items-center space-x-2">
                      <Checkbox
                        id={group.chat_id}
                        checked={selectedGroups.has(group.chat_id)}
                        onCheckedChange={() => toggleGroup(group.chat_id)}
                      />
                      <Label htmlFor={group.chat_id} className="cursor-pointer flex-1">
                        {group.title}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({group.chat_id})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                label={t('ingestion.limitLabel', 'Messages limit per group')}
                description={t('ingestion.limitDescription', 'Maximum number of messages to fetch from each group (1-10000)')}
              >
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 1000)}
                  min={1}
                  max={10000}
                />
              </FormField>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('modal.close')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedGroups.size === 0 || groups.length === 0}
          >
            {loading ? t('ingestion.starting', 'Starting...') : t('ingestion.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
