import { useState } from 'react'
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
    toast.success(`Provider ${action}. Validating connection...`)

    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS))
      await queryClient.refetchQueries({ queryKey: ['providers'] })

      const providers = queryClient.getQueryData<LLMProvider[]>(['providers'])
      const provider = providers?.find(p => p.id === providerId)

      if (!provider) {
        toast.error('Provider not found')
        return
      }

      if (provider.validation_status === ValidationStatus.CONNECTED) {
        toast.success('Provider validated successfully!')
        return
      }

      if (provider.validation_status === ValidationStatus.ERROR) {
        toast.error(`Validation failed: ${provider.validation_error || 'Unknown error'}`)
        return
      }
    }

    toast.error('Validation timeout. Please check provider status.')
  }

  const createMutation = useMutation({
    mutationFn: (data: LLMProviderCreate) => providerService.createProvider(data),
    onSuccess: async (createdProvider) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setFormOpen(false)
      await pollValidationStatus(createdProvider.id, 'created')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create provider')
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
      toast.error(error.message || 'Failed to update provider')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => providerService.deleteProvider(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] })
      toast.success('Provider deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete provider')
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
    if (window.confirm('Are you sure you want to delete this provider?')) {
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
        <h2 className="text-2xl font-bold">LLM Providers</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers?.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              variant="card"
              icon={Server}
              title="No providers found"
              description="Add an LLM provider to enable AI-powered analysis."
              action={
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              }
            />
          </div>
        ) : (
          providers?.map((provider) => (
            <Card key={provider.id} className="hover:shadow-lg transition-shadow">
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
                        aria-label="Edit provider"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(provider.id)}
                        aria-label="Delete provider"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {provider.base_url && (
                      <div>
                        <span className="text-muted-foreground">Base URL:</span>
                        <p className="font-mono text-xs break-all">{provider.base_url}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <ValidationStatusComponent
                        status={provider.validation_status}
                        error={provider.validation_error}
                      />
                    </div>

                    {provider.validated_at && (
                      <div className="text-xs text-muted-foreground">
                        Validated: {new Date(provider.validated_at).toLocaleString()}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active:</span>
                      <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                        {provider.is_active ? 'Yes' : 'No'}
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
