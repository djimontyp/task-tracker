import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton
} from '@shared/ui'
import { useTheme } from '../../components/ThemeProvider'
import { cn } from '@/shared/lib/utils'
import { apiClient } from '@/shared/lib/api/client'

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' }
]

type ProtocolOption = 'http' | 'https'

interface TelegramWebhookConfigDto {
  protocol: ProtocolOption
  host: string
  webhook_url?: string | null
  is_active: boolean
  last_set_at?: string | null
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

const LOCAL_STORAGE_KEYS = {
  protocol: 'WEBHOOK_PROTOCOL',
  host: 'WEBHOOK_HOST'
} as const

const PROTOCOL_OPTIONS: ProtocolOption[] = ['https', 'http']

const sanitizeHost = (value: string) =>
  value.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim()

const readLocalConfig = () => {
  if (typeof window === 'undefined') {
    return { protocol: null as ProtocolOption | null, host: null as string | null }
  }

  const protocol = localStorage.getItem(LOCAL_STORAGE_KEYS.protocol) as ProtocolOption | null
  const host = localStorage.getItem(LOCAL_STORAGE_KEYS.host)

  return {
    protocol: protocol && PROTOCOL_OPTIONS.includes(protocol) ? protocol : null,
    host: host ? sanitizeHost(host) : null
  }
}

const writeLocalConfig = (protocol: ProtocolOption, host: string) => {
  if (typeof window === 'undefined') return

  localStorage.setItem(LOCAL_STORAGE_KEYS.protocol, protocol)
  localStorage.setItem(LOCAL_STORAGE_KEYS.host, sanitizeHost(host))
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
  const { theme, setTheme, effectiveTheme } = useTheme()

  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSettingWebhook, setIsSettingWebhook] = useState(false)
  const [isDeletingWebhook, setIsDeletingWebhook] = useState(false)

  const [protocol, setProtocol] = useState<ProtocolOption>('https')
  const [host, setHost] = useState('')
  const [serverWebhookUrl, setServerWebhookUrl] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [lastSetAt, setLastSetAt] = useState<string | null>(null)
  const [defaultHost, setDefaultHost] = useState('')
  const [defaultProtocol, setDefaultProtocol] = useState<ProtocolOption>('https')

  const computedWebhookUrl = useMemo(() => {
    const normalizedHost = sanitizeHost(host)
    return normalizedHost ? `${protocol}://${normalizedHost}/webhook/telegram` : ''
  }, [host, protocol])

  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true)
    try {
      const response = await apiClient.get<WebhookConfigResponseDto>('/api/webhook-settings')
      const data = response.data

      setDefaultHost(data.default_host)
      setDefaultProtocol(data.default_protocol)

      const localConfig = readLocalConfig()

      const resolvedProtocol = data.telegram?.protocol || localConfig.protocol || data.default_protocol
      const resolvedHost = sanitizeHost(
        data.telegram?.host || localConfig.host || data.default_host || ''
      )

      setProtocol(resolvedProtocol)
      setHost(resolvedHost)
      setServerWebhookUrl(data.telegram?.webhook_url || null)
      setIsActive(Boolean(data.telegram?.is_active))
      setLastSetAt(data.telegram?.last_set_at || null)

      if (data.telegram) {
        writeLocalConfig(resolvedProtocol, resolvedHost)
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
    const normalizedHost = sanitizeHost(host)

    if (!normalizedHost) {
      toast.error('Host must not be empty')
      return
    }

    setIsSaving(true)
    try {
      const { data } = await apiClient.post<TelegramWebhookConfigDto>('/api/webhook-settings', {
        protocol,
        host: normalizedHost
      })

      setProtocol(data.protocol)
      setHost(data.host)
      setServerWebhookUrl(data.webhook_url || null)
      setIsActive(Boolean(data.is_active))
      setLastSetAt(data.last_set_at || null)
      writeLocalConfig(data.protocol, data.host)

      toast.success('Webhook settings saved')
    } catch (error) {
      toast.error(`Failed to save webhook settings: ${extractErrorMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetWebhook = async () => {
    const normalizedHost = sanitizeHost(host)

    if (!normalizedHost) {
      toast.error('Host must not be empty')
      return
    }

    setIsSettingWebhook(true)
    try {
      const { data } = await apiClient.post<SetWebhookResponseDto>(
        '/api/webhook-settings/telegram/set',
        {
          protocol,
          host: normalizedHost
        }
      )

      if (data.success) {
        toast.success(data.message || 'Webhook activated')
        writeLocalConfig(protocol, normalizedHost)
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
        '/api/webhook-settings/telegram'
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

  const activeBadgeVariant = isActive ? 'default' : 'outline'
  const activeBadgeText = isActive ? 'Active' : 'Inactive'
  const lastSetFormatted = useMemo(() => {
    if (!lastSetAt) return null
    try {
      return new Date(lastSetAt).toLocaleString('uk-UA')
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="webhook-protocol" className="text-sm font-medium text-foreground">
                    Protocol
                  </Label>
                  <Select value={protocol} onValueChange={(value) => setProtocol(value as ProtocolOption)}>
                    <SelectTrigger id="webhook-protocol" className="mt-2">
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTOCOL_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="webhook-host" className="text-sm font-medium text-foreground">
                    Host
                  </Label>
                  <Input
                    id="webhook-host"
                    className="mt-2"
                    placeholder={defaultHost || 'example.ngrok.app'}
                    value={host}
                    onChange={(event) => setHost(event.target.value)}
                    onBlur={() => setHost((current) => sanitizeHost(current))}
                    autoComplete="off"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Provide host or host:port only. Protocol is selected above. Default host: {defaultHost || 'n/a'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium text-foreground">Webhook URL</Label>
                  <Input
                    className="mt-2"
                    value={serverWebhookUrl || computedWebhookUrl || ''}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Status</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={activeBadgeVariant}>{activeBadgeText}</Badge>
                    {lastSetFormatted && (
                      <span className="text-xs text-muted-foreground">Last set: {lastSetFormatted}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="ghost" onClick={handleSave} disabled={isSaving || isLoadingConfig}>
                  {isSaving ? 'Saving…' : 'Save settings'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSetWebhook}
                  disabled={isSettingWebhook || !host || isLoadingConfig}
                >
                  {isSettingWebhook ? 'Activating…' : 'Set & Activate'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteWebhook}
                  disabled={isDeletingWebhook || isLoadingConfig || !isActive}
                >
                  {isDeletingWebhook ? 'Deleting…' : 'Delete webhook'}
                </Button>
                <Button type="button" variant="ghost" onClick={loadConfig} disabled={isLoadingConfig}>
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground w-32">Version:</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground w-32">API URL:</span>
              <span className="text-muted-foreground break-all">{process.env.REACT_APP_API_URL || 'http://localhost:8000'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground w-32">WebSocket URL:</span>
              <span className="text-muted-foreground break-all">{process.env.REACT_APP_WS_URL || 'http://localhost:8000'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage