import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import toast from 'react-hot-toast'
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
import { atomService } from '../api/atomService'
import { AtomType, type Atom } from '../types'

const ATOM_TYPE_LABELS: Record<AtomType, string> = {
  [AtomType.Problem]: 'Проблема',
  [AtomType.Solution]: 'Рішення',
  [AtomType.Decision]: 'Рішення',
  [AtomType.Question]: 'Питання',
  [AtomType.Insight]: 'Інсайт',
  [AtomType.Pattern]: 'Патерн',
  [AtomType.Requirement]: 'Вимога',
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
  topicId: number
  onAtomCreated?: (atom: Atom) => void
}

export function CreateAtomDialog({
  open,
  onOpenChange,
  topicId,
  onAtomCreated,
}: CreateAtomDialogProps) {
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

      toast.success('Атом успішно створено')

      onAtomCreated?.(newAtom)
      reset()
      setConfidenceValue(0.8)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Невідома помилка'
      toast.error(`Помилка створення атома: ${message}`)
      console.error('Failed to create atom:', error)
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
          <DialogTitle>Створити новий атом</DialogTitle>
          <DialogDescription>
            Атом буде автоматично прив'язаний до поточного топіка
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">
              Тип атома <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger id="type" aria-label="Тип атома">
                <SelectValue placeholder="Оберіть тип" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(AtomType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {ATOM_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive" role="alert">
                {errors.type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              Заголовок <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Короткий опис атома"
              maxLength={200}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Зміст <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Детальний опис атома (мінімум 10 символів)"
              rows={8}
              className="resize-y"
              aria-invalid={!!errors.content}
              aria-describedby={errors.content ? 'content-error' : undefined}
            />
            {errors.content && (
              <p id="content-error" className="text-sm text-destructive" role="alert">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="confidence">Впевненість (необов'язково)</Label>
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
              aria-label="Рівень впевненості"
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
              Скасувати
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Створення...' : 'Створити атом'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
