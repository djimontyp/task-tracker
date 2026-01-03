import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  Spinner,
  Badge,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/shared/ui'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { FormField } from '@/shared/patterns'
import { JsonResponseViewer } from '@/shared/components/JsonResponseViewer'
import { AgentConfig } from '@/features/agents/types'
import { agentService } from '@/features/agents/api'
import { toast } from 'sonner'

interface AgentTestDialogProps {
  agent: AgentConfig | null
  open: boolean
  onClose: () => void
}

interface TestResult {
  agent_id: string
  agent_name: string
  prompt: string
  response: string
  elapsed_time: number
  model_name: string
  provider_name: string
  provider_type: string
}

const EXAMPLE_PROMPTS = [
  'Треба зробити редизайн головної сторінки до п\'ятниці',
  'Баг в оплаті - користувачі скаржаться що списується двічі',
  'Домовились з клієнтом проDemo на наступний тиждень',
]

const MIN_PROMPT_LENGTH = 1
const MAX_PROMPT_LENGTH = 5000

const AgentTestDialog = ({ agent, open, onClose }: AgentTestDialogProps) => {
  const { t } = useTranslation('agents')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)

  // Compose the full prompt (base system prompt + user input)
  // TODO: In future, this should include project-specific context from API
  const composedPrompt = agent
    ? `${agent.system_prompt}\n\n---\n\nUser message:\n${prompt || '(empty)'}`
    : ''

  const testMutation = useMutation({
    mutationFn: (promptText: string) => {
      if (!agent) throw new Error('Agent not provided')
      return agentService.testAgent(agent.id, promptText)
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success(t('testDialog.toast.success'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('testDialog.toast.error'))
      setResult(null)
    },
  })

  const handleTest = () => {
    if (prompt.length < MIN_PROMPT_LENGTH) {
      toast.error(t('testDialog.toast.promptTooShort', { count: MIN_PROMPT_LENGTH }))
      return
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      toast.error(t('testDialog.toast.promptTooLong', { count: MAX_PROMPT_LENGTH }))
      return
    }
    testMutation.mutate(prompt)
  }

  const handleClear = () => {
    setPrompt('')
    setResult(null)
  }

  const handleExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt)
    setResult(null)
  }

  const handleClose = () => {
    handleClear()
    onClose()
  }

  const isPromptValid =
    prompt.length >= MIN_PROMPT_LENGTH && prompt.length <= MAX_PROMPT_LENGTH

  const characterCount = prompt.length
  const characterCountColor =
    characterCount < MIN_PROMPT_LENGTH
      ? 'text-semantic-error'
      : characterCount > MAX_PROMPT_LENGTH
        ? 'text-semantic-error'
        : 'text-muted-foreground'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agent?.name ? t('testDialog.title', { name: agent.name }) : t('testDialog.titleUnknown')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompt Input */}
          <FormField label={t('testDialog.fields.prompt.label')}>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('testDialog.fields.prompt.placeholder')}
              className="min-h-[120px] resize-none"
              disabled={testMutation.isPending}
            />
            <div className="flex items-center justify-between text-xs mt-2">
              <span className={characterCountColor}>
                {t('testDialog.fields.prompt.characters', { current: characterCount, max: MAX_PROMPT_LENGTH })}
              </span>
              {characterCount < MIN_PROMPT_LENGTH && (
                <span className="text-semantic-error">
                  {t('testDialog.fields.prompt.minRequired', { count: MIN_PROMPT_LENGTH })}
                </span>
              )}
            </div>
          </FormField>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={testMutation.isPending || !prompt}
            >
              {t('testDialog.actions.clear')}
            </Button>
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExamplePrompt(examplePrompt)}
                  disabled={testMutation.isPending}
                  className="whitespace-nowrap text-xs"
                >
                  {t('testDialog.actions.example', { number: index + 1 })}
                </Button>
              ))}
            </div>
          </div>

          {/* View Full Prompt - Collapsible */}
          <Collapsible open={isPromptExpanded} onOpenChange={setIsPromptExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                {isPromptExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {t('testDialog.actions.viewFullPrompt', 'View full prompt')}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-60 whitespace-pre-wrap break-words font-mono">
                {composedPrompt}
              </pre>
            </CollapsibleContent>
          </Collapsible>

          {/* Test Results */}
          {testMutation.isPending && (
            <div className="flex items-center justify-center py-8 space-x-2">
              <Spinner />
              <span className="text-sm text-muted-foreground">{t('testDialog.status.testing')}</span>
            </div>
          )}

          {result && !testMutation.isPending && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{t('testDialog.results.title')}</span>
                <Badge variant="default">{t('testDialog.results.success')}</Badge>
              </div>

              <JsonResponseViewer response={result.response} />

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('testDialog.results.model')}</span>
                  <p className="font-mono text-xs mt-2">{result.model_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('testDialog.results.provider')}</span>
                  <p className="font-mono text-xs mt-2 capitalize">{result.provider_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('testDialog.results.time')}</span>
                  <p className="font-mono text-xs mt-2">
                    {t('testDialog.results.timeValue', { value: (result.elapsed_time * 1000).toFixed(0) })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('testDialog.actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleTest}
            disabled={!agent || !isPromptValid || testMutation.isPending}
            loading={testMutation.isPending}
          >
            {t('testDialog.actions.test')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { AgentTestDialog }
