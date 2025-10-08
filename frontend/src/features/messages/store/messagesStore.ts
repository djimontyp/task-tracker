import { create } from 'zustand'
import type { Message } from '@/shared/types'

export type MessageList = Message & {
  displayTimestamp: string
  displaySource: string
}

type MessageStatus = 'persisted' | 'pending'

interface MessagesStoreState {
  messages: MessageList[]
  statusByExternalId: Record<string, MessageStatus>
  lastUpdatedAt: string | null
  isHydrated: boolean

  hydrate: (messages: Message[]) => void
  upsertMessage: (message: Message) => void
  markPersisted: (externalId: string, patch?: Partial<Message>) => void
  setPending: (externalId: string) => void
  clear: () => void
}

const normalizeSentAt = (value?: string | null): string => {
  if (!value) {
    return new Date().toISOString()
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }
  return date.toISOString()
}

const toTimestamp = (value?: string): number => {
  if (!value) return 0
  const date = new Date(value)
  const time = date.getTime()
  return Number.isNaN(time) ? 0 : time
}

const enhanceMessage = (message: Message): MessageList => {
  // Use new fields, fallback to deprecated fields for backwards compatibility
  const sentAtIso = normalizeSentAt(message.sent_at || message.timestamp)
  const displayTimestamp = new Date(sentAtIso).toLocaleString('uk-UA')
  const displaySource = message.source_name || 'unknown'

  return {
    ...message,
    sent_at: sentAtIso,
    displayTimestamp,
    displaySource,
    // Explicitly preserve avatar_url
    avatar_url: message.avatar_url,
    // Use author_name (fallback to deprecated fields for legacy data)
    author_name: message.author_name || message.author || message.sender || 'Unknown',
    // Ensure content is set (fallback to deprecated text field)
    content: message.content || message.text || '',
  }
}

const sortBySentAtDesc = (messages: MessageList[]) =>
  [...messages].sort((a, b) => toTimestamp(b.sent_at) - toTimestamp(a.sent_at))

export const useMessagesStore = create<MessagesStoreState>((set, get) => ({
  messages: [],
  statusByExternalId: {},
  lastUpdatedAt: null,
  isHydrated: false,

  hydrate: (incoming) => {
    const normalized = sortBySentAtDesc(incoming.map(enhanceMessage))

    const statusByExternalId = normalized.reduce<Record<string, MessageStatus>>((acc, item) => {
      acc[item.external_message_id] = item.persisted === false ? 'pending' : 'persisted'
      return acc
    }, {})

    set({
      messages: normalized,
      statusByExternalId,
      lastUpdatedAt: new Date().toISOString(),
      isHydrated: true,
    })
  },

  upsertMessage: (incoming) => {
    const normalized = enhanceMessage(incoming)
    const { messages, statusByExternalId } = get()

    const existingIndex = messages.findIndex(
      (msg) => msg.external_message_id === normalized.external_message_id
    )

    const nextStatus: MessageStatus = normalized.persisted === false ? 'pending' : 'persisted'

    if (existingIndex >= 0) {
      const updated = [...messages]
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...normalized,
      }

      set({
        messages: sortBySentAtDesc(updated),
        statusByExternalId: {
          ...statusByExternalId,
          [normalized.external_message_id]: nextStatus,
        },
        lastUpdatedAt: new Date().toISOString(),
      })
      return
    }

    set({
      messages: sortBySentAtDesc([normalized, ...messages]),
      statusByExternalId: {
        ...statusByExternalId,
        [normalized.external_message_id]: nextStatus,
      },
      lastUpdatedAt: new Date().toISOString(),
    })
  },

  markPersisted: (externalId, patch) => {
    const { messages, statusByExternalId } = get()

    const updatedMessages = messages.map((msg) => {
      if (msg.external_message_id !== externalId) {
        return msg
      }

      const next: Message = {
        ...msg,
        ...patch,
        persisted: true,
      }

      const enhanced = enhanceMessage(next)
      // Preserve avatar_url from patch if provided
      if (patch?.avatar_url !== undefined) {
        enhanced.avatar_url = patch.avatar_url
      }

      return enhanced
    })

    set({
      messages: updatedMessages,
      statusByExternalId: {
        ...statusByExternalId,
        [externalId]: 'persisted',
      },
      lastUpdatedAt: new Date().toISOString(),
    })
  },

  setPending: (externalId) => {
    const { statusByExternalId } = get()
    set({
      statusByExternalId: {
        ...statusByExternalId,
        [externalId]: 'pending',
      },
    })
  },

  clear: () => set({ messages: [], statusByExternalId: {}, lastUpdatedAt: null, isHydrated: false }),
}))
