/**
 * AIProvidersSection - LLM provider integrations (OpenAI, Ollama, etc.)
 *
 * Shows configured AI providers and their connection status.
 * Uses Sheet for adding/editing providers.
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Cpu, Plus, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { getHardwareAlias } from '@/shared/utils/hardwareAlias';

import { providerService } from '@/features/providers/api';
import { useProviderValidation } from '@/features/providers/hooks';
import {
  LLMProvider,
  LLMProviderCreate,
  LLMProviderUpdate,
  ValidationStatus as ValidationStatusEnum,
} from '@/features/providers/types';
import { ProviderForm } from '@/features/agents/components';

import { SettingsSection, SettingsEmptyState } from '../SettingsSection';
import { SettingsCard, SettingsCardSkeleton, AddSettingsCard } from '../SettingsCard';
import type { SettingsCardStatus } from '../SettingsCard';

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getProviderIcon(
  type: string
): React.ComponentType<{ className?: string }> {
  switch (type) {
    case 'openai':
      return Sparkles;
    case 'ollama':
      return Cpu;
    case 'gemini':
      return Zap;
    default:
      return Bot;
  }
}

function mapValidationStatus(status: ValidationStatusEnum): SettingsCardStatus {
  switch (status) {
    case ValidationStatusEnum.CONNECTED:
      return 'connected';
    case ValidationStatusEnum.VALIDATING:
    case ValidationStatusEnum.PENDING:
      return 'loading';
    case ValidationStatusEnum.ERROR:
      return 'error';
    default:
      return 'pending';
  }
}

function getStatusLabel(
  status: ValidationStatusEnum,
  isActive: boolean
): string {
  if (status === ValidationStatusEnum.CONNECTED) {
    return isActive ? 'Active' : 'Connected';
  }
  if (
    status === ValidationStatusEnum.VALIDATING ||
    status === ValidationStatusEnum.PENDING
  ) {
    return 'Validating...';
  }
  if (status === ValidationStatusEnum.ERROR) {
    return 'Error';
  }
  return 'Setup';
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AIProvidersSection() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(
    null
  );

  const validationMessages = useMemo(() => ({
    validating: (action: 'created' | 'updated') =>
      t('providers.validation.started', `Provider ${action}. Validating...`),
    notFound: t('providers.validation.notFound', 'Provider not found'),
    success: t('providers.validation.success', 'Provider validated successfully!'),
    failed: (error: string) =>
      t('providers.validation.failed', 'Validation failed: ') + error,
    timeout: t('providers.validation.timeout', 'Validation timeout. Check status.'),
  }), [t]);

  const { pollValidationStatus } = useProviderValidation({
    messages: validationMessages,
  });

  const { data: providers, isLoading } = useQuery<LLMProvider[]>({
    queryKey: ['providers'],
    queryFn: () => providerService.listProviders(),
    refetchInterval: (query) => {
      const hasActiveValidation = query.state.data?.some(
        (p) =>
          p.validation_status === ValidationStatusEnum.VALIDATING ||
          p.validation_status === ValidationStatusEnum.PENDING
      );
      return hasActiveValidation ? 2000 : false;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: LLMProviderCreate) =>
      providerService.createProvider(data),
    onSuccess: async (createdProvider) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setFormOpen(false);
      await pollValidationStatus(createdProvider.id, 'created');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('providers.error.create', 'Failed to create'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LLMProviderUpdate }) =>
      providerService.updateProvider(id, data),
    onSuccess: async (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      setFormOpen(false);
      setEditingProvider(null);
      await pollValidationStatus(id, 'updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || t('providers.error.update', 'Failed to update'));
    },
  });

  const handleProviderClick = (provider: LLMProvider) => {
    setEditingProvider(provider);
    setFormOpen(true);
  };

  const handleAddProvider = () => {
    setEditingProvider(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingProvider(null);
  };

  const handleSubmit = (data: LLMProviderCreate | LLMProviderUpdate) => {
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data });
    } else {
      createMutation.mutate(data as LLMProviderCreate);
    }
  };

  return (
    <>
      <SettingsSection title={t('sections.aiProviders', 'AI Providers')}>
        {isLoading ? (
          <>
            <SettingsCardSkeleton />
            <SettingsCardSkeleton />
          </>
        ) : providers?.length === 0 ? (
          <SettingsEmptyState
            icon={Bot}
            title={t('providers.empty.title', 'No providers configured')}
            description={t(
              'providers.empty.description',
              'Add an LLM provider to enable AI features'
            )}
            action={
              <Button size="sm" onClick={handleAddProvider}>
                <Plus className="h-4 w-4 mr-1" />
                {t('providers.addProvider', 'Add Provider')}
              </Button>
            }
          />
        ) : (
          <>
            {providers?.map((provider) => {
              const alias = getHardwareAlias(provider.name);
              return (
                <SettingsCard
                  key={provider.id}
                  icon={getProviderIcon(provider.type)}
                  title={alias.displayName}
                  titleTooltip={alias.isAlias ? alias.technicalName : undefined}
                  description={
                    provider.type.charAt(0).toUpperCase() + provider.type.slice(1)
                  }
                  status={mapValidationStatus(provider.validation_status)}
                  statusLabel={getStatusLabel(
                    provider.validation_status,
                    provider.is_active
                  )}
                  onClick={() => handleProviderClick(provider)}
                />
              );
            })}
            <AddSettingsCard
              label={t('providers.addProvider', 'Add Provider')}
              onClick={handleAddProvider}
            />
          </>
        )}
      </SettingsSection>

      {/* Provider Form Dialog */}
      <ProviderForm
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleSubmit}
        initialData={editingProvider || undefined}
        isEdit={!!editingProvider}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
