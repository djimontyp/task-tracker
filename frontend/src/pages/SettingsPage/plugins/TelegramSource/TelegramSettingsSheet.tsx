import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('settings')
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
        toast.error(t('telegram.actions.clipboardUnavailable'))
        return
      }

      const text = await navigator.clipboard.readText()

      // Parse URL: strip protocol and path
      const parsed = text.replace(/^https?:\/\//i, '').split('/')[0].trim()
      if (!parsed) {
        toast.error(t('telegram.actions.clipboardEmpty'))
        return
      }

      setWebhookBaseUrl(parsed)
      toast.info(t('telegram.actions.pasted', { url: parsed }))

      // Auto-apply with the parsed URL directly (don't rely on state update)
      await handleUpdateWebhook(parsed)
      // Auto-test
      await handleTestConnection()
    } catch (error) {
      // Clipboard permission denied or other error
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('denied') || message.includes('permission')) {
        toast.error(t('telegram.actions.clipboardDenied'))
      } else {
        toast.error(t('telegram.actions.clipboardError', { message }))
      }
    }
  }

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return t('telegram.connection.justNow')
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return t('telegram.connection.minutesAgo', { count: minutes })
    const hours = Math.floor(minutes / 60)
    return t('telegram.connection.hoursAgo', { count: hours })
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
            <SheetTitle>{t('telegram.integration')}</SheetTitle>
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
                {connectionStatus === 'connected' ? t('telegram.status.connected') :
                 connectionStatus === 'warning' ? t('telegram.status.pending') :
                 connectionStatus === 'error' ? t('telegram.status.error') :
                 connectionStatus === 'checking' ? t('telegram.status.checking') : t('telegram.status.unknown')}
              </Badge>
            )}
          </div>
          <SheetDescription>
            {t('telegram.configureDescription')}
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
                  label={t('telegram.webhook.label')}
                  id="webhook-base-url"
                  description={computedWebhookUrl || t('telegram.webhook.description')}
                  error={hostValidationError || undefined}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0 flex-1">
                      <span className="inline-flex items-center px-4 h-10 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md">
                        https://
                      </span>
                      <Input
                        id="webhook-base-url"
                        placeholder={t('telegram.webhook.placeholder')}
                        value={webhookBaseUrl.replace(/^https?:\/\//, '')}
                        onChange={(event) => handleHostChange(event.target.value)}
                        autoComplete="off"
                        aria-label={t('telegram.webhook.label')}
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
                      aria-label={t('telegram.actions.testConnection')}
                      title={t('telegram.actions.testConnection')}
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
                      aria-label={t('telegram.actions.pasteUrl')}
                      title={t('telegram.actions.pasteUrl')}
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
                      {t('telegram.connection.lastChecked')} {formatRelativeTime(lastChecked)}
                      {connectionError && (
                        <span className={cn(
                          'ml-0.5',
                          connectionStatus === 'warning' ? 'text-status-validating' : 'text-destructive'
                        )}> {connectionError}</span>
                      )}
                    </p>
                  )}
                </FormField>

                {/* HTTPS requirement notice */}
                {!isActive && (
                  <div className="flex items-start gap-2 p-4 rounded-md bg-semantic-warning/10 border border-semantic-warning/20">
                    <AlertTriangle className="h-4 w-4 text-semantic-warning flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {t('telegram.webhook.httpsNotice')}
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
                  <h3 className="text-lg font-semibold">{t('telegram.groups.title', { count: groups.length })}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshNames}
                disabled={isRefreshingNames || groups.length === 0}
                aria-label={t('telegram.groups.refreshNames')}
              >
                {isRefreshingNames ? t('telegram.groups.refreshing') : t('telegram.groups.refreshNames')}
              </Button>
            </div>

            <FormField
              label={t('telegram.groups.addGroup')}
              id="new-group-id"
              error={
                inputValidation === 'invalid'
                  ? t('telegram.groups.invalidFormat')
                  : undefined
              }
            >
              <div className="flex gap-2">
                <Input
                  id="new-group-id"
                  placeholder={t('telegram.groups.addPlaceholder')}
                  value={newGroupId}
                  onChange={(e) => handleGroupInputChange(e.target.value)}
                  autoComplete="off"
                  aria-label={t('telegram.groups.addGroup')}
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
                  aria-label={t('telegram.groups.addGroup')}
                  className="shrink-0 self-start"
                >
                  {isAddingGroup ? t('telegram.groups.adding') : '+'}
                </Button>
              </div>
              {inputValidation === 'valid' && (
                <p className="text-xs text-semantic-success mt-2 flex items-center gap-2">
                  <Check className="h-3 w-3" />
                  {t('telegram.groups.validId')}
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
                      <Badge variant="outline" className="text-xs shrink-0">{t('telegram.groups.active')}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveGroup(group.id)}
                        disabled={removingGroupIds.has(group.id)}
                        className="h-11 w-11 shrink-0"
                        aria-label={t('telegram.channels.remove')}
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
                    {t('telegram.groups.refreshTip')}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-medium text-foreground mb-2">{t('telegram.groups.noGroups')}</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {t('telegram.groups.noGroupsDescription')}
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
            aria-label={t('telegram.webhook.deleteButton')}
            className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeletingWebhook ? t('telegram.webhook.deleting') : t('telegram.webhook.deleteButton')}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Confirmation dialog for webhook URL update */}
      <AlertDialog open={showUpdateConfirm} onOpenChange={setShowUpdateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('telegram.webhook.updateTitle')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>{t('telegram.webhook.updateDescription')}</p>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-muted rounded-md">
                    <span className="text-muted-foreground">{t('telegram.webhook.updateFrom')} </span>
                    <span className="font-mono text-xs break-all">{serverWebhookUrl}</span>
                  </div>
                  <div className="p-2 bg-muted rounded-md">
                    <span className="text-muted-foreground">{t('telegram.webhook.updateTo')} </span>
                    <span className="font-mono text-xs break-all">{computedWebhookUrl}</span>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {t('telegram.webhook.updateNotice')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('telegram.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUpdateConfirm(false)
                handleUpdateWebhook()
              }}
            >
              {t('telegram.webhook.updateButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for webhook deletion */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('telegram.webhook.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('telegram.webhook.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('telegram.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false)
                handleDeleteWebhook()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('telegram.webhook.deleteButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}

export default TelegramSettingsSheet
