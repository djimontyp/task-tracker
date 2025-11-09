import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Button,
  Badge,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'
import { AdminFeatureBadge } from '@/shared/components'
import { promptsService } from '@/features/prompts/api/promptsService'
import {
  PromptType,
  PROMPT_TYPE_LABELS,
  PROMPT_TYPE_DESCRIPTIONS,
  CHARACTER_LIMITS,
} from '@/features/prompts/types'
import type { ValidationError } from '@/features/prompts/types'

const PromptTuningTab = () => {
  const queryClient = useQueryClient()

  const [selectedType, setSelectedType] = useState<PromptType>('knowledge_extraction')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const { data: promptConfig, isLoading } = useQuery({
    queryKey: ['prompt', selectedType],
    queryFn: () => promptsService.getPrompt(selectedType),
  })

  const validateMutation = useMutation({
    mutationFn: promptsService.validatePrompt,
    onSuccess: (data) => {
      setValidationErrors(data.errors)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ type, text }: { type: PromptType; text: string }) =>
      promptsService.updatePrompt(type, { prompt_text: text }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['prompt', selectedType] })
      setOriginalPrompt(data.prompt_text)
      setCurrentPrompt(data.prompt_text)
      setValidationErrors([])
      toast.success('Prompt saved successfully')
      setShowSaveDialog(false)
    },
    onError: () => {
      toast.error('Failed to save prompt')
    },
  })

  useEffect(() => {
    if (promptConfig) {
      setCurrentPrompt(promptConfig.prompt_text)
      setOriginalPrompt(promptConfig.prompt_text)
      setValidationErrors([])
    }
  }, [promptConfig])

  useEffect(() => {
    if (currentPrompt && currentPrompt !== originalPrompt) {
      validateMutation.mutate({
        prompt_text: currentPrompt,
        prompt_type: selectedType,
      })
    }
  }, [currentPrompt])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [currentPrompt, originalPrompt])

  const isDirty = currentPrompt !== originalPrompt
  const isValid = validationErrors.length === 0
  const charCount = currentPrompt.length
  const isWithinLimits = charCount >= CHARACTER_LIMITS.min && charCount <= CHARACTER_LIMITS.max

  const handleSave = () => {
    if (!isValid || !isWithinLimits) {
      toast.error('Please fix validation errors before saving')
      return
    }
    setShowSaveDialog(true)
  }

  const confirmSave = () => {
    updateMutation.mutate({ type: selectedType, text: currentPrompt })
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelDialog(true)
    }
  }

  const confirmCancel = () => {
    setCurrentPrompt(originalPrompt)
    setValidationErrors([])
    setShowCancelDialog(false)
    toast.info('Changes discarded')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <CardTitle>LLM Prompt Tuning</CardTitle>
                <AdminFeatureBadge variant="inline" size="sm" />
              </div>
              <CardDescription>Configure and test prompts for AI models</CardDescription>
            </div>
            {isDirty && <Badge variant="warning">Unsaved Changes</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt-type">Prompt Type</Label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as PromptType)}>
              <SelectTrigger id="prompt-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROMPT_TYPE_LABELS) as PromptType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    <div>
                      <div className="font-medium">{PROMPT_TYPE_LABELS[type]}</div>
                      <div className="text-xs text-muted-foreground">{PROMPT_TYPE_DESCRIPTIONS[type]}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading prompt...</div>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt-text">Prompt Text</Label>
                  <span
                    className={`text-sm ${
                      isWithinLimits ? 'text-muted-foreground' : 'text-destructive font-medium'
                    }`}
                  >
                    {charCount} / {CHARACTER_LIMITS.max} characters
                  </span>
                </div>
                <Textarea
                  id="prompt-text"
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Enter prompt text..."
                />
                {!isWithinLimits && (
                  <p className="text-sm text-destructive">
                    {charCount < CHARACTER_LIMITS.min
                      ? `Prompt must be at least ${CHARACTER_LIMITS.min} characters`
                      : `Prompt must not exceed ${CHARACTER_LIMITS.max} characters`}
                  </p>
                )}
              </div>

              {validationErrors.length > 0 && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 space-y-2">
                  <p className="text-sm font-medium text-destructive">Validation Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="text-sm text-destructive">
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {promptConfig && (
                <div className="rounded-lg border border-muted bg-muted/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Required Placeholders:</p>
                  <div className="flex flex-wrap gap-2">
                    {promptConfig.placeholders.map((placeholder) => (
                      <Badge key={placeholder} variant="outline">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={!isDirty || !isValid || !isWithinLimits}>
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={!isDirty}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Prompt Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will affect all new messages processed after saving. Existing messages will not be re-processed.
              <br />
              <br />
              <strong>Prompt Type:</strong> {PROMPT_TYPE_LABELS[selectedType]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              All unsaved changes will be lost. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PromptTuningTab
