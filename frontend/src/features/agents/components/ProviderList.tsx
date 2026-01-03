import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
} from '@/shared/ui'
import { providerService } from '@/features/providers/api'
import { LLMProvider, LLMProviderCreate, LLMProviderUpdate, ValidationStatus } from '@/features/providers/types'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Server } from 'lucide-react'
import { EmptyState } from '@/shared/patterns'
import { ProviderForm } from './ProviderForm'
import { ValidationStatus as ValidationStatusComponent } from '@/features/providers/components'

const POLLING_INTERVAL_MS = 1000
const MAX_POLLING_ATTEMPTS = 15

const ProviderList = () => {
  const { t } = useTranslation('agents')
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)

  const { data: providers, isLoading } = useQuery<LLMProvider[]>({
    queryKey: ['providers'],
    queryFn: () => providerService.listProviders(),
    refetchInterval: (query) => {
      const hasActiveValidation = query.state.data?.some(
        (p) => p.validation_status === ValidationStatus.VALIDATING || p.validation_status === ValidationStatus.PENDING
      )
      return hasActiveValidation ? 2000 : false
    },
  })

  const pollValidationStatus = async (providerId: string, action: 'created' | 'updated') => {
    // Use toast ID to update the same toast instead of creating multiple
    const toastId = `provider-validation-${providerId}`
    toast.loading(t(`providerList.toast.${action}Validating`), { id: toastId })

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS))
      await queryClient.refetchQueries({ queryKey: ['providers'] })

      const providers = queryClient.getQueryData<LLMProvider[]>(['providers'])
      const provider = providers?.find(p => p.id === providerId)

      if (!provider) {
        toast.error(t('providerList.toast.notFound'), { id: toastId })
        return
      }

      if (provider.validation_status === ValidationStatus.CONNECTED) {
        toast.success(t('providerList.toast.validationSuccess'), { id: toastId })
        return
      }

      if (provider.validation_status === ValidationStatus.ERROR) {
        toast.error(t('providerList.toast.validationFailed', { error: provider.validation_error || t('providerList.toast.unknownError') }), { id: toastId })
        return
      }
    }

    toast.error(t('providerList.toast.validationTimeout'), { id: toastId })
  }

  const createMutation = useMutation({
    mutationFn: (data: LLMProviderCreate) => providerService.createProvider(data),
    onSuccess: async (createdProvider) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setFormOpen(false)
      await pollValidationStatus(createdProvider.id, 'created')
    },
    onError: (error: Error) => {
      toast.error(error.message || t('providerList.toast.createError'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LLMProviderUpdate }) =>
      providerService.updateProvider(id, data),
    onSuccess: async (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setFormOpen(false)
      setEditingProvider(null)
      await pollValidationStatus(id, 'updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || t('providerList.toast.updateError'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => providerService.deleteProvider(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] })
      toast.success(t('providerList.toast.deleteSuccess'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('providerList.toast.deleteError'))
    },
  })

  const handleCreate = () => {
    setEditingProvider(null)
    setFormOpen(true)
  }

  const handleEdit = (provider: LLMProvider) => {
    setEditingProvider(provider)
    setFormOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('providerList.confirm.delete'))) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (data: LLMProviderCreate | LLMProviderUpdate) => {
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data })
    } else {
      createMutation.mutate(data as LLMProviderCreate)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('providerList.title')}</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('providerList.addButton')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              variant="card"
              icon={Server}
              title={t('providerList.empty.title')}
              description={t('providerList.empty.description')}
              action={
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('providerList.addButton')}
                </Button>
              }
            />
          </div>
        ) : (
          providers?.map((provider) => (
            <Card key={provider.id} className="card-interactive">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      <Badge variant="outline" className="mt-2">
                        {provider.type}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(provider)}
                        aria-label={t('providerList.actions.edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(provider.id)}
                        aria-label={t('providerList.actions.delete')}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {provider.base_url && (
                      <div>
                        <span className="text-muted-foreground">{t('providerList.fields.baseUrl')}</span>
                        <p className="font-mono text-xs break-all">{provider.base_url}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('providerList.fields.status')}</span>
                      <ValidationStatusComponent
                        status={provider.validation_status}
                        error={provider.validation_error}
                      />
                    </div>

                    {provider.validated_at && (
                      <div className="text-xs text-muted-foreground">
                        {t('providerList.fields.validated')} {new Date(provider.validated_at).toLocaleString()}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('providerList.fields.active')}</span>
                      <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                        {provider.is_active ? t('common.yes') : t('common.no')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ProviderForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingProvider(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingProvider || undefined}
        isEdit={!!editingProvider}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

export { ProviderList }
