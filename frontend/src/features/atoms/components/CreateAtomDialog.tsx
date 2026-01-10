import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Slider } from '@/shared/ui/slider'
import { FormField } from '@/shared/patterns'
import { atomService } from '../api/atomService'
import { AtomType, type Atom } from '../types'

const ATOM_TYPE_KEYS: Record<AtomType, string> = {
  [AtomType.Problem]: 'problem',
  [AtomType.Solution]: 'solution',
  [AtomType.Decision]: 'decision',
  [AtomType.Question]: 'question',
  [AtomType.Insight]: 'insight',
  [AtomType.Idea]: 'idea',
  [AtomType.Blocker]: 'blocker',
  [AtomType.Risk]: 'risk',
  [AtomType.Requirement]: 'requirement',
}

const createAtomSchema = z.object({
  type: z.nativeEnum(AtomType, {
    required_error: 'Оберіть тип атома',
  }),
  title: z
    .string()
    .min(1, 'Заголовок обов\'язковий')
    .max(200, 'Максимум 200 символів'),
  content: z
    .string()
    .min(10, 'Мінімум 10 символів')
    .max(5000, 'Максимум 5000 символів'),
  confidence: z.number().min(0).max(1).optional(),
})

type CreateAtomFormData = z.infer<typeof createAtomSchema>

export interface CreateAtomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicId: string
  onAtomCreated?: (atom: Atom) => void
}

export function CreateAtomDialog({
  open,
  onOpenChange,
  topicId,
  onAtomCreated,
}: CreateAtomDialogProps) {
  const { t } = useTranslation('atoms')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confidenceValue, setConfidenceValue] = useState<number>(0.8)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateAtomFormData>({
    resolver: zodResolver(createAtomSchema),
    defaultValues: {
      type: AtomType.Problem,
      title: '',
      content: '',
      confidence: 0.8,
    },
  })

  const selectedType = watch('type')

  const handleTypeChange = (value: string) => {
    setValue('type', value as AtomType, { shouldValidate: true })
  }

  const handleConfidenceChange = (values: number[]) => {
    const newValue = values[0]
    setConfidenceValue(newValue)
    setValue('confidence', newValue)
  }

  const onSubmit = async (data: CreateAtomFormData) => {
    setIsSubmitting(true)

    try {
      const newAtom = await atomService.createAtom({
        type: data.type,
        title: data.title,
        content: data.content,
        confidence: data.confidence,
      })

      await atomService.linkAtomToTopic(newAtom.id, topicId)

      toast.success(t('messages.created'))

      onAtomCreated?.(newAtom)
      reset()
      setConfidenceValue(0.8)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : t('createDialog.errors.unknown')
      toast.error(t('createDialog.errors.createFailed', { error: message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    setConfidenceValue(0.8)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('createDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField label={t('createDialog.fields.type.label')} required error={errors.type?.message}>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger id="type" aria-label={t('createDialog.fields.type.label')}>
                <SelectValue placeholder={t('createDialog.fields.type.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AtomType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`createDialog.types.${ATOM_TYPE_KEYS[type]}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label={t('createDialog.fields.title.label')} required error={errors.title?.message}>
            <Input
              id="title"
              {...register('title')}
              placeholder={t('createDialog.fields.title.placeholder')}
              maxLength={200}
            />
          </FormField>

          <FormField label={t('createDialog.fields.content.label')} required error={errors.content?.message}>
            <Textarea
              id="content"
              {...register('content')}
              placeholder={t('createDialog.fields.content.placeholder')}
              rows={8}
              className="resize-y"
            />
          </FormField>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidence">{t('createDialog.fields.confidence.label')}</Label>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(confidenceValue * 100)}%
              </span>
            </div>
            <Slider
              id="confidence"
              min={0}
              max={1}
              step={0.01}
              value={[confidenceValue]}
              onValueChange={handleConfidenceChange}
              aria-label={t('createDialog.fields.confidence.ariaLabel')}
              className="w-full"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? t('createDialog.actions.creating') : t('createDialog.actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
