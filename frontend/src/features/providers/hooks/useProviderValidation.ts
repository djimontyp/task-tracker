/**
 * useProviderValidation - Hook for polling provider validation status
 *
 * Extracts polling logic from provider components to enable reuse.
 * Polls backend until validation completes (success/error) or times out.
 */

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { LLMProvider } from '../types';
import { ValidationStatus } from '../types';

const DEFAULT_POLLING_INTERVAL_MS = 1000;
const DEFAULT_MAX_ATTEMPTS = 15;

type ValidationAction = 'created' | 'updated';

interface ValidationMessages {
  /** Message shown while validating */
  validating: (action: ValidationAction) => string;
  /** Message shown when provider not found */
  notFound: string;
  /** Message shown on successful validation */
  success: string;
  /** Message shown when validation fails */
  failed: (error: string) => string;
  /** Message shown on timeout */
  timeout: string;
}

export interface UseProviderValidationOptions {
  /** Custom messages for toast notifications */
  messages: ValidationMessages;
  /** Maximum polling attempts before timeout. Default: 15 */
  maxAttempts?: number;
  /** Interval between polls in ms. Default: 1000 */
  pollInterval?: number;
  /** Callback on successful validation */
  onSuccess?: (provider: LLMProvider) => void;
  /** Callback on validation error */
  onError?: (error: string) => void;
  /** Callback on timeout */
  onTimeout?: () => void;
}

export interface UseProviderValidationReturn {
  /** Poll validation status until complete or timeout */
  pollValidationStatus: (providerId: string, action: ValidationAction) => Promise<void>;
  /** Cancel any ongoing polling */
  cancel: () => void;
}

/**
 * Hook for polling LLM provider validation status
 *
 * @example
 * ```tsx
 * const { pollValidationStatus } = useProviderValidation({
 *   messages: {
 *     validating: (action) => `Provider ${action}. Validating...`,
 *     notFound: 'Provider not found',
 *     success: 'Provider validated successfully!',
 *     failed: (error) => `Validation failed: ${error}`,
 *     timeout: 'Validation timeout. Check status.',
 *   },
 *   onSuccess: () => console.log('Validated!'),
 * });
 *
 * // In mutation onSuccess:
 * await pollValidationStatus(provider.id, 'created');
 * ```
 */
export function useProviderValidation(
  options: UseProviderValidationOptions
): UseProviderValidationReturn {
  const queryClient = useQueryClient();
  const cancelledRef = useRef(false);

  const {
    messages,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    pollInterval = DEFAULT_POLLING_INTERVAL_MS,
    onSuccess,
    onError,
    onTimeout,
  } = options;

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const pollValidationStatus = useCallback(
    async (providerId: string, action: ValidationAction) => {
      cancelledRef.current = false;

      // Use toast ID to update the same toast instead of creating multiple
      const toastId = `provider-validation-${providerId}`;
      toast.loading(messages.validating(action), { id: toastId });

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelledRef.current) {
          toast.dismiss(toastId);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        if (cancelledRef.current) {
          toast.dismiss(toastId);
          return;
        }

        await queryClient.refetchQueries({ queryKey: ['providers'] });

        const providers = queryClient.getQueryData<LLMProvider[]>(['providers']);
        const provider = providers?.find((p) => p.id === providerId);

        if (!provider) {
          toast.error(messages.notFound, { id: toastId });
          onError?.(messages.notFound);
          return;
        }

        if (provider.validation_status === ValidationStatus.CONNECTED) {
          toast.success(messages.success, { id: toastId });
          onSuccess?.(provider);
          return;
        }

        if (provider.validation_status === ValidationStatus.ERROR) {
          const errorMessage = provider.validation_error || 'Unknown error';
          toast.error(messages.failed(errorMessage), { id: toastId });
          onError?.(errorMessage);
          return;
        }
      }

      // Timeout reached
      toast.error(messages.timeout, { id: toastId });
      onTimeout?.();
    },
    [queryClient, messages, maxAttempts, pollInterval, onSuccess, onError, onTimeout]
  );

  return { pollValidationStatus, cancel };
}
