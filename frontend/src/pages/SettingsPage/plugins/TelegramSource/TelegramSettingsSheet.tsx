import { useState } from 'react'
import {
  Button,
  Input,
  Badge,
  Skeleton,
  Card,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/shared/ui'
import {
  CheckIcon,
  ClipboardIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { useTelegramSettings } from './useTelegramSettings'

interface TelegramSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const WEBHOOK_PATH = '/webhook/telegram'

const TelegramSettingsSheet = ({ open, onOpenChange }: TelegramSettingsSheetProps) => {
  const {
    isLoadingConfig,
    isSaving,
    isSettingWebhook,
    isDeletingWebhook,
    webhookBaseUrl,
    setWebhookBaseUrl,
    serverWebhookUrl,
    isActive,
    defaultBaseUrl,
    computedWebhookUrl,
    isValidBaseUrl,
    groups,
    newGroupId,
    setNewGroupId,
    isAddingGroup,
    isRefreshingNames,
    removingGroupIds,
    handleUpdateWebhook,
    handleDeleteWebhook,
    handleAddGroup,
    handleRemoveGroup,
    handleRefreshNames,
    isValidGroupId,
  } = useTelegramSettings()

  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false)
  const [inputValidation, setInputValidation] = useState<'valid' | 'invalid' | null>(null)

  const handleCopyWebhookUrl = async () => {
    const urlToCopy = serverWebhookUrl || computedWebhookUrl
    if (!urlToCopy) return

    try {
      await navigator.clipboard.writeText(urlToCopy)
      setCopiedWebhookUrl(true)
      toast.success('Webhook URL copied to clipboard')
      setTimeout(() => setCopiedWebhookUrl(false), 2000)
    } catch (error) {
      toast.error('Failed to copy URL')
    }
  }

  const handleGroupInputChange = (value: string) => {
    setNewGroupId(value)

    if (!value.trim()) {
      setInputValidation(null)
      return
    }

    setInputValidation(isValidGroupId(value) ? 'valid' : 'invalid')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto" aria-describedby="telegram-sheet-description">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Telegram Integration</SheetTitle>
            {!isLoadingConfig && (
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={cn(
                  'flex items-center gap-1.5',
                  isActive && 'bg-green-600 hover:bg-green-600 text-white border-green-600'
                )}
              >
                <div className={cn('h-2 w-2 rounded-full', isActive ? 'bg-white' : 'bg-gray-400')} />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
          <p id="telegram-sheet-description" className="text-sm text-muted-foreground mt-2">
            Configure your Telegram bot webhook URL and manage monitored groups for message tracking
          </p>
        </SheetHeader>

        <div className="space-y-8 mt-6">
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold mb-4">Webhook URL</h3>
            </div>

            {isLoadingConfig ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="webhook-base-url"
                      placeholder={defaultBaseUrl || 'your-domain.ngrok.io'}
                      value={webhookBaseUrl}
                      onChange={(event) => setWebhookBaseUrl(event.target.value)}
                      autoComplete="off"
                      aria-label="Webhook base URL"
                      className="flex-1 text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyWebhookUrl}
                      disabled={!serverWebhookUrl && !computedWebhookUrl}
                      className="shrink-0"
                      aria-label={copiedWebhookUrl ? 'Webhook URL copied' : 'Copy webhook URL to clipboard'}
                      title={copiedWebhookUrl ? 'Copied!' : 'Copy to clipboard'}
                    >
                      {copiedWebhookUrl ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <ClipboardIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Auto-appends {WEBHOOK_PATH}
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="default"
                    onClick={handleUpdateWebhook}
                    disabled={isSaving || isSettingWebhook || !isValidBaseUrl}
                    aria-label="Update and activate webhook"
                  >
                    {isSaving || isSettingWebhook ? 'Updating...' : 'Update Webhook'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Groups ({groups.length})</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshNames}
                disabled={isRefreshingNames || groups.length === 0}
                aria-label="Refresh Telegram group names"
              >
                {isRefreshingNames ? 'Refreshing…' : 'Refresh Names'}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="new-group-id"
                    placeholder="Paste group URL or enter -100XXXXXXXXX"
                    value={newGroupId}
                    onChange={(e) => handleGroupInputChange(e.target.value)}
                    autoComplete="off"
                    aria-label="Enter Telegram group ID or URL"
                    className={cn(
                      'flex-1',
                      inputValidation === 'valid' && 'border-green-500 focus-visible:ring-green-500',
                      inputValidation === 'invalid' && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputValidation === 'valid') {
                        handleAddGroup()
                      }
                    }}
                  />
                  {inputValidation === 'valid' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <CheckIcon className="h-3 w-3" />
                      Valid group ID
                    </p>
                  )}
                  {inputValidation === 'invalid' && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Invalid format. Paste a Telegram group link or enter -100XXXXXXXXX
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddGroup}
                  disabled={isAddingGroup || !newGroupId.trim() || inputValidation === 'invalid'}
                  aria-label="Add Telegram group to monitoring list"
                  className="shrink-0 self-start"
                >
                  {isAddingGroup ? 'Adding…' : '+'}
                </Button>
              </div>
            </div>

            {groups.length > 0 ? (
              <div className="space-y-3">
                {groups.map(group => (
                  <Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl shrink-0">🔵</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground break-words">
                            {group.name || `Group ${group.id}`}
                          </p>
                          {!group.name && (
                            <Badge variant="outline" className="text-xs shrink-0">Name Pending</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Active • Messages being monitored
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGroup(group.id)}
                        disabled={removingGroupIds.has(group.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                        aria-label={`Remove ${group.name || 'group'} from monitoring list`}
                      >
                        {removingGroupIds.has(group.id) ? (
                          'Removing…'
                        ) : (
                          <>
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
                {groups.some(g => !g.name) && (
                  <p className="text-xs text-muted-foreground">
                    Tip: Add bot as admin to group, then click "Refresh Names" to load names
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">No groups yet</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Paste a Telegram group URL or enter a group ID to start monitoring messages
                </p>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6 pt-6 border-t">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteWebhook}
            disabled={isDeletingWebhook || !isActive}
            aria-label="Delete webhook from Telegram"
            className="w-full sm:w-auto"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {isDeletingWebhook ? 'Deleting...' : 'Delete Webhook'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default TelegramSettingsSheet
