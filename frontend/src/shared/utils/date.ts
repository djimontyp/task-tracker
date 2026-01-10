/**
 * Get locale string for toLocaleString based on language code
 * @param language - ISO 639-1 language code ('uk' | 'en')
 * @returns Locale string for toLocaleString
 */
export const getLocaleString = (language: string): string => {
  return language === 'uk' ? 'uk-UA' : 'en-US'
}

/**
 * Formats message date/timestamp to short time format (HH:MM)
 * @param sentAt - Primary date field (preferred)
 * @param timestamp - Fallback date field (deprecated)
 * @param language - ISO 639-1 language code ('uk' | 'en'), defaults to 'uk'
 * @returns Formatted time string in the specified locale
 */
export const formatMessageDate = (sentAt?: string, timestamp?: string, language: string = 'uk'): string => {
  const date = sentAt || timestamp
  if (!date) return 'No date'

  return new Date(date).toLocaleString(getLocaleString(language), {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats date to full format with date and time
 * @param date - ISO date string
 * @param language - ISO 639-1 language code ('uk' | 'en'), defaults to 'uk'
 * @returns Formatted date string in the specified locale
 */
export const formatFullDate = (date?: string, language: string = 'uk'): string => {
  if (!date) return 'No date'

  return new Date(date).toLocaleString(getLocaleString(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
