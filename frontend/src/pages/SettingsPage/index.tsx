import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { Copy, Check, Info, MessageSquare } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from '@/shared/ui'
import { useTheme } from '@/shared/components/ThemeProvider'
import { apiClient } from '@/shared/lib/api/client'
import { formatFullDate } from '@/shared/utils/date'
import { logger } from '@/shared/utils/logger'
import { API_ENDPOINTS } from '@/shared/config/api'

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

type ProtocolOption = 'http' | 'https'

interface TelegramGroupInfo {
  id: number
  name?: string | null
}

interface TelegramWebhookConfigDto {
  protocol: ProtocolOption
  host: string
  webhook_url?: string | null
  is_active: boolean
  last_set_at?: string | null
  groups?: TelegramGroupInfo[]
}

interface WebhookConfigResponseDto {
  telegram?: TelegramWebhookConfigDto | null
  default_protocol: ProtocolOption
  default_host: string
}

interface SetWebhookResponseDto {
  success: boolean
  webhook_url?: string | null
  message: string
  error?: string
}

const WEBHOOK_PATH = '/webhook/telegram'

const LOCAL_STORAGE_KEY = 'WEBHOOK_BASE_URL'

const normalizeInputUrl = (value: string) => value.trim()

const ensureProtocol = (value: string) =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`

const parseBaseUrl = (value: string): { protocol: ProtocolOption; host: string } => {
  const cleaned = normalizeInputUrl(value)
  if (!cleaned) {
    return { protocol: 'https', host: '' }
  }

  try {
    const url = new URL(ensureProtocol(cleaned))
    const protocol = url.protocol.replace(':', '')
    if (protocol !== 'http' && protocol !== 'https') {
      return { protocol: 'https', host: '' }
    }
    return { protocol, host: url.host }
  } catch {
    return { protocol: 'https', host: '' }
  }
}

const buildBaseUrl = (protocol: ProtocolOption, host: string) =>
  host ? `${protocol}://${host}` : ''

const buildWebhookUrl = (protocol: ProtocolOption, host: string) =>
  host ? `${protocol}://${host}${WEBHOOK_PATH}` : ''

const readLocalConfig = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return localStorage.getItem(LOCAL_STORAGE_KEY) || ''
}

const writeLocalConfig = (baseUrl: string) => {
  if (typeof window === 'undefined') return

  localStorage.setItem(LOCAL_STORAGE_KEY, normalizeInputUrl(baseUrl))
}

const extractErrorMessage = (error: unknown) => {
  const fallback = 'Unexpected error. Please try again.'
  if (!error || typeof error !== 'object') return fallback

  const axiosError = error as AxiosError<{ detail?: string; message?: string; error?: string }>
  const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message || axiosError.response?.data?.error
  if (detail) return detail

  return axiosError.message || fallback
}

