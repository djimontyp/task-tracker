import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { apiClient } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/config/api'
import { logger } from '@/shared/utils/logger'

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

const extractErrorMessage = (error: unknown) => {
  const fallback = 'Unexpected error. Please try again.'
  if (!error || typeof error !== 'object') return fallback

  const axiosError = error as AxiosError<{ detail?: string; message?: string; error?: string }>
  const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message || axiosError.response?.data?.error
  if (detail) return detail

  return axiosError.message || fallback
}

export const useTelegramSettings = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  return {
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
  }
}
