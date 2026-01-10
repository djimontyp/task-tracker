import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  Button,
  Badge,
  Spinner,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'
import { providerService } from '@/features/providers/api'
import { useProviderValidation } from '@/features/providers/hooks'
import { LLMProvider, LLMProviderCreate, LLMProviderUpdate, ValidationStatus as ValidationStatusEnum } from '@/features/providers/types'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { ProviderForm } from '@/features/agents/components'
import { ValidationStatus } from '@/features/providers/components'
import { formatFullDate } from '@/shared/utils/date'

const ProvidersTab = () => {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const validationMessages = useMemo(() => ({
    validating: (action: 'created' | 'updated') =>
      t('common:toast.info.validating', {
        entity: t('common:toast.entities.provider'),
        action: t(`common:toast.actions.${action}`),
      }),
    notFound: t('common:toast.error.notFound', { entity: t('common:toast.entities.provider') }),
    success: t('common:toast.success.validated', { entity: t('common:toast.entities.provider') }),
    failed: (error: string) => t('common:toast.error.validationFailed', { error }),
    timeout: t('common:toast.error.validationTimeout', { entity: t('common:toast.entities.provider') }),
  }), [t])

  const { pollValidationStatus } = useProviderValidation({
    messages: validationMessages,
  })

  const { data: providers, isLoading } = useQuery<LLMProvider[]>({
    queryKey: ['providers'],
    queryFn: () => providerService.listProviders(),
    refetchInterval: (query) => {
      const hasActiveValidation = query.state.data?.some(
        (p) => p.validation_status === ValidationStatusEnum.VALIDATING || p.validation_status === ValidationStatusEnum.PENDING
      )
      return hasActiveValidation ? 2000 : false
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: LLMProviderCreate) => providerService.createProvider(data),
    onSuccess: async (createdProvider) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setFormOpen(false)
      await pollValidationStatus(createdProvider.id, 'created')
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common:toast.error.createFailed', { entity: t('common:toast.entities.provider') }))
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
      toast.error(error.message || t('common:toast.error.updateFailed', { entity: t('common:toast.entities.provider') }))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => providerService.deleteProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      toast.success(t('common:toast.success.deleted', { entity: t('common:toast.entities.provider') }))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('common:toast.error.deleteFailed', { entity: t('common:toast.entities.provider') }))
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

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId)
      setDeleteId(null)
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
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('providersTab.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('providersTab.description')}
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('providersTab.addProvider')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                {t('providersTab.noProviders')}
              </p>
            </CardContent>
          </Card>
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
                        aria-label={t('providersTab.editProvider')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(provider.id)}
                        aria-label={t('providersTab.deleteProvider')}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {provider.base_url && (
                      <div>
                        <span className="text-muted-foreground">{t('providersTab.baseUrl')}:</span>
                        <p className="font-mono text-xs break-all">{provider.base_url}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('providersTab.status')}:</span>
                      <ValidationStatus
                        status={provider.validation_status}
                        error={provider.validation_error}
                      />
                    </div>

                    {provider.validated_at && (
                      <div className="text-xs text-muted-foreground">
                        {t('providersTab.validated')}: {formatFullDate(provider.validated_at)}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('providersTab.active')}:</span>
                      <Badge variant="outline" className={provider.is_active ? 'bg-semantic-success text-white border-semantic-success' : 'bg-muted text-muted-foreground border-border'}>
                        {provider.is_active ? t('common:labels.yes') : t('common:labels.no')}
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

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon('confirmDialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('confirmDialog.deleteProvider')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ProvidersTab
