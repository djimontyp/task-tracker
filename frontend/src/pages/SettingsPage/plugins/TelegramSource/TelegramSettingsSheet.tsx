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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'
import {
  Check,
  CheckCircle,
  Clipboard,
  MessageSquare,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { useTelegramSettings } from './useTelegramSettings'
import { FormField } from '@/shared/patterns'
import { BotInfoCard } from './components/BotInfoCard'
import { InstructionsCard } from './components/InstructionsCard'
import { TestConnectionButton } from './components/TestConnectionButton'

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
    handleUpdateWebhook,
    handleDeleteWebhook,
    handleAddGroup,
    handleRemoveGroup,
    handleRefreshNames,
    handleTestConnection,
    isValidGroupId,
  } = useTelegramSettings()

  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false)
  const [inputValidation, setInputValidation] = useState<'valid' | 'invalid' | null>(null)
  const [hostValidationError, setHostValidationError] = useState<string | null>(null)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)

  // Auto-strip protocol prefix when pasting URL
  const handleHostChange = (value: string) => {
    const cleanedValue = value.replace(/^https?:\/\//i, '')
    setHostValidationError(null)
    setWebhookBaseUrl(cleanedValue)
  }

  const handleCopyWebhookUrl = async () => {
    const urlToCopy = serverWebhookUrl || computedWebhookUrl
    if (!urlToCopy) return

    try {
      await navigator.clipboard.writeText(urlToCopy)
      setCopiedWebhookUrl(true)
      toast.success('Webhook URL copied to clipboard')
      setTimeout(() => setCopiedWebhookUrl(false), 2000)
    } catch {
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
                  'flex items-center gap-2',
                  isActive && 'bg-status-connected hover:bg-status-connected/90 text-white border-status-connected'
                )}
              >
                <div className={cn('h-2 w-2 rounded-full', isActive ? 'bg-white' : 'bg-muted-foreground')} />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
          <p id="telegram-sheet-description" className="text-sm text-muted-foreground mt-2">
            Configure your Telegram bot webhook URL and manage monitored groups for message tracking
          </p>
        </SheetHeader>

        <div className="space-y-8 mt-6">
          {/* Bot Info Card - always visible */}
          <BotInfoCard />

          {/* Instructions Card - shown for first-time setup */}
          {!isActive && !isLoadingConfig && (
            <InstructionsCard />
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Webhook URL</h3>
            </div>

            {isLoadingConfig ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : (
              <div className="space-y-6">
                <FormField
                  label="Webhook Host"
                  id="webhook-base-url"
                  description={`HTTPS required. Auto-appends ${WEBHOOK_PATH}`}
                  error={hostValidationError || undefined}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0 flex-1">
                      <span className="inline-flex items-center px-4 h-10 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                        https://
                      </span>
                      <Input
                        id="webhook-base-url"
                        placeholder={defaultBaseUrl?.replace(/^https?:\/\//, '') || 'your-domain.ngrok.io'}
                        value={webhookBaseUrl.replace(/^https?:\/\//, '')}
                        onChange={(event) => handleHostChange(event.target.value)}
                        autoComplete="off"
                        aria-label="Webhook host domain"
                        className={cn(
                          'flex-1 text-xs sm:text-sm rounded-l-none',
                          hostValidationError && 'border-semantic-error focus-visible:ring-semantic-error'
                        )}
                      />
                    </div>
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
                        <Check className="h-4 w-4" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormField>

                {/* HTTPS requirement notice */}
                {!isActive && (
                  <div className="flex items-start gap-2 p-4 rounded-md bg-semantic-warning/10 border border-semantic-warning/20">
                    <AlertTriangle className="h-4 w-4 text-semantic-warning flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Telegram requires HTTPS for webhook URLs. Use a service like ngrok for local development.
                    </p>
                  </div>
                )}

                {/* Current webhook info when active */}
                {isActive && serverWebhookUrl && (
                  <div className="space-y-2 p-4 rounded-md bg-muted/50 border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Webhook URL</span>
                      <Badge variant="outline" className="gap-2 border-status-connected text-status-connected">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground break-all font-mono">
                      {serverWebhookUrl}
                    </p>
                    {lastSetAt && (
                      <p className="text-xs text-muted-foreground">
                        Configured: {new Date(lastSetAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  {/* Show confirmation dialog for active webhook updates */}
                  {isActive && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setShowUpdateConfirm(true)}
                      disabled={isSaving || isSettingWebhook || !isValidBaseUrl || !!hostValidationError || webhookBaseUrl === serverWebhookUrl?.replace('/webhook/telegram', '').replace('https://', '')}
                      aria-label="Update webhook configuration"
                    >
                      {isSaving || isSettingWebhook ? 'Updating...' : 'Update Webhook'}
                    </Button>
                  )}
                  {/* Direct update for new setup */}
                  {!isActive && (
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleUpdateWebhook}
                      disabled={isSaving || isSettingWebhook || !isValidBaseUrl || !!hostValidationError}
                      aria-label="Activate webhook"
                    >
                      {isSaving || isSettingWebhook ? 'Activating...' : 'Activate Webhook'}
                    </Button>
                  )}
                </div>

                {/* Test Connection - shown when webhook is active */}
                {isActive && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-4">Connection Test</h4>
                    <TestConnectionButton
                      onTest={handleTestConnection}
                      disabled={!isActive}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-6">
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

            <FormField
              label="Add Group"
              id="new-group-id"
              error={
                inputValidation === 'invalid'
                  ? 'Invalid format. Paste a Telegram group link or enter -100XXXXXXXXX'
                  : undefined
              }
            >
              <div className="flex gap-2">
                <Input
                  id="new-group-id"
                  placeholder="Paste group URL or enter -100XXXXXXXXX"
                  value={newGroupId}
                  onChange={(e) => handleGroupInputChange(e.target.value)}
                  autoComplete="off"
                  aria-label="Enter Telegram group ID or URL"
                  className={cn(
                    'flex-1',
                    inputValidation === 'valid' && 'border-semantic-success focus-visible:ring-semantic-success',
                    inputValidation === 'invalid' && 'border-semantic-error focus-visible:ring-semantic-error'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValidation === 'valid') {
                      handleAddGroup()
                    }
                  }}
                />
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
              {inputValidation === 'valid' && (
                <p className="text-xs text-semantic-success mt-2 flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  Valid group ID
                </p>
              )}
            </FormField>

            {groups.length > 0 ? (
              <div className="space-y-4">
                {groups.map(group => (
                  <Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
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
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 shrink-0"
                        aria-label={`Remove ${group.name || 'group'} from monitoring list`}
                      >
                        {removingGroupIds.has(group.id) ? (
                          'Removing…'
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
                {groups.some(g => !g.name) && (
                  <p className="text-xs text-muted-foreground">
                    Tip: Add bot as admin to group, then click &quot;Refresh Names&quot; to load names
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium text-foreground mb-2">No groups yet</h4>
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
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeletingWebhook ? 'Deleting...' : 'Delete Webhook'}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Confirmation dialog for webhook URL update */}
      <AlertDialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Webhook URL?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>This will change your Telegram webhook configuration:</p>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-muted rounded-md">
                    <span className="text-muted-foreground">From: </span>
                    <span className="font-mono text-xs break-all">{serverWebhookUrl}</span>
                  </div>
                  <div className="p-2 bg-muted rounded-md">
                    <span className="text-muted-foreground">To: </span>
                    <span className="font-mono text-xs break-all">{computedWebhookUrl}</span>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Messages will be sent to the new URL immediately after the change.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUpdateConfirm(false)
                handleUpdateWebhook()
              }}
            >
              Update Webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

export default TelegramSettingsSheet
