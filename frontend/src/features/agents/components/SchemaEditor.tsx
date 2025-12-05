import { useState } from 'react'
import {
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
import { JsonSchema, SchemaPropertyConfig, SchemaField, FieldType } from '@/features/agents/types'

interface SchemaEditorProps {
  value: JsonSchema
  onChange: (schema: JsonSchema) => void
}

/**
 * Supported field types for Response Schema.
 *
 * Maps to backend Pydantic types:
 * - string: str
 * - number: float (decimal numbers like 3.14)
 * - integer: int (whole numbers like 42)
 * - boolean: bool
 * - array: list
 * - object: dict
 * - date: datetime.date (ISO 8601 date)
 * - email: EmailStr (validated email)
 * - url: HttpUrl (validated HTTP/HTTPS URL)
 */
const FIELD_TYPE_OPTIONS = [
  { value: 'string', label: 'String (text)' },
  { value: 'number', label: 'Number (decimal)' },
  { value: 'integer', label: 'Integer (whole number)' },
  { value: 'boolean', label: 'Boolean (true/false)' },
  { value: 'array', label: 'Array (list)' },
  { value: 'object', label: 'Object (JSON)' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
] as const

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
    const newFields: SchemaField[] = [...fields, { name: '', type: 'string' as FieldType, description: '' }]
    setFields(newFields)
    updateSchema(newFields)

    setTimeout(() => {
      const index = newFields.length - 1
      document.getElementById(`field-name-${index}`)?.focus()
    }, 0)
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


  return (
    <div className="space-y-4">
      {fields.length > 0 && (
        <div className="hidden md:grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
          <div className="col-span-4">Field Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-5">Description</div>
          <div className="col-span-1"></div>
        </div>
      )}

      <div className="border rounded-md">
        {fields.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 px-4">
            <p className="mb-2">No fields defined yet</p>
            <p className="text-sm">
              Fields define what data the AI agent should return.
              <br />
              For example: &quot;summary&quot; (text), &quot;priority&quot; (number), &quot;tags&quot; (array)
            </p>
          </div>
        ) : (
          fields.map((field, index) => (
            <div
              key={index}
              className="flex flex-col space-y-4 md:space-y-0 md:grid md:grid-cols-12 md:gap-2 p-4 border-b last:border-b-0"
            >
              <div className="w-full md:col-span-4">
                <Label htmlFor={`field-name-${index}`} className="text-xs md:sr-only">
                  Field Name
                </Label>
                <Input
                  id={`field-name-${index}`}
                  value={field.name}
                  onChange={(e) =>
                    handleFieldChange(index, 'name', e.target.value)
                  }
                  placeholder="field_name"
                  className="w-full mt-2 md:mt-0"
                  aria-required="true"
                />
              </div>

              <div className="w-full md:col-span-2">
                <Label htmlFor={`field-type-${index}`} className="text-xs md:sr-only">
                  Type
                </Label>
                <Select
                  value={field.type}
                  onValueChange={(value) =>
                    handleFieldChange(index, 'type', value)
                  }
                >
                  <SelectTrigger id={`field-type-${index}`} className="w-full mt-2 md:mt-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPE_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:col-span-5">
                <Label
                  htmlFor={`field-description-${index}`}
                  className="text-xs md:sr-only"
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
                  className="w-full mt-2 md:mt-0"
                />
              </div>

              <div className="w-full md:col-span-1 md:flex md:items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRemoveField(index)}
                  aria-label={`Remove ${field.name || 'field ' + (index + 1)}`}
                  className="w-full md:w-auto min-h-[44px] md:min-h-0 md:size-9"
                >
                  <Trash2 className="h-4 w-4 md:mr-0 mr-2" />
                  <span className="md:hidden">Remove Field</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-center pt-2">
        <Button type="button" size="sm" onClick={handleAddField} className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>
  )
}

export default SchemaEditor
