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
import { LLMProvider, LLMProviderCreate, LLMProviderUpdate, ValidationStatus } from '@/features/providers/types'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Server } from 'lucide-react'
import { EmptyState } from '@/shared/patterns'
import { ProviderForm } from './ProviderForm'
import { ValidationStatus as ValidationStatusComponent } from '@/features/providers/components'

const ProviderList = () => {
  const { t } = useTranslation('agents')
  const { t: tCommon } = useTranslation()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const validationMessages = useMemo(() => ({
    validating: (action: 'created' | 'updated') => t(`providerList.toast.${action}Validating`),
    notFound: t('providerList.toast.notFound'),
    success: t('providerList.toast.validationSuccess'),
    failed: (error: string) => t('providerList.toast.validationFailed', { error }),
    timeout: t('providerList.toast.validationTimeout'),
  }), [t])

  const { pollValidationStatus } = useProviderValidation({
    messages: validationMessages,
  })

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
                        onClick={() => handleDeleteClick(provider.id)}
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

export { ProviderList }
