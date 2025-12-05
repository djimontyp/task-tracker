import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Spinner,
} from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import { AgentConfigCreate, AgentConfigUpdate } from '@/features/agents/types'
import { providerService } from '@/features/providers/api'
import { useOllamaModels } from '@/features/providers/hooks'
import { ProviderType, ValidationStatus } from '@/features/providers/types'

interface AgentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AgentConfigCreate | AgentConfigUpdate) => void
  initialData?: Partial<AgentConfigCreate>
  isEdit?: boolean
  loading?: boolean
}

const AgentForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  loading = false,
}: AgentFormProps) => {
  const [formData, setFormData] = useState<Partial<AgentConfigCreate>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    provider_id: initialData?.provider_id || '',
    model_name: initialData?.model_name || '',
    system_prompt: initialData?.system_prompt || '',
    temperature: initialData?.temperature ?? 0.7,
    max_tokens: initialData?.max_tokens ?? 2000,
    is_active: initialData?.is_active ?? true,
  })

  const [manualModelInput, setManualModelInput] = useState(false)

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['providers', 'active'],
    queryFn: () => providerService.listProviders({ active_only: true }),
    refetchInterval: (query) => {
      const hasActiveValidation = query.state.data?.some(
        (p) => p.validation_status === ValidationStatus.VALIDATING || p.validation_status === ValidationStatus.PENDING
      )
      return hasActiveValidation ? 2000 : false
    },
  })

  const selectedProvider = providers?.find((p) => p.id === formData.provider_id)
  const isOllamaProvider = selectedProvider?.type === ProviderType.OLLAMA
  const hasProviderSelected = !!formData.provider_id && !!selectedProvider

  const { models, isLoading: modelsLoading, error: modelsError } = useOllamaModels(
    selectedProvider?.base_url || '',
    hasProviderSelected && isOllamaProvider && !manualModelInput
  )

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        provider_id: initialData.provider_id || '',
        model_name: initialData.model_name || '',
        system_prompt: initialData.system_prompt || '',
        temperature: initialData.temperature ?? 0.7,
        max_tokens: initialData.max_tokens ?? 2000,
        is_active: initialData.is_active ?? true,
      })
    }
  }, [initialData])

  useEffect(() => {
    setManualModelInput(false)
    setFormData((prev) => ({ ...prev, model_name: '' }))
  }, [formData.provider_id])

  useEffect(() => {
    if (models.length > 0 && !formData.model_name && !isEdit) {
      setFormData((prev) => ({ ...prev, model_name: models[0].name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, isEdit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as AgentConfigCreate)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Agent' : 'Create Agent'}</DialogTitle>
        </DialogHeader>

        {providersLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Name" id="name" required>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Agent"
                required
              />
            </FormField>

            <FormField label="Description" id="description">
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Agent description"
              />
            </FormField>

            <FormField label="Provider" id="provider_id" required>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              >
                <SelectTrigger id="provider_id">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name} ({provider.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="model_name">Model Name *</Label>
                {hasProviderSelected && isOllamaProvider && models.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setManualModelInput(!manualModelInput)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {manualModelInput ? 'Use dropdown' : 'Manual input'}
                  </button>
                )}
              </div>

              {!hasProviderSelected ? (
                <div className="px-4 py-2 text-sm border border-input bg-muted rounded-md text-muted-foreground">
                  Please select a provider first
                </div>
              ) : isOllamaProvider && !manualModelInput ? (
                <>
                  {modelsLoading ? (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm border border-input bg-background rounded-md">
                      <Spinner className="w-4 h-4" />
                      <span className="text-muted-foreground">Loading models...</span>
                    </div>
                  ) : modelsError ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 text-sm border border-destructive bg-destructive/10 rounded-md text-destructive">
                        {modelsError}
                      </div>
                      <Input
                        id="model_name"
                        value={formData.model_name}
                        onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                        placeholder="llama3.2:latest"
                        required
                      />
                    </div>
                  ) : models.length > 0 ? (
                    <Select
                      value={formData.model_name}
                      onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                    >
                      <SelectTrigger id="model_name">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-2">
                      <div className="px-4 py-2 text-sm border border-input bg-muted rounded-md text-muted-foreground">
                        No models found. Please enter model name manually.
                      </div>
                      <Input
                        id="model_name"
                        value={formData.model_name}
                        onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                        placeholder="llama3.2:latest"
                        required
                      />
                    </div>
                  )}
                </>
              ) : (
                <Input
                  id="model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="llama3.2:latest"
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt *</Label>
              <textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="You are a helpful assistant..."
                required
                className="w-full min-h-[100px] px-4 py-2 text-sm rounded-md border border-input bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Temperature" id="temperature">
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                  }
                />
              </FormField>

              <FormField label="Max Tokens" id="max_tokens">
                <Input
                  id="max_tokens"
                  type="number"
                  step="100"
                  min="100"
                  value={formData.max_tokens}
                  onChange={(e) =>
                    setFormData({ ...formData, max_tokens: parseInt(e.target.value) })
                  }
                />
              </FormField>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {isEdit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AgentForm
