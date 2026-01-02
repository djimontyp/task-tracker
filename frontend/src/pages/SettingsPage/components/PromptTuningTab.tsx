import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { FormField } from '@/shared/patterns'
import { promptsService } from '@/features/prompts/api/promptsService'
import {
  PromptType,
  PROMPT_TYPE_LABELS,
  PROMPT_TYPE_DESCRIPTIONS,
  CHARACTER_LIMITS,
} from '@/features/prompts/types'
import type { ValidationError } from '@/features/prompts/types'

const PromptTuningTab = () => {
  const { t } = useTranslation('settings')
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
      toast.success(t('prompts.toast.saved'))
      setShowSaveDialog(false)
    },
    onError: () => {
      toast.error(t('prompts.toast.saveFailed'))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrompt, originalPrompt])

  const isDirty = currentPrompt !== originalPrompt
  const isValid = validationErrors.length === 0
  const charCount = currentPrompt.length
  const isWithinLimits = charCount >= CHARACTER_LIMITS.min && charCount <= CHARACTER_LIMITS.max

  const handleSave = () => {
    if (!isValid || !isWithinLimits) {
      toast.error(t('prompts.validation.fixErrors'))
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
    toast.info(t('prompts.toast.discarded'))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <CardTitle>{t('prompts.title')}</CardTitle>
                <AdminFeatureBadge variant="inline" size="sm" />
              </div>
              <CardDescription>{t('prompts.description')}</CardDescription>
            </div>
            {isDirty && <Badge variant="warning">{t('prompts.unsavedChanges')}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField label={t('prompts.promptType')} id="prompt-type">
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
          </FormField>

          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">{t('prompts.loading')}</div>
          ) : (
            <>
              <FormField
                label={t('prompts.promptText')}
                id="prompt-text"
                error={
                  !isWithinLimits
                    ? charCount < CHARACTER_LIMITS.min
                      ? t('prompts.validation.minLength', { min: CHARACTER_LIMITS.min })
                      : t('prompts.validation.maxLength', { max: CHARACTER_LIMITS.max })
                    : undefined
                }
                description={t('prompts.characterCount', { count: charCount, max: CHARACTER_LIMITS.max })}
              >
                <Textarea
                  id="prompt-text"
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder={t('prompts.placeholder')}
                />
              </FormField>

              {validationErrors.length > 0 && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4 space-y-2">
                  <p className="text-sm font-medium text-destructive">{t('prompts.validation.errors')}</p>
                  <ul className="list-disc list-inside space-y-2">
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
                  <p className="text-sm font-medium">{t('prompts.placeholders.title')}</p>
                  <div className="flex flex-wrap gap-2">
                    {promptConfig.placeholders.map((placeholder) => (
                      <Badge key={placeholder} variant="outline">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={handleSave} disabled={!isDirty || !isValid || !isWithinLimits}>
                  {t('prompts.buttons.save')}
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={!isDirty}>
                  {t('prompts.buttons.cancel')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('prompts.dialogs.save.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('prompts.dialogs.save.description')}
              <br />
              <br />
              <strong>{t('prompts.dialogs.save.promptType')}</strong> {PROMPT_TYPE_LABELS[selectedType]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('prompts.dialogs.save.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>{t('prompts.dialogs.save.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('prompts.dialogs.discard.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('prompts.dialogs.discard.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('prompts.dialogs.discard.keepEditing')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel} className="bg-destructive text-destructive-foreground">
              {t('prompts.dialogs.discard.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PromptTuningTab
