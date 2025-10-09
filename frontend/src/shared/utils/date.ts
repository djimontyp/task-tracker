/**
 * Formats message date/timestamp to short time format (HH:MM)
 * @param sentAt - Primary date field (preferred)
 * @param timestamp - Fallback date field (deprecated)
 * @returns Formatted time string in UK locale
 */
export const formatMessageDate = (sentAt?: string, timestamp?: string): string => {
  const date = sentAt || timestamp
  if (!date) return 'No date'

  return new Date(date).toLocaleString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats date to full format with date and time
 * @param date - ISO date string
 * @returns Formatted date string in UK locale
 */
export const formatFullDate = (date?: string): string => {
  if (!date) return 'No date'

  return new Date(date).toLocaleString('uk-UA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
