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
  Checkbox,
} from '@/shared/ui'
import { TaskConfigCreate, TaskConfigUpdate, JsonSchema } from '@/features/agents/types'
import SchemaEditor from './SchemaEditor'

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'Create Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Task"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Task description"
            />
          </div>

          <div className="space-y-2">
            <Label>Response Schema *</Label>
            <SchemaEditor
              value={formData.response_schema || defaultSchema}
              onChange={handleSchemaChange}
            />
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
      </DialogContent>
    </Dialog>
  )
}

export default TaskForm
