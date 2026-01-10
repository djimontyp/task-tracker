import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, isToday, isYesterday } from 'date-fns'
import { uk, enUS } from 'date-fns/locale'
import type { Message } from '@/shared/types'

/**
 * A single group of messages for a specific date.
 */
export interface MessageGroup {
  /** The human-readable label for the date (e.g., "Today", "Yesterday", "January 15, 2024") */
  label: string
  /** Messages belonging to this date group */
  messages: Message[]
}

/**
 * Groups messages by date with human-readable labels.
 *
 * Features:
 * - Groups by day based on `sent_at` field
 * - Provides localized labels ("Today", "Yesterday", or formatted date)
 * - Respects i18n language setting for date formatting
 * - Memoized for performance
 *
 * @param messages - Array of messages to group
 * @returns Array of MessageGroup objects ordered by date
 *
 * @example
 * ```tsx
 * const { groupedMessages } = useGroupedMessages(messages);
 *
 * return (
 *   <div>
 *     {groupedMessages.map(group => (
 *       <div key={group.label}>
 *         <h3>{group.label}</h3>
 *         {group.messages.map(msg => <MessageItem key={msg.id} message={msg} />)}
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useGroupedMessages(messages: Message[]): MessageGroup[] {
  const { t, i18n } = useTranslation('messages')

  return useMemo(() => {
    const groupsMap: Record<string, Message[]> = {}
    const locale = i18n.language === 'uk' ? uk : enUS

    messages.forEach((msg) => {
      if (!msg.sent_at) return

      const date = new Date(msg.sent_at)

      // Generate human-readable label for the date
      let displayLabel = ''
      if (isToday(date)) {
        displayLabel = t('dateGroups.today')
      } else if (isYesterday(date)) {
        displayLabel = t('dateGroups.yesterday')
      } else {
        displayLabel = format(date, 'MMMM d, yyyy', { locale })
      }

      // Group messages by their display label
      // Note: This assumes messages are already sorted by date (desc).
      // For strict date ordering across years, we could use ISO date keys
      // and sort separately, but this approach works for typical use cases.
      if (!groupsMap[displayLabel]) {
        groupsMap[displayLabel] = []
      }
      groupsMap[displayLabel].push(msg)
    })

    // Convert to array of MessageGroup objects
    // Object.entries preserves insertion order (ES2015+)
    return Object.entries(groupsMap).map(([label, msgs]) => ({
      label,
      messages: msgs,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps -- t() is stable, including it causes re-renders
  }, [messages, i18n.language])
}
