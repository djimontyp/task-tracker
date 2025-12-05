import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Textarea,
  Spinner,
  Badge,
} from '@/shared/ui'
import { FormField } from '@/shared/patterns'
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
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)

  const testMutation = useMutation({
    mutationFn: (promptText: string) => {
      if (!agent) throw new Error('Agent not provided')
      return agentService.testAgent(agent.id, promptText)
    },
    onSuccess: (data) => {
      setResult(data)
      toast.success('Agent test completed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to test agent')
      setResult(null)
    },
  })

  const handleTest = () => {
    if (prompt.length < MIN_PROMPT_LENGTH) {
      toast.error(`Prompt must be at least ${MIN_PROMPT_LENGTH} characters`)
      return
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      toast.error(`Prompt must be no more than ${MAX_PROMPT_LENGTH} characters`)
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
          <DialogTitle>Test Agent: {agent?.name || 'Unknown'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompt Input */}
          <FormField label="Prompt">
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your test prompt here..."
              className="min-h-[120px] resize-none"
              disabled={testMutation.isPending}
            />
            <div className="flex items-center justify-between text-xs mt-2">
              <span className={characterCountColor}>
                Characters: {characterCount}/{MAX_PROMPT_LENGTH}
              </span>
              {characterCount < MIN_PROMPT_LENGTH && (
                <span className="text-semantic-error">
                  Minimum {MIN_PROMPT_LENGTH} characters required
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
              Clear
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
                  Example {index + 1}
                </Button>
              ))}
            </div>
          </div>

          {/* Test Results */}
          {testMutation.isPending && (
            <div className="flex items-center justify-center py-8 space-x-2">
              <Spinner />
              <span className="text-sm text-muted-foreground">Testing agent...</span>
            </div>
          )}

          {result && !testMutation.isPending && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Test Results</span>
                <Badge variant="default">Success</Badge>
              </div>

              <div className="space-y-2">
                <Label>Response</Label>
                <div className="max-h-[300px] overflow-y-auto rounded-md border border-input bg-muted/50 px-4 py-2">
                  <pre className="text-sm whitespace-pre-wrap break-words">
                    {result.response}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Model:</span>
                  <p className="font-mono text-xs mt-2">{result.model_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>
                  <p className="font-mono text-xs mt-2 capitalize">{result.provider_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <p className="font-mono text-xs mt-2">
                    {(result.elapsed_time * 1000).toFixed(0)} ms
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleTest}
            disabled={!agent || !isPromptValid || testMutation.isPending}
            loading={testMutation.isPending}
          >
            Test Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AgentTestDialog
