import { useState, useEffect } from 'react'
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
} from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import { ProviderType, LLMProviderCreate, LLMProviderUpdate } from '@/features/providers/types'

interface ProviderFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: LLMProviderCreate | LLMProviderUpdate) => void
  initialData?: Partial<LLMProviderCreate>
  isEdit?: boolean
  loading?: boolean
}

const ProviderForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  loading = false,
}: ProviderFormProps) => {
  const [formData, setFormData] = useState<Partial<LLMProviderCreate>>({
    name: initialData?.name || '',
    type: initialData?.type || ProviderType.OLLAMA,
    base_url: initialData?.base_url || '',
    api_key: '',
    is_active: initialData?.is_active ?? true,
  })

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        name: initialData.name || '',
        type: initialData.type || ProviderType.OLLAMA,
        base_url: initialData.base_url || '',
        api_key: '',
        is_active: initialData.is_active ?? true,
      })
    } else if (open && !initialData) {
      setFormData({
        name: '',
        type: ProviderType.OLLAMA,
        base_url: '',
        api_key: '',
        is_active: true,
      })
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as LLMProviderCreate)
  }

  const handleTypeChange = (type: ProviderType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      base_url: type === ProviderType.OLLAMA ? 'http://localhost:11434' : '',
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Provider' : 'Create Provider'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Name" id="name" required>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My LLM Provider"
              required
            />
          </FormField>

          <FormField label="Provider type" id="type" required>
            <Select
              value={formData.type}
              onValueChange={(value) => handleTypeChange(value as ProviderType)}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProviderType.OLLAMA}>Ollama</SelectItem>
                <SelectItem value={ProviderType.OPENAI}>OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {formData.type === ProviderType.OLLAMA && (
            <FormField label="Base URL" id="base_url" required>
              <Input
                id="base_url"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                placeholder="http://localhost:11434"
                required
              />
            </FormField>
          )}

          {formData.type === ProviderType.OPENAI && (
            <FormField
              label="API Key"
              id="api_key"
              required={!isEdit}
              description={isEdit ? "Leave empty to keep existing key" : undefined}
            >
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="sk-..."
                required={!isEdit}
              />
            </FormField>
          )}

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
      </DialogContent>
    </Dialog>
  )
}

export { ProviderForm }