const SettingsPage = () => {
  const { theme, setTheme } = useTheme()

  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSettingWebhook, setIsSettingWebhook] = useState(false)
  const [isDeletingWebhook, setIsDeletingWebhook] = useState(false)

  const [webhookBaseUrl, setWebhookBaseUrl] = useState('')
  const [serverWebhookUrl, setServerWebhookUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [lastSetAt, setLastSetAt] = useState<string | null>(null)
  const [defaultBaseUrl, setDefaultBaseUrl] = useState('')
  const [groups, setGroups] = useState<TelegramGroupInfo[]>([])
  const [newGroupId, setNewGroupId] = useState('')
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [isRefreshingNames, setIsRefreshingNames] = useState(false)
  const [removingGroupIds, setRemovingGroupIds] = useState<Set<number>>(new Set())
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false)

  const { protocol, host } = useMemo(() => parseBaseUrl(webhookBaseUrl), [webhookBaseUrl])
  const computedWebhookUrl = useMemo(
    () => buildWebhookUrl(protocol, host),
    [host, protocol]
  )
  const isValidBaseUrl = Boolean(host)

  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true)
    try {
      const response = await apiClient.get<WebhookConfigResponseDto>(API_ENDPOINTS.webhookSettings)
      const data = response.data

      const backendBaseUrl = buildBaseUrl(
        data.telegram?.protocol || data.default_protocol,
        data.telegram?.host || data.default_host || ''
      )

      const localConfig = readLocalConfig()
      const resolvedBaseUrl = localConfig || backendBaseUrl

      setDefaultBaseUrl(buildBaseUrl(data.default_protocol, data.default_host))
      setWebhookBaseUrl(resolvedBaseUrl)
      setServerWebhookUrl(data.telegram?.webhook_url || null)
      setIsActive(Boolean(data.telegram?.is_active))
      setLastSetAt(data.telegram?.last_set_at || null)

      const loadedGroups = data.telegram?.groups || []
      setGroups(loadedGroups)

      if (resolvedBaseUrl) {
        writeLocalConfig(resolvedBaseUrl)
      }
    } catch (error) {
      toast.error(`Failed to load webhook settings: ${extractErrorMessage(error)}`)
    } finally {
      setIsLoadingConfig(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    if (!isValidBaseUrl) {
      toast.error('Webhook URL must not be empty')
      return
    }

    setIsSaving(true)
    try {
      const { data } = await apiClient.post<TelegramWebhookConfigDto>(API_ENDPOINTS.webhookSettings, {
        protocol,
        host
      })

      const updatedBaseUrl = buildBaseUrl(data.protocol, data.host)
      setWebhookBaseUrl(updatedBaseUrl)
      setServerWebhookUrl(data.webhook_url || null)
      setIsActive(Boolean(data.is_active))
      setLastSetAt(data.last_set_at || null)
      writeLocalConfig(updatedBaseUrl)

      toast.success('Webhook settings saved')
    } catch (error) {
      toast.error(`Failed to save webhook settings: ${extractErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetWebhook = async () => {
    if (!isValidBaseUrl) {
      toast.error('Webhook URL must not be empty')
      return
    }

    setIsSettingWebhook(true)
    try {
      const { data } = await apiClient.post<SetWebhookResponseDto>(
        API_ENDPOINTS.telegramWebhook.set,
        {
          protocol,
          host
        }
      )

      if (data.success) {
        toast.success(data.message || 'Webhook activated')
        writeLocalConfig(buildBaseUrl(protocol, host))
        await loadConfig()
      } else {
        toast.error(data.error || data.message || 'Failed to activate webhook')
      }
    } catch (error) {
      toast.error(`Failed to activate webhook: ${extractErrorMessage(error)}`)
    } finally {
      setIsSettingWebhook(false)
    }
  }

  const handleDeleteWebhook = async () => {
    setIsDeletingWebhook(true)
    try {
      const { data } = await apiClient.delete<SetWebhookResponseDto>(
        API_ENDPOINTS.telegramWebhook.delete
      )

      if (data.success) {
        toast.success(data.message || 'Webhook deleted')
        await loadConfig()
      } else {
        toast.error(data.error || data.message || 'Failed to delete webhook')
      }
    } catch (error) {
      toast.error(`Failed to delete webhook: ${extractErrorMessage(error)}`)
    } finally {
      setIsDeletingWebhook(false)
    }
  }

  const handleAddGroup = async () => {
    let groupId = parseInt(newGroupId.trim(), 10)
    if (isNaN(groupId)) {
      toast.error('Please enter a valid group ID')
      return
    }

    // Convert URL format to API format for supergroups
    // URL: -2988379206 → API: -1002988379206
    if (groupId < 0 && !newGroupId.trim().startsWith('-100')) {
      const converted = parseInt(`-100${Math.abs(groupId)}`, 10)
      logger.debug(`Converting group ID from ${groupId} to ${converted}`)
      groupId = converted
    }

    setIsAddingGroup(true)
    try {
      const { data } = await apiClient.post<TelegramWebhookConfigDto>(
        API_ENDPOINTS.telegramWebhook.groups,
        { group_id: groupId }
      )

      setGroups(data.groups || [])
      setNewGroupId('')
      toast.success('Group added successfully')
    } catch (error) {
      toast.error(`Failed to add group: ${extractErrorMessage(error)}`)
    } finally {
      setIsAddingGroup(false)
    }
  }

  const handleRemoveGroup = async (groupId: number) => {
    setRemovingGroupIds(prev => new Set(prev).add(groupId))
    try {
      const { data } = await apiClient.delete<TelegramWebhookConfigDto>(
        API_ENDPOINTS.telegramWebhook.group(groupId)
      )

      setGroups(data.groups || [])
      toast.success('Group removed successfully')
    } catch (error) {
      toast.error(`Failed to remove group: ${extractErrorMessage(error)}`)
    } finally {
      setRemovingGroupIds(prev => {
        const next = new Set(prev)
        next.delete(groupId)
        return next
      })
    }
  }

  const handleRefreshNames = async () => {
    setIsRefreshingNames(true)
    try {
      const { data } = await apiClient.post<TelegramWebhookConfigDto>(
        API_ENDPOINTS.telegramWebhook.refreshNames
      )

      setGroups(data.groups || [])
      toast.success('Group names refreshed successfully')
    } catch (error) {
      toast.error(`Failed to refresh names: ${extractErrorMessage(error)}`)
    } finally {
      setIsRefreshingNames(false)
    }
  }

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
    <div className="space-y-6 sm:space-y-7 md:space-y-8">

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium text-foreground mb-4 block">Theme Preference</Label>
            <div className="flex flex-wrap gap-2">
              {themeOptions.map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className="flex-1 min-w-[96px] sm:flex-none"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Webhook Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Configure the Telegram webhook endpoint. Settings are stored in the backend and
            mirrored locally for convenience.
          </p>

          {isLoadingConfig ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Label htmlFor="webhook-base-url" className="text-sm font-medium text-foreground">
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
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/70">
                    Provide the publicly accessible base URL, for example <code className="text-xs bg-muted px-1 py-0.5 rounded">https://ecf34ba1bf9a.ngrok-free.app</code>.
                    The system will append <code className="text-xs bg-muted px-1 py-0.5 rounded">{WEBHOOK_PATH}</code> automatically.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-foreground">Final webhook URL</Label>
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
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Status</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${statusDotColor}`} />
                      <Badge variant={activeBadgeVariant}>{activeBadgeText}</Badge>
                    </div>
                    {lastSetFormatted && (
                      <span className="text-xs text-foreground/60">Last set: {lastSetFormatted}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/70">
                  <strong>Workflow:</strong> Save your changes first, then activate the webhook with Telegram
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isSaving || !isValidBaseUrl}
                  aria-label="Save webhook configuration settings"
                  title="Save your webhook base URL configuration"
                >
                  {isSaving ? 'Saving…' : 'Save settings'}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleSetWebhook}
                  disabled={isSettingWebhook || !isValidBaseUrl}
                  aria-label="Activate webhook with Telegram"
                  title="Register this webhook URL with Telegram Bot API"
                >
                  {isSettingWebhook ? 'Activating…' : 'Set & Activate'}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteWebhook}
                  disabled={isDeletingWebhook || !isActive}
                  aria-label="Delete webhook from Telegram"
                  title="Remove webhook configuration from Telegram Bot API"
                >
                  {isDeletingWebhook ? 'Deleting…' : 'Delete webhook'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={loadConfig}
                  disabled={isLoadingConfig}
                  aria-label="Refresh webhook configuration"
                  title="Reload configuration from server"
                >
                  Refresh
                </Button>
              </div>

            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Telegram Groups</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshNames}
              disabled={isRefreshingNames || groups.length === 0}
              aria-label="Refresh Telegram group names"
              title="Fetch the latest group names from Telegram"
            >
              {isRefreshingNames ? 'Refreshing…' : 'Refresh Names'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
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
                onClick={handleAddGroup}
                disabled={isAddingGroup || !newGroupId.trim()}
                aria-label="Add Telegram group to monitoring list"
                title="Add this group ID to your monitored groups"
              >
                {isAddingGroup ? 'Adding…' : 'Add Group'}
              </Button>
            </div>
            <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
              <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/70">
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
                        <MessageSquare className="h-5 w-5 text-blue-500" />
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
                        title={`Remove group ${group.id} from your monitored groups`}
                      >
                        {removingGroupIds.has(group.id) ? 'Removing…' : 'Remove'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              {groups.some(g => !g.name) && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-foreground/70">
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
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage