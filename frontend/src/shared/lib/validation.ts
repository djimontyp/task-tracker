/**
 * Runtime validation utilities for API responses.
 *
 * Provides type-safe parsing of API responses using Zod schemas
 * to catch backend contract violations early.
 */
import { z, ZodError, ZodSchema } from 'zod'

/**
 * Validation error with detailed information about what failed.
 */
export class ApiValidationError extends Error {
  constructor(
    message: string,
    public readonly zodError: ZodError,
    public readonly rawData: unknown
  ) {
    super(message)
    this.name = 'ApiValidationError'
  }

  /**
   * Get a formatted list of validation issues.
   */
  getIssues(): string[] {
    return this.zodError.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
  }
}

/**
 * Validate API response data against a Zod schema.
 * Throws ApiValidationError if validation fails.
 *
 * @example
 * ```ts
 * const topic = validateResponse(TopicSchema, response.data)
 * ```
 */
export function validateResponse<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')

    throw new ApiValidationError(
      `API response validation failed: ${issues}`,
      result.error,
      data
    )
  }

  return result.data
}

/**
 * Safely validate API response, returning null on failure instead of throwing.
 * Logs validation errors to console in development.
 *
 * @example
 * ```ts
 * const topic = safeValidateResponse(TopicSchema, response.data)
 * if (!topic) {
 *   // Handle invalid response
 * }
 * ```
 */
export function safeValidateResponse<T>(
  schema: ZodSchema<T>,
  data: unknown
): T | null {
  const result = schema.safeParse(data)

  if (!result.success) {
    if (import.meta.env.DEV) {
      console.error('[API Validation] Schema validation failed:', {
        issues: result.error.issues,
        data,
      })
    }
    return null
  }

  return result.data
}

/**
 * Create a validated fetch wrapper for a specific schema.
 * Useful for creating type-safe API service methods.
 *
 * @example
 * ```ts
 * const fetchTopics = createValidatedFetcher(TopicListResponseSchema)
 * const topics = await fetchTopics(() => apiClient.get('/topics'))
 * ```
 */
export function createValidatedFetcher<T>(schema: ZodSchema<T>) {
  return async (fetcher: () => Promise<{ data: unknown }>): Promise<T> => {
    const response = await fetcher()
    return validateResponse(schema, response.data)
  }
}

/**
 * Paginated response wrapper schema factory.
 * Creates a schema for standard paginated API responses.
 *
 * @example
 * ```ts
 * const TopicListSchema = paginatedSchema(TopicSchema)
 * ```
 */
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive(),
  })
}
