import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui'
import { FormField } from '@/shared/patterns'
import { Info } from 'lucide-react'
import { TaskConfigCreate, TaskConfigUpdate, JsonSchema } from '@/features/agents/types'
import { SchemaEditor } from './SchemaEditor'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: TaskConfigCreate | TaskConfigUpdate) => void
  initialData?: Partial<TaskConfigCreate>
  isEdit?: boolean
  loading?: boolean
}

const defaultSchema: JsonSchema = {
  type: 'object',
  properties: {},
  required: [],
}

const TaskForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isEdit = false,
  loading = false,
}: TaskFormProps) => {
  const { t } = useTranslation('agents')
  const [formData, setFormData] = useState<Partial<TaskConfigCreate>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    response_schema: initialData?.response_schema || defaultSchema,
    is_active: initialData?.is_active ?? true,
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        response_schema: initialData.response_schema || defaultSchema,
        is_active: initialData.is_active ?? true,
      })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData as TaskConfigCreate)
  }

  const handleSchemaChange = (schema: JsonSchema) => {
    setFormData({ ...formData, response_schema: schema })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] md:max-w-2xl lg:max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('taskForm.title.edit') : t('taskForm.title.create')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('taskForm.fields.name.label')} required>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('taskForm.fields.name.placeholder')}
              required
            />
          </FormField>

          <FormField label={t('taskForm.fields.description.label')}>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t('taskForm.fields.description.placeholder')}
            />
          </FormField>

          <fieldset className="space-y-2">
            <legend className="sr-only">{t('taskForm.responseFields.legend')}</legend>
            <div className="flex items-center gap-2">
              <Label htmlFor="response-fields">{t('taskForm.responseFields.label')}</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      className="h-4 w-4 text-muted-foreground cursor-help"
                      aria-label={t('taskForm.responseFields.helpAriaLabel')}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('taskForm.responseFields.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('taskForm.responseFields.description')}
            </p>
            <SchemaEditor
              value={formData.response_schema || defaultSchema}
              onChange={handleSchemaChange}
            />
          </fieldset>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked as boolean })
              }
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              {t('status.active')}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { TaskForm }
