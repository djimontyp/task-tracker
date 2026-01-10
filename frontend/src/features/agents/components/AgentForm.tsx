import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, RefreshCw } from 'lucide-react'
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
  MultiSelect,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import { AgentConfigCreate, AgentConfigUpdate } from '@/features/agents/types'
import { providerService } from '@/features/providers/api'
import { useOllamaModels, useGeminiModels } from '@/features/providers/hooks'
import { ProviderType, ValidationStatus } from '@/features/providers/types'
import { projectService } from '@/features/projects/api/projectService'

// Base prompt used for knowledge extraction (read-only reference)
const BASE_PROMPT_TEXT = `You are a knowledge extraction expert. Your ONLY job is to analyze messages and return valid JSON.

CRITICAL: You must respond with ONLY a JSON object. No explanations, no markdown, no extra text.

Extract two things:
1. TOPICS - Main discussion themes (2-4 words each)
2. ATOMS - Specific knowledge units (problem/solution/insight/decision/question/pattern/requirement)

JSON STRUCTURE (respond with EXACTLY this format):
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Brief description",
      "confidence": 0.8,
      "keywords": ["keyword1", "keyword2"],
      "related_message_ids": [1, 2]
    }
  ],
  "atoms": [
    {
      "type": "problem",
      "title": "Brief title",
      "content": "Full description",
      "confidence": 0.8,
      "topic_name": "Topic Name",
      "related_message_ids": [1],
      "links_to_atom_titles": [],
      "link_types": []
    }
  ]
}

RULES:
1. ALL fields must be present (use empty arrays [] for lists if no data)
2. confidence must be a number between 0.0 and 1.0
3. type must be one of: problem, solution, insight, decision, question, pattern, requirement
4. NO extra fields allowed
5. Respond ONLY with JSON - no markdown formatting, no explanations

If you cannot extract any topics or atoms, return:
{"topics": [], "atoms": []}`

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
  const { t } = useTranslation('agents')
  const [formData, setFormData] = useState<Partial<AgentConfigCreate> & { project_ids?: string[] }>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    provider_id: initialData?.provider_id || '',
    model_name: initialData?.model_name || '',
    system_prompt: initialData?.system_prompt || '',
    temperature: initialData?.temperature ?? 0.7,
    max_tokens: initialData?.max_tokens ?? 2000,
    is_active: initialData?.is_active ?? true,
    project_ids: [],
  })

  const [manualModelInput, setManualModelInput] = useState(false)
  const [basePromptOpen, setBasePromptOpen] = useState(false)
  const [hasAutoSelectedModel, setHasAutoSelectedModel] = useState(false)
  const [prevProviderId, setPrevProviderId] = useState(initialData?.provider_id || '')

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

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.listProjects(),
  })

  const projectOptions = (projectsData?.items ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }))

  const selectedProvider = providers?.find((p) => p.id === formData.provider_id)
  const isOllamaProvider = selectedProvider?.type === ProviderType.OLLAMA
  const isGeminiProvider = selectedProvider?.type === ProviderType.GEMINI
  const hasProviderSelected = !!formData.provider_id && !!selectedProvider

  // Lazy load models: for editing - don't fetch until user clicks "Change model"
  // For new agents - don't fetch until user clicks "Load models"
  const shouldFetchOnMount = !isEdit && !formData.model_name
  const {
    models: ollamaModels,
    isLoading: ollamaModelsLoading,
    error: ollamaModelsError,
    triggerFetch: triggerOllamaFetch,
    hasFetched: ollamaHasFetched,
  } = useOllamaModels(
    selectedProvider?.base_url || '',
    hasProviderSelected && isOllamaProvider && !manualModelInput,
    shouldFetchOnMount
  )

  // Gemini models - fetch when Gemini provider is selected
  const {
    data: geminiModelsData,
    isLoading: geminiModelsLoading,
    error: geminiModelsError,
  } = useGeminiModels(hasProviderSelected && isGeminiProvider ? selectedProvider?.id : undefined)

  // Filter out embedding models - they don't support chat API
  const ollamaChatModels = ollamaModels.filter((model) => {
    const name = model.name.toLowerCase()
    return !name.includes('embed') && !name.includes('minilm')
  })

  // Filter Gemini models to only show chat-capable ones
  const geminiChatModels = (geminiModelsData?.models ?? []).filter((model) => {
    const name = model.name.toLowerCase()
    return !name.includes('embed') && !name.includes('embedding')
  })

  // Unified models interface
  const models = isGeminiProvider ? geminiChatModels : ollamaChatModels
  const modelsLoading = isGeminiProvider ? geminiModelsLoading : ollamaModelsLoading
  const modelsError = isGeminiProvider ? (geminiModelsError?.message || null) : ollamaModelsError
  const hasFetched = isGeminiProvider ? !!geminiModelsData : ollamaHasFetched
  const triggerFetch = isGeminiProvider ? () => {} : triggerOllamaFetch // Gemini auto-fetches

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
        project_ids: [],
      })
    }
  }, [initialData])

  // Track provider_id changes separately to avoid infinite loop
  useEffect(() => {
    const currentProviderId = formData.provider_id ?? ''
    if (currentProviderId !== prevProviderId) {
      setPrevProviderId(currentProviderId)
      setManualModelInput(false)
      setHasAutoSelectedModel(false) // Reset to allow auto-selection for new provider
      setFormData((prev) => ({ ...prev, model_name: '' }))
    }
  }, [formData.provider_id, prevProviderId])

  // Auto-select first model when models load (only for new agents)
  useEffect(() => {
    if (models.length > 0 && !formData.model_name && !isEdit && !hasAutoSelectedModel) {
      setFormData((prev) => ({ ...prev, model_name: models[0].name }))
      setHasAutoSelectedModel(true)
    }
  }, [models, formData.model_name, isEdit, hasAutoSelectedModel])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as AgentConfigCreate)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('form.title.edit') : t('form.title.create')}</DialogTitle>
        </DialogHeader>

        {providersLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t('form.fields.name.label')} id="name" required>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('form.fields.name.placeholder')}
                required
              />
            </FormField>

            <FormField label={t('form.fields.description.label')} id="description">
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('form.fields.description.placeholder')}
              />
            </FormField>

            <FormField label={t('form.fields.provider.label')} id="provider_id" required>
              <Select
                value={formData.provider_id}
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
              >
                <SelectTrigger id="provider_id">
                  <SelectValue placeholder={t('form.fields.provider.placeholder')} />
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
                <Label htmlFor="model_name">{t('form.fields.modelName.label')} *</Label>
                {hasProviderSelected && (isOllamaProvider || isGeminiProvider) && models.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setManualModelInput(!manualModelInput)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {manualModelInput ? t('form.fields.modelName.useDropdown') : t('form.fields.modelName.manualInput')}
                  </button>
                )}
              </div>

              {!hasProviderSelected ? (
                <div className="px-4 py-2 text-sm border border-input bg-muted rounded-md text-muted-foreground">
                  {t('form.messages.selectProviderFirst')}
                </div>
              ) : (isOllamaProvider || isGeminiProvider) && !manualModelInput ? (
                <>
                  {/* Lazy loading: show current model with "Change" button if not fetched yet */}
                  {!hasFetched && formData.model_name ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2 text-sm border border-input bg-background rounded-md">
                        {formData.model_name}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerFetch}
                        className="shrink-0"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('form.actions.changeModel', 'Change')}
                      </Button>
                    </div>
                  ) : !hasFetched && !formData.model_name ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerFetch}
                      className="w-full justify-start"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('form.actions.loadModels', 'Load available models')}
                    </Button>
                  ) : modelsLoading ? (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm border border-input bg-background rounded-md">
                      <Spinner className="w-4 h-4" />
                      <span className="text-muted-foreground">{t('form.messages.loadingModels')}</span>
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
                        placeholder={t('form.fields.modelName.placeholder')}
                        required
                      />
                    </div>
                  ) : models.length > 0 ? (
                    <Select
                      value={formData.model_name}
                      onValueChange={(value) => setFormData({ ...formData, model_name: value })}
                    >
                      <SelectTrigger id="model_name">
                        <SelectValue placeholder={t('form.fields.modelName.selectPlaceholder')} />
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
                        {t('form.messages.noModelsFound')}
                      </div>
                      <Input
                        id="model_name"
                        value={formData.model_name}
                        onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                        placeholder={t('form.fields.modelName.placeholder')}
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
                  placeholder={t('form.fields.modelName.placeholder')}
                  required
                />
              )}
            </div>

            <div className="space-y-4">
              <Collapsible open={basePromptOpen} onOpenChange={setBasePromptOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-foreground text-muted-foreground transition-colors">
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${basePromptOpen ? 'rotate-90' : ''}`}
                  />
                  {t('form.fields.basePrompt.label', 'Base Prompt (Read-only)')}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <pre className="bg-muted p-4 rounded-md text-sm max-h-40 overflow-auto whitespace-pre-wrap font-mono">
                    {BASE_PROMPT_TEXT}
                  </pre>
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">
                  {t('form.fields.customInstructions.label', 'Custom Instructions')} *
                </Label>
                <textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder={t('form.fields.customInstructions.placeholder', 'Additional instructions for the agent...')}
                  required
                  className="w-full min-h-[100px] px-4 py-2 text-sm rounded-md border border-input bg-background"
                />
              </div>
            </div>

            <FormField
              label={t('form.fields.projects.label', 'Projects')}
              id="project_ids"
              description={t('form.fields.projects.description', 'Project context will be injected into the prompt')}
            >
              {projectsLoading ? (
                <div className="flex items-center gap-2 px-4 py-2 text-sm border border-input bg-background rounded-md">
                  <Spinner className="w-4 h-4" />
                  <span className="text-muted-foreground">{t('form.messages.loadingProjects', 'Loading projects...')}</span>
                </div>
              ) : (
                <MultiSelect
                  options={projectOptions}
                  value={formData.project_ids ?? []}
                  onChange={(values) => setFormData({ ...formData, project_ids: values })}
                  placeholder={t('form.fields.projects.placeholder', 'Select projects...')}
                  searchPlaceholder={t('form.fields.projects.searchPlaceholder', 'Search projects...')}
                  emptyText={t('form.fields.projects.emptyText', 'No projects found.')}
                  removeLabel={t('form.fields.projects.removeLabel', 'Remove {label}')}
                  clearLabel={t('form.fields.projects.clearLabel', 'Clear all projects')}
                />
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('form.fields.temperature.label')} id="temperature">
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

              <FormField label={t('form.fields.maxTokens.label')} id="max_tokens">
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
                {t('form.fields.active.label')}
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                {t('form.actions.cancel')}
              </Button>
              <Button type="submit" loading={loading}>
                {isEdit ? t('form.actions.update') : t('form.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { AgentForm }
