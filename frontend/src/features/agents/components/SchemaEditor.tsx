import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui'
import { Plus, Trash2 } from 'lucide-react'
import { JsonSchema, SchemaPropertyConfig } from '@/features/agents/types'

interface SchemaField {
  name: string
  type: string
  description?: string
}

interface SchemaEditorProps {
  value: JsonSchema
  onChange: (schema: JsonSchema) => void
}

const FIELD_TYPES = [
  'string',
  'number',
  'boolean',
  'array',
  'object',
  'date',
  'email',
  'url',
]

const SchemaEditor = ({ value, onChange }: SchemaEditorProps) => {
  const [fields, setFields] = useState<SchemaField[]>(() => {
    // Parse existing schema to fields
    if (value?.properties) {
      return Object.entries(value.properties).map(([name, config]) => ({
        name,
        type: config.type || 'string',
        description: config.description || '',
      }))
    }
    return []
  })

  const handleAddField = () => {
    setFields([...fields, { name: '', type: 'string', description: '' }])
  }

  const handleRemoveField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    setFields(newFields)
    updateSchema(newFields)
  }

  const handleFieldChange = (
    index: number,
    key: keyof SchemaField,
    value: string
  ) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], [key]: value }
    setFields(newFields)
    updateSchema(newFields)
  }

  const updateSchema = (currentFields: SchemaField[]) => {
    const properties: Record<string, SchemaPropertyConfig> = {}
    const required: string[] = []

    currentFields.forEach((field) => {
      if (field.name) {
        properties[field.name] = {
          type: field.type,
          ...(field.description && { description: field.description }),
        }
        required.push(field.name)
      }
    })

    onChange({
      type: 'object',
      properties,
      required,
    })
  }

  const getSchemaPreview = (): JsonSchema => {
    const properties: Record<string, SchemaPropertyConfig> = {}
    fields.forEach((field) => {
      if (field.name) {
        properties[field.name] = {
          type: field.type,
          ...(field.description && { description: field.description }),
        }
      }
    })

    return {
      type: 'object',
      properties,
      required: fields.filter((f) => f.name).map((f) => f.name),
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Schema Fields</CardTitle>
            <Button size="sm" onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No fields added yet. Click "Add Field" to start.
            </p>
          ) : (
            fields.map((field, index) => (
              <Card key={index} className="p-3">
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <Label htmlFor={`field-name-${index}`} className="text-xs">
                      Field Name
                    </Label>
                    <Input
                      id={`field-name-${index}`}
                      value={field.name}
                      onChange={(e) =>
                        handleFieldChange(index, 'name', e.target.value)
                      }
                      placeholder="field_name"
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-3">
                    <Label htmlFor={`field-type-${index}`} className="text-xs">
                      Type
                    </Label>
                    <Select
                      value={field.type}
                      onValueChange={(value) =>
                        handleFieldChange(index, 'type', value)
                      }
                    >
                      <SelectTrigger
                        id={`field-type-${index}`}
                        className="mt-1"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-4">
                    <Label
                      htmlFor={`field-description-${index}`}
                      className="text-xs"
                    >
                      Description
                    </Label>
                    <Input
                      id={`field-description-${index}`}
                      value={field.description}
                      onChange={(e) =>
                        handleFieldChange(index, 'description', e.target.value)
                      }
                      placeholder="Optional"
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-1 flex items-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveField(index)}
                      aria-label="Remove field"
                      className="mt-5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schema Preview (JSON)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
            {JSON.stringify(getSchemaPreview(), null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

export default SchemaEditor
