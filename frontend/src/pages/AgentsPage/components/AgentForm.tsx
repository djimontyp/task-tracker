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
} from '@shared/ui'
import { AgentConfigCreate, AgentConfigUpdate } from '@/types/agent'
import { providerService } from '@/services/providerService'

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

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['providers', 'active'],
    queryFn: () => providerService.listProviders({ active_only: true }),
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as AgentConfigCreate)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Agent' : 'Create Agent'}</DialogTitle>
        </DialogHeader>

        {providersLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Agent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Agent description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_id">Provider *</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_name">Model Name *</Label>
              <Input
                id="model_name"
                value={formData.model_name}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                placeholder="llama3.2:latest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_prompt">System Prompt *</Label>
              <textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                placeholder="You are a helpful assistant..."
                required
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
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
              </div>
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
