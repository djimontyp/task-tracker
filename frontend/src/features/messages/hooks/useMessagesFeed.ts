import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import apiClient from '@/shared/lib/api/client'
import { useMessagesStore } from '../store/messagesStore'
import type { Message } from '@/shared/types'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'

export type MessagesPeriod = '24h' | '7d' | '30d' | 'all'

interface UseMessagesFeedOptions {
  limit?: number
}

interface MessageEventPayload {
  type: string
  data?: Message
}

interface MessageUpdatedPayload {
  id?: number
  external_message_id?: string
  persisted?: boolean
  avatar_url?: string | null
  author_id?: number
  author_name?: string
}

const PERIOD_OPTIONS: { key: MessagesPeriod; label: string }[] = [
  { key: '24h', label: '24 години' },
  { key: '7d', label: '7 днів' },
  { key: '30d', label: '30 днів' },
  { key: 'all', label: 'Весь час' },
]

const ISO_DATE = (date: Date) => date.toISOString().slice(0, 10)

const resolveDateRange = (period: MessagesPeriod) => {
  if (period === 'all') {
    return {}
  }

  const now = new Date()
  const end = ISO_DATE(now)

  const startDate = new Date(now)
  if (period === '24h') {
    startDate.setDate(startDate.getDate() - 1)
  } else if (period === '7d') {
    startDate.setDate(startDate.getDate() - 7)
  } else if (period === '30d') {
    startDate.setDate(startDate.getDate() - 30)
  }

  const start = ISO_DATE(startDate)

  return { date_from: start, date_to: end }
}

const isMessageData = (value: unknown): value is Message => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id !== 'undefined' &&
    typeof candidate.external_message_id === 'string' &&
    typeof candidate.content === 'string'
  )
}

const toUpdatedPayload = (value: unknown): MessageUpdatedPayload | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const externalId = candidate.external_message_id

  if (typeof externalId !== 'string') {
    return null
  }

  return {
    id: typeof candidate.id === 'number' ? candidate.id : undefined,
    external_message_id: externalId,
    persisted: typeof candidate.persisted === 'boolean' ? candidate.persisted : undefined,
    avatar_url:
      typeof candidate.avatar_url === 'string' || candidate.avatar_url === null
        ? (candidate.avatar_url as string | null)
        : undefined,
    author_id: typeof candidate.author_id === 'number' ? candidate.author_id : undefined,
    author_name: typeof candidate.author_name === 'string' ? candidate.author_name : undefined,
  }
}

export const useMessagesFeed = ({ limit = 50 }: UseMessagesFeedOptions = {}) => {
  const [period, setPeriod] = useState<MessagesPeriod>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    messages,
    hydrate,
    upsertMessage,
    markPersisted,
    statusByExternalId,
    isHydrated,
  } = useMessagesStore()

  const fetchMessages = useCallback(
    async (currentPeriod: MessagesPeriod) => {
      setIsLoading(true)
      try {
        const params = {
          limit,
          ...resolveDateRange(currentPeriod),
        }

        const response = await apiClient.get<{ items: Message[] }>('/api/messages', { params })
        hydrate(response.data.items)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch messages:', err)
        const message = err instanceof Error ? err.message : 'Не вдалося отримати повідомлення'
        setError(message)
        toast.error('Не вдалося завантажити повідомлення')
      } finally {
        setIsLoading(false)
      }
    },
    [hydrate, limit]
  )

  useEffect(() => {
    fetchMessages(period)
  }, [fetchMessages, period])

  const handleMessageEvent = useCallback(
    (payload: unknown) => {
      console.log('🔍 handleMessageEvent received:', payload)

      if (!payload || typeof payload !== 'object') {
        console.log('⚠️  Invalid payload')
        return
      }

      const { type, data } = payload as MessageEventPayload
      console.log('📋 Message type:', type, 'data:', data)

      if ((type === 'message.new' || type === 'message') && isMessageData(data)) {
        console.log('✅ Adding new message to store')
        upsertMessage({ ...data, persisted: data.persisted ?? false })
        return
      }

      if (type === 'message.updated') {
        console.log('🔄 Updating message in store')
        const updated = toUpdatedPayload(data)
        if (updated?.external_message_id) {
          markPersisted(updated.external_message_id, {
            avatar_url: updated.avatar_url ?? undefined,
            author_name: updated.author_name ?? undefined,
            persisted: updated.persisted ?? true,
          })
        }
      }

      console.log('⚠️  Message type not handled:', type)
    },
    [markPersisted, upsertMessage]
  )

  const { connectionState, isConnected } = useWebSocket({
    onMessage: handleMessageEvent,
    reconnect: true,
  })

  const refresh = useCallback(() => {
    fetchMessages(period)
  }, [fetchMessages, period])

  const periodOptions = useMemo(() => PERIOD_OPTIONS, [])

  return {
    period,
    setPeriod,
    periodOptions,
    isLoading,
    error,
    refresh,
    messages,
    statusByExternalId,
    connectionState,
    isConnected,
    isHydrated,
  }
}
