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
  SheetDescription,
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
  ClipboardPaste,
  MessageSquare,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  XCircle,
  Circle,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/shared/lib/utils'
import { useTelegramSettings } from './useTelegramSettings'
import { FormField } from '@/shared/patterns'
import { BotInfoCard } from './components/BotInfoCard'
import { InstructionsCard } from './components/InstructionsCard'
import { ConnectionErrorState } from './components/ConnectionErrorState'

interface TelegramSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
    hasWebhookConfig,
    computedWebhookUrl,
    isValidBaseUrl,
    groups,
    newGroupId,
    setNewGroupId,
    isAddingGroup,
    isRefreshingNames,
    removingGroupIds,
    // Connection status
    connectionStatus,
    lastChecked,
    connectionError,
    // Actions
    handleUpdateWebhook,
    handleDeleteWebhook,
    handleAddGroup,
    handleRemoveGroup,
    handleRefreshNames,
    handleTestConnection,
    isValidGroupId,
  } = useTelegramSettings()

  // Track if connection check is in progress (needed before narrowing)
  const isCheckingConnection = connectionStatus === 'checking'

  // Show connection error state when webhook was configured but is now unreachable
  const showConnectionError = connectionStatus === 'error' && hasWebhookConfig && !isLoadingConfig

  const [inputValidation, setInputValidation] = useState<'valid' | 'invalid' | null>(null)
  const [hostValidationError, setHostValidationError] = useState<string | null>(null)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Auto-strip protocol prefix when pasting URL
  const handleHostChange = (value: string) => {
    const cleanedValue = value.replace(/^https?:\/\//i, '')
    setHostValidationError(null)
    setWebhookBaseUrl(cleanedValue)
  }

  // Paste from clipboard, auto-apply, and test connection
  const handlePasteAndApply = async () => {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard?.readText) {
        toast.error('Clipboard API not available in this browser')
        return
      }

      const text = await navigator.clipboard.readText()

      // Parse URL: strip protocol and path
      const parsed = text.replace(/^https?:\/\//i, '').split('/')[0].trim()
      if (!parsed) {
        toast.error('Clipboard is empty or contains invalid URL')
        return
      }

      setWebhookBaseUrl(parsed)
      toast.info(`Pasted: ${parsed}`)

      // Auto-apply with the parsed URL directly (don't rely on state update)
      await handleUpdateWebhook(parsed)
      // Auto-test
      await handleTestConnection()
    } catch (error) {
      // Clipboard permission denied or other error
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('denied') || message.includes('permission')) {
        toast.error('Clipboard access denied. Please allow clipboard permissions or paste manually.')
      } else {
        toast.error(`Failed to read clipboard: ${message}`)
      }
    }
  }

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
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
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Telegram Integration</SheetTitle>
            {!isLoadingConfig && (
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-2',
                  connectionStatus === 'connected' && 'border-status-connected text-status-connected',
                  connectionStatus === 'warning' && 'border-status-validating text-status-validating',
                  connectionStatus === 'error' && 'border-destructive text-destructive',
                  connectionStatus === 'checking' && 'border-status-validating text-status-validating',
                  connectionStatus === 'unknown' && 'border-muted text-muted-foreground'
                )}
              >
                {connectionStatus === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
                {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
                {connectionStatus === 'warning' && <AlertTriangle className="h-3 w-3" />}
                {connectionStatus === 'error' && <XCircle className="h-3 w-3" />}
                {connectionStatus === 'unknown' && <Circle className="h-3 w-3" />}
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'warning' ? 'Pending' :
                 connectionStatus === 'error' ? 'Error' :
                 connectionStatus === 'checking' ? 'Checking...' : 'Unknown'}
              </Badge>
            )}
          </div>
          <SheetDescription>
            Configure your Telegram bot webhook URL and manage monitored groups for message tracking
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 mt-6">
          {/* Bot Info Card - always visible */}
          <BotInfoCard />

          {/* Connection Error State - shown when configured but unreachable */}
          {showConnectionError && (
            <ConnectionErrorState
              webhookUrl={serverWebhookUrl || computedWebhookUrl}
              errorMessage={connectionError}
              onRetry={handleTestConnection}
              isRetrying={isCheckingConnection}
            />
          )}

          {/* Instructions Card - shown for first-time setup (never configured) */}
          {!isActive && !hasWebhookConfig && !isLoadingConfig && (
            <InstructionsCard />
          )}

          {/* Webhook configuration form - always visible so user can fix URL */}
          <div className="space-y-6">
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
                  description={computedWebhookUrl || 'Enter host to see full webhook URL'}
                  error={hostValidationError || undefined}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0 flex-1">
                      <span className="inline-flex items-center px-4 h-10 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                        https://
                      </span>
                      <Input
                        id="webhook-base-url"
                        placeholder="abc123.ngrok-free.app"
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
                    {/* Save/Update button */}
                    <Button
                      type="button"
                      variant="default"
                      size="icon"
                      onClick={isActive ? () => setShowUpdateConfirm(true) : () => handleUpdateWebhook()}
                      disabled={isSaving || isSettingWebhook || !isValidBaseUrl || !!hostValidationError}
                      className="shrink-0 h-10 w-10"
                      aria-label={isActive ? "Update webhook" : "Activate webhook"}
                      title={isActive ? "Update webhook" : "Activate webhook"}
                    >
                      {isSaving || isSettingWebhook ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                    {/* Test connection button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleTestConnection}
                      disabled={connectionStatus === 'checking'}
                      className="shrink-0 h-10 w-10"
                      aria-label="Test webhook connection"
                      title="Test connection"
                    >
                      {connectionStatus === 'checking' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    {/* Paste URL button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handlePasteAndApply}
                      className="shrink-0 h-10 w-10"
                      aria-label="Paste URL from clipboard and apply"
                      title="Paste URL"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Connection status line */}
                  {lastChecked && (
                    <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-2">
                      {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3 text-status-connected" />}
                      {connectionStatus === 'warning' && <AlertTriangle className="h-3 w-3 text-status-validating" />}
                      {connectionStatus === 'error' && <XCircle className="h-3 w-3 text-destructive" />}
                      Last checked: {formatRelativeTime(lastChecked)}
                      {connectionError && (
                        <span className={cn(
                          'ml-0.5',
                          connectionStatus === 'warning' ? 'text-status-validating' : 'text-destructive'
                        )}>• {connectionError}</span>
                      )}
                    </p>
                  )}
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
              </div>
            )}
          </div>

          {/* Groups section - always visible */}
          <>
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
              <div className="space-y-2">
                {groups.map((group, index) => (
                  <Card key={group.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-6 shrink-0">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {group.name || `Group ${group.id}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">Active</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGroup(group.id)}
                        disabled={removingGroupIds.has(group.id)}
                        className="h-8 w-8 shrink-0"
                        aria-label={`Remove ${group.name || 'group'} from monitoring list`}
                      >
                        {removingGroupIds.has(group.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
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
            </>
        </div>

        <SheetFooter className="mt-6 pt-6 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeletingWebhook || !hasWebhookConfig}
            aria-label="Delete webhook from Telegram"
            className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
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

      {/* Confirmation dialog for webhook deletion */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the webhook from Telegram and stop receiving messages.
              You can re-configure it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false)
                handleDeleteWebhook()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Webhook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

export default TelegramSettingsSheet
