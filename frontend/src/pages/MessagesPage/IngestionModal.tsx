import React, { useState, useEffect } from 'react'
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
import { apiClient } from '@/shared/lib/api/client'
import { toast } from 'sonner'

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
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [limit, setLimit] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [fetchingGroups, setFetchingGroups] = useState(false)

  useEffect(() => {
    console.log('IngestionModal open state changed:', open)
    if (open) {
      fetchGroups()
    }
  }, [open])

  const fetchGroups = async () => {
    setFetchingGroups(true)
    try {
      // Fetch webhook settings to get configured groups
      const response = await apiClient.get('/api/webhook-settings')
      const settings = response.data
      console.log('Webhook settings:', settings)
      
      if (settings?.telegram?.groups && settings.telegram.groups.length > 0) {
        const groupsList = settings.telegram.groups.map((g: TelegramGroupConfig) => ({
          chat_id: String(g.id),
          title: g.name || String(g.id),
        }))
        console.log('Parsed groups:', groupsList)
        setGroups(groupsList)
      } else {
        console.warn('No groups found in settings')
        toast.warning('No Telegram groups configured. Please set up groups in Settings first.')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Failed to fetch groups:', message)
      toast.error('Failed to load Telegram groups')
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
      toast.error('Please select at least one group')
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post('/api/v1/ingestion/telegram', {
        chat_ids: Array.from(selectedGroups),
        limit,
      })

      toast.success(`Ingestion started! Job ID: ${response.data.job_id}`)
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
      toast.error(`Failed to start ingestion: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ingest Messages from Telegram</DialogTitle>
          <DialogDescription>
            Select groups to fetch historical messages from. Messages will be checked for duplicates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fetchingGroups ? (
            <div className="text-center py-4">Loading groups...</div>
          ) : groups.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No groups configured. Please add groups in Settings → Telegram Settings first.
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
                    Select All ({groups.length} groups)
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

              <div className="space-y-2">
                <Label htmlFor="limit">Messages limit per group</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 1000)}
                  min={1}
                  max={10000}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of messages to fetch from each group (1-10000)
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedGroups.size === 0 || groups.length === 0}
          >
            {loading ? 'Starting...' : `Ingest from ${selectedGroups.size} group(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
