/**
 * Simple logger utility that respects NODE_ENV
 * Debug logs are only shown in development mode
 */
/* eslint-disable no-console */

const IS_DEV = import.meta.env.MODE === 'development'

export const logger = {
  debug: (...args: unknown[]) => {
    if (IS_DEV) {
      console.log('[DEBUG]', ...args)
    }
  },
  info: (...args: unknown[]) => {
    console.log('[INFO]', ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },
}
