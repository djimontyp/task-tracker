import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { logger } from '@/shared/utils/logger'
import { useTelegramStore } from './useTelegramStore'

type ProtocolOption = 'http' | 'https'

export interface TelegramGroupInfo {
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

const clearLocalConfig = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}

const extractErrorMessage = (error: unknown) => {
  const fallback = 'Unexpected error. Please try again.'
  if (!error || typeof error !== 'object') return fallback

  const axiosError = error as AxiosError<{ detail?: string; message?: string; error?: string }>
  const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message || axiosError.response?.data?.error
  if (detail) return detail

  return axiosError.message || fallback
}

const parseGroupInput = (input: string): number | null => {
  const cleaned = input.trim()

  const urlMatch = cleaned.match(/(?:web\.telegram\.org|t\.me).*#?(-?\d+)/)
  if (urlMatch) {
    return parseInt(urlMatch[1], 10)
  }

  const directNumber = parseInt(cleaned, 10)
  if (!isNaN(directNumber)) {
    return directNumber
  }

  return null
}

const convertToLongFormat = (groupId: number): number => {
  if (groupId < 0 && groupId.toString().startsWith('-100')) {
    return groupId
  }

  if (groupId < 0) {
    return parseInt(`-100${Math.abs(groupId)}`, 10)
  }

  return groupId
}

const isValidGroupId = (input: string): boolean => {
  const parsed = parseGroupInput(input)
  return parsed !== null && parsed < 0
}

export const useTelegramSettings = () => {
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSettingWebhook, setIsSettingWebhook] = useState(false)
  const [isDeletingWebhook, setIsDeletingWebhook] = useState(false)

  const [webhookBaseUrl, setWebhookBaseUrl] = useState('')
  const [serverWebhookUrl, setServerWebhookUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [realWebhookUrl, setRealWebhookUrl] = useState<string | null>(null) // From Telegram API
  const [lastSetAt, setLastSetAt] = useState<string | null>(null)

  // Connection status from Zustand store (shared with TelegramCard)
  const {
    connectionStatus,
    lastChecked,
    connectionError,
    isOperationPending,
    setConnectionStatus,
    setLastChecked,
    setConnectionError,
    setOperationPending,
  } = useTelegramStore()

  // AbortController to cancel pending checkRealStatus requests
  const abortControllerRef = useRef<AbortController | null>(null)
  const [defaultBaseUrl, setDefaultBaseUrl] = useState('')
  const [groups, setGroups] = useState<TelegramGroupInfo[]>([])
  const [newGroupId, setNewGroupId] = useState('')
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [isRefreshingNames, setIsRefreshingNames] = useState(false)
  const [removingGroupIds, setRemovingGroupIds] = useState<Set<number>>(new Set())

  const { protocol, host } = useMemo(() => parseBaseUrl(webhookBaseUrl), [webhookBaseUrl])
  const computedWebhookUrl = useMemo(
    () => buildWebhookUrl(protocol, host),
    [host, protocol]
  )
  const isValidBaseUrl = Boolean(host)

  // Indicates whether a webhook URL was previously configured (for distinguishing
  // "never configured" from "configured but currently unreachable")
  const hasWebhookConfig = Boolean(serverWebhookUrl || realWebhookUrl)

  // Check real webhook status by pinging URL and querying Telegram API
  const checkRealStatus = useCallback(async () => {
    // Skip if an operation (delete/set webhook) is in progress
    if (isOperationPending) {
      return null
    }

    // Cancel any pending request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      // Step 1: Get Telegram API info first to check if webhook is configured
      const { data } = await apiClient.get<{
        success: boolean
        webhook_info?: {
          url?: string
          last_error_date?: number
          last_error_message?: string
          pending_update_count?: number
        }
        error?: string
      }>(API_ENDPOINTS.telegramWebhook.info, {
        signal: abortControllerRef.current.signal,
      })

      if (data.success && data.webhook_info) {
        const url = data.webhook_info.url || null
        setRealWebhookUrl(url)

        // If no URL configured, show error immediately
        if (!url) {
          setIsActive(false)
          setConnectionStatus('error')
          setConnectionError('No webhook URL configured')
          setLastChecked(new Date())
          return null
        }

        // Step 2: Ping the webhook URL to check if it's reachable
        const { data: pingData } = await apiClient.post<{
          success: boolean
          reachable: boolean
          error?: string
        }>(API_ENDPOINTS.telegramWebhook.ping, null, {
          signal: abortControllerRef.current.signal,
        })

        // If URL is not reachable, show error
        if (!pingData.reachable) {
          setIsActive(false)
          setConnectionStatus('error')
          setConnectionError(pingData.error || 'Webhook URL is not reachable')
          setLastChecked(new Date())
          return url
        }

        // Check if Telegram reports recent errors (within last 5 minutes)
        const hasRecentError = data.webhook_info.last_error_date &&
          (Date.now() / 1000 - data.webhook_info.last_error_date) < 300

        // Check if there are pending updates (indicates delivery issues)
        const hasPendingUpdates = (data.webhook_info.pending_update_count ?? 0) > 0

        // Determine status: connected (green), warning (yellow), error (red)
        const status = hasRecentError ? 'error' :
          hasPendingUpdates ? 'warning' :
          'connected'

        setIsActive(status === 'connected')
        setConnectionStatus(status)
        setConnectionError(
          hasRecentError ? data.webhook_info.last_error_message || 'Connection error' :
          hasPendingUpdates ? `${data.webhook_info.pending_update_count} pending updates` :
          null
        )
        setLastChecked(new Date())
        return url
      }
      setRealWebhookUrl(null)
      setIsActive(false)
      setConnectionStatus('error')
      setConnectionError('No webhook URL configured')
      setLastChecked(new Date())
      return null
    } catch (error) {
      // Ignore cancelled requests
      if (error instanceof Error && error.name === 'CanceledError') {
        return null
      }
      // If check fails, mark as error
      setConnectionStatus('error')
      setConnectionError('Failed to check webhook status')
      setLastChecked(new Date())
      return null
    }
  }, [isOperationPending, setConnectionStatus, setConnectionError, setLastChecked])

  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true)
    try {
      const response = await apiClient.get<WebhookConfigResponseDto>(API_ENDPOINTS.webhookSettings)
      const data = response.data

      // Backend is the source of truth for webhook URL
      // Only use default_host if telegram config doesn't exist at all
      // Empty string host means "not configured" - don't fallback to default
      const telegramHost = data.telegram?.host
      const hasExplicitHost = telegramHost !== undefined && telegramHost !== null
      const backendBaseUrl = hasExplicitHost && telegramHost
        ? buildBaseUrl(data.telegram?.protocol || 'https', telegramHost)
        : ''

      // Use backend URL, fallback to localStorage only if backend has no config
      const resolvedBaseUrl = backendBaseUrl || readLocalConfig()

      setDefaultBaseUrl(buildBaseUrl(data.default_protocol, data.default_host))
      setWebhookBaseUrl(resolvedBaseUrl)
      setServerWebhookUrl(data.telegram?.webhook_url || null)
      setLastSetAt(data.telegram?.last_set_at || null)

      const loadedGroups = data.telegram?.groups || []
      setGroups(loadedGroups)

      // Sync localStorage with backend
      if (backendBaseUrl) {
        writeLocalConfig(backendBaseUrl)
      }

      // Check real status from Telegram API (determines isActive)
      await checkRealStatus()
    } catch (error) {
      toast.error(`Failed to load webhook settings: ${extractErrorMessage(error)}`)
    } finally {
      setIsLoadingConfig(false)
    }
  }, [checkRealStatus])

  useEffect(() => {
    loadConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-check status when user returns to tab (debounced to prevent race conditions)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const onVisible = () => {
      if (!document.hidden && !isOperationPending) {
        // Debounce to prevent rapid re-checks
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => checkRealStatus(), 300)
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearTimeout(timeoutId)
    }
  }, [checkRealStatus, isOperationPending])

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
    const effectiveBaseUrl = webhookBaseUrl || defaultBaseUrl

    if (!effectiveBaseUrl) {
      toast.error('Webhook URL must not be empty')
      return
    }

    const { protocol: effectiveProtocol, host: effectiveHost } = parseBaseUrl(effectiveBaseUrl)

    if (!effectiveHost) {
      toast.error('Invalid webhook URL')
      return
    }

    // HTTPS validation for production webhooks (Telegram requires HTTPS)
    if (effectiveProtocol !== 'https') {
      toast.error('HTTPS is required for Telegram webhooks. Please use a secure URL.')
      return
    }

    // Lock to prevent checkRealStatus from running during operation
    setOperationPending(true)
    setIsSettingWebhook(true)

    try {
      const { data } = await apiClient.post<SetWebhookResponseDto>(
        API_ENDPOINTS.telegramWebhook.set,
        {
          protocol: effectiveProtocol,
          host: effectiveHost
        }
      )

      if (data.success) {
        toast.success(data.message || 'Webhook activated')
        writeLocalConfig(buildBaseUrl(effectiveProtocol, effectiveHost))
        // Unlock before loadConfig so checkRealStatus can run
        setOperationPending(false)
        await loadConfig()
      } else {
        toast.error(data.error || data.message || 'Failed to activate webhook')
      }
    } catch (error) {
      toast.error(`Failed to activate webhook: ${extractErrorMessage(error)}`)
    } finally {
      setIsSettingWebhook(false)
      // Ensure unlock even if loadConfig wasn't reached
      setOperationPending(false)
    }
  }

  const handleUpdateWebhook = async (overrideUrl?: string) => {
    // Use override URL if provided (for paste-and-apply), otherwise use current state
    const effectiveUrl = overrideUrl ?? webhookBaseUrl
    const { protocol: effectiveProtocol, host: effectiveHost } = parseBaseUrl(effectiveUrl)
    const effectiveIsValid = Boolean(effectiveHost)

    if (!effectiveIsValid) {
      toast.error('Webhook URL must not be empty')
      return
    }

    // HTTPS validation for production webhooks (Telegram requires HTTPS)
    if (effectiveProtocol !== 'https') {
      toast.error('HTTPS is required for Telegram webhooks. Please use a secure URL.')
      return
    }

    // Lock to prevent checkRealStatus from running during operation
    setOperationPending(true)
    setIsSaving(true)
    setIsSettingWebhook(true)

    try {
      const { data: savedConfig } = await apiClient.post<TelegramWebhookConfigDto>(
        API_ENDPOINTS.webhookSettings,
        { protocol: effectiveProtocol, host: effectiveHost }
      )

      const updatedBaseUrl = buildBaseUrl(savedConfig.protocol, savedConfig.host)
      setWebhookBaseUrl(updatedBaseUrl)
      setServerWebhookUrl(savedConfig.webhook_url || null)
      writeLocalConfig(updatedBaseUrl)

      const { data: activateResult } = await apiClient.post<SetWebhookResponseDto>(
        API_ENDPOINTS.telegramWebhook.set,
        { protocol: savedConfig.protocol, host: savedConfig.host }
      )

      if (activateResult.success) {
        toast.success('Webhook updated and activated successfully')
        // Unlock before loadConfig so checkRealStatus can run
        setOperationPending(false)
        await loadConfig()
      } else {
        toast.error(activateResult.error || 'Failed to activate webhook')
      }
    } catch (error) {
      toast.error(`Failed to update webhook: ${extractErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
      setIsSettingWebhook(false)
      // Ensure unlock even if loadConfig wasn't reached
      setOperationPending(false)
    }
  }

  const handleDeleteWebhook = async () => {
    // Lock to prevent checkRealStatus from overwriting status
    setOperationPending(true)
    setIsDeletingWebhook(true)

    try {
      const { data } = await apiClient.delete<SetWebhookResponseDto>(
        API_ENDPOINTS.telegramWebhook.delete
      )

      if (data.success) {
        // Immediately update local state to reflect disabled webhook
        setIsActive(false)
        // Set error state with "not configured" message - this maps to "Not configured" in TelegramCard
        setConnectionStatus('error')
        setConnectionError('No webhook URL configured')
        setRealWebhookUrl(null)
        setServerWebhookUrl(null)
        setWebhookBaseUrl('')
        clearLocalConfig()

        toast.success(data.message || 'Webhook deleted')
      } else {
        toast.error(data.error || data.message || 'Failed to delete webhook')
      }
    } catch (error) {
      toast.error(`Failed to delete webhook: ${extractErrorMessage(error)}`)
    } finally {
      setIsDeletingWebhook(false)
      // Delay unlock to prevent immediate checkRealStatus from overwriting
      setTimeout(() => setOperationPending(false), 500)
    }
  }

  const handleAddGroup = async () => {
    const parsedId = parseGroupInput(newGroupId)

    if (parsedId === null) {
      toast.error('Invalid group ID or URL. Paste a Telegram group link or enter -100XXXXXXXXX')
      return
    }

    if (parsedId >= 0) {
      toast.error('Group ID must be negative. Use format: -100XXXXXXXXX')
      return
    }

    const groupId = convertToLongFormat(parsedId)
    logger.debug(`Parsed group ID: ${parsedId}, converted to: ${groupId}`)

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

  interface TelegramWebhookInfoResult {
    url?: string
    has_custom_certificate?: boolean
    pending_update_count?: number
    last_error_date?: number
    last_error_message?: string
  }

  interface TelegramWebhookInfoResponse {
    success: boolean
    webhook_info?: TelegramWebhookInfoResult
    error?: string
  }

  const handleTestConnection = async () => {
    setConnectionStatus('checking')
    setConnectionError(null)

    try {
      // Step 1: Actively ping the webhook URL to check if it's reachable
      const { data: pingData } = await apiClient.post<{
        success: boolean
        reachable: boolean
        error?: string
        url?: string
        status_code?: number
      }>(API_ENDPOINTS.telegramWebhook.ping)

      setLastChecked(new Date())

      // If ping failed or URL is not reachable, show error immediately
      if (!pingData.success || !pingData.reachable) {
        setConnectionStatus('error')
        const errorMsg = pingData.error || 'Webhook URL is not reachable'
        setConnectionError(errorMsg)

        return {
          success: false,
          message: errorMsg,
          webhookUrl: pingData.url || null,
        }
      }

      // Step 2: If URL is reachable, also check Telegram API for additional info
      const { data } = await apiClient.get<TelegramWebhookInfoResponse>(
        API_ENDPOINTS.telegramWebhook.info
      )

      if (data.success && data.webhook_info) {
        const info = data.webhook_info
        const hasUrl = Boolean(info.url)

        // Check if Telegram reports recent errors (within last 5 minutes)
        const hasRecentError = info.last_error_date &&
          (Date.now() / 1000 - info.last_error_date) < 300

        // Check if there are pending updates (indicates delivery issues)
        const hasPendingUpdates = (info.pending_update_count ?? 0) > 0

        // Determine status: connected (green), warning (yellow), error (red)
        const status = !hasUrl ? 'error' :
          hasRecentError ? 'error' :
          hasPendingUpdates ? 'warning' :
          'connected'

        setConnectionStatus(status)
        setConnectionError(
          !hasUrl ? 'No webhook URL configured' :
          hasRecentError ? info.last_error_message || 'Connection error' :
          hasPendingUpdates ? `${info.pending_update_count} pending updates` :
          null
        )

        return {
          success: status === 'connected',
          webhookUrl: info.url || null,
          pendingUpdateCount: info.pending_update_count,
          lastErrorDate: info.last_error_date
            ? new Date(info.last_error_date * 1000).toISOString()
            : null,
          lastErrorMessage: info.last_error_message || null,
          message: !hasUrl
            ? 'No webhook URL configured in Telegram'
            : hasRecentError
              ? `Webhook error: ${info.last_error_message || 'Connection failed'}`
              : hasPendingUpdates
                ? `${info.pending_update_count} pending updates`
                : 'Webhook is active and responding',
        }
      }

      setConnectionStatus('error')
      const errorMsg = data.error || 'Failed to get webhook info'
      setConnectionError(errorMsg)

      return {
        success: false,
        message: errorMsg,
      }
    } catch (error) {
      setConnectionStatus('error')
      const errorMsg = extractErrorMessage(error)
      setConnectionError(errorMsg)
      setLastChecked(new Date())

      return {
        success: false,
        message: errorMsg,
      }
    }
  }

  return {
    isLoadingConfig,
    isSaving,
    isSettingWebhook,
    isDeletingWebhook,
    webhookBaseUrl,
    setWebhookBaseUrl,
    serverWebhookUrl,
    realWebhookUrl,
    isActive,
    hasWebhookConfig,
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
    // Connection status
    connectionStatus,
    lastChecked,
    connectionError,
    // Actions
    handleSave,
    handleSetWebhook,
    handleUpdateWebhook,
    handleDeleteWebhook,
    handleAddGroup,
    handleRemoveGroup,
    handleRefreshNames,
    handleTestConnection,
    checkRealStatus,
    loadConfig,
    parseGroupInput,
    convertToLongFormat,
    isValidGroupId,
  }
}
