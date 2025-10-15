import { useState, useMemo } from 'react'
import {
  Button,
  Input,
  Label,
  Badge,
  Skeleton,
  Card,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui'
import {
  CheckIcon,
  ClipboardIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { formatFullDate } from '@/shared/utils/date'
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
    lastSetAt,
    defaultBaseUrl,
    computedWebhookUrl,
    isValidBaseUrl,
    groups,
    newGroupId,
    setNewGroupId,
    isAddingGroup,
    isRefreshingNames,
    removingGroupIds,
    handleSave,
    handleSetWebhook,
    handleDeleteWebhook,
    handleAddGroup,
    handleRemoveGroup,
    handleRefreshNames,
    loadConfig,
  } = useTelegramSettings()

  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false)

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

  const activeBadgeVariant = isActive ? 'default' : 'secondary'
  const activeBadgeText = isActive ? 'Active' : 'Inactive'
  const statusDotColor = isActive ? 'bg-green-500' : 'bg-gray-400'
  const lastSetFormatted = useMemo(() => {
    if (!lastSetAt) return null
    try {
      return formatFullDate(lastSetAt)
    } catch (error) {
      return lastSetAt
    }
  }, [lastSetAt])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Telegram Settings</SheetTitle>
          <SheetDescription>
            Configure webhook endpoint and manage monitored groups
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Webhook Configuration</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Configure the Telegram webhook endpoint. Settings are stored in the backend and
                mirrored locally for convenience.
              </p>
            </div>

            {isLoadingConfig ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-40" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-base-url" className="text-sm font-medium">
                    Webhook Base URL
                  </Label>
                  <Input
                    id="webhook-base-url"
                    className="mt-2"
                    placeholder={defaultBaseUrl || 'https://ecf34ba1bf9a.ngrok-free.app'}
                    value={webhookBaseUrl}
                    onChange={(event) => setWebhookBaseUrl(event.target.value)}
                    autoComplete="off"
                    aria-label="Webhook base URL"
                    aria-describedby="webhook-url-help"
                  />
                  <div id="webhook-url-help" className="mt-2 flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Provide the publicly accessible base URL, for example <code className="text-xs bg-muted px-1 py-0.5 rounded">https://ecf34ba1bf9a.ngrok-free.app</code>.
                      The system will append <code className="text-xs bg-muted px-1 py-0.5 rounded">{WEBHOOK_PATH}</code> automatically.
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Final webhook URL</Label>
                  <div className="mt-2 flex items-center gap-2 p-3 bg-muted/50 rounded-md border border-border">
                    <code className="flex-1 text-sm font-mono text-foreground truncate">
                      {serverWebhookUrl || computedWebhookUrl || 'Not configured'}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyWebhookUrl}
                      disabled={!serverWebhookUrl && !computedWebhookUrl}
                      className="shrink-0"
                      aria-label={copiedWebhookUrl ? "Webhook URL copied" : "Copy webhook URL to clipboard"}
                      title={copiedWebhookUrl ? "Copied!" : "Copy to clipboard"}
                    >
                      {copiedWebhookUrl ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <ClipboardIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${statusDotColor}`} />
                      <Badge variant={activeBadgeVariant}>{activeBadgeText}</Badge>
                    </div>
                    {lastSetFormatted && (
                      <span className="text-xs text-muted-foreground">Last set: {lastSetFormatted}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <InformationCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <strong>Workflow:</strong> Save your changes first, then activate the webhook with Telegram
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !isValidBaseUrl}
                    aria-label="Save webhook configuration settings"
                  >
                    {isSaving ? 'Saving…' : 'Save settings'}
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSetWebhook}
                    disabled={isSettingWebhook || !isValidBaseUrl}
                    aria-label="Activate webhook with Telegram"
                  >
                    {isSettingWebhook ? 'Activating…' : 'Set & Activate'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteWebhook}
                    disabled={isDeletingWebhook || !isActive}
                    aria-label="Delete webhook from Telegram"
                  >
                    {isDeletingWebhook ? 'Deleting…' : 'Delete webhook'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={loadConfig}
                    disabled={isLoadingConfig}
                    aria-label="Refresh webhook configuration"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Telegram Groups</h3>
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
                <Input
                  id="new-group-id"
                  placeholder="-2988379206 (from URL) or -1002988379206"
                  value={newGroupId}
                  onChange={(event) => setNewGroupId(event.target.value)}
                  autoComplete="off"
                  aria-label="Enter Telegram group ID"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGroup()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddGroup}
                  disabled={isAddingGroup || !newGroupId.trim()}
                  aria-label="Add Telegram group to monitoring list"
                >
                  {isAddingGroup ? 'Adding…' : 'Add Group'}
                </Button>
              </div>
              <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Copy group ID from Telegram Web URL (e.g., <code className="text-xs bg-muted px-1 py-0.5 rounded">https://web.telegram.org/k/#-2988379206</code>)
                </p>
              </div>
            </div>

            {groups.length > 0 ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  {groups.map(group => (
                    <Card key={group.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500/10 shrink-0">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {group.name || `Group ${group.id}`}
                            </p>
                            {!group.name && (
                              <Badge variant="outline" className="text-xs shrink-0">Name Pending</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">ID: {group.id}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGroup(group.id)}
                          disabled={removingGroupIds.has(group.id)}
                          className="shrink-0"
                          aria-label={`Remove ${group.name || 'group'} from monitoring list`}
                        >
                          {removingGroupIds.has(group.id) ? 'Removing…' : 'Remove'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                {groups.some(g => !g.name) && (
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-2">To fetch group names:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Add the bot to your Telegram group as admin</li>
                        <li>Click "Refresh Names" button above</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No groups configured. Add a group ID above to start monitoring.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default TelegramSettingsSheet
