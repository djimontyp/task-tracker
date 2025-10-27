import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

interface RuleConditionInputProps {
  index: number
  value: {
    field: string
    operator: string
    value: string | number
  }
  onChange: (value: { field: string; operator: string; value: string | number }) => void
  onRemove: () => void
}

interface FieldOption {
  value: string
  label: string
  type: 'number' | 'text'
}

const fieldOptions: FieldOption[] = [
  { value: 'confidence', label: 'Confidence', type: 'number' },
  { value: 'similarity', label: 'Similarity', type: 'number' },
  { value: 'topic_count', label: 'Topic Count', type: 'number' },
  { value: 'topic.name', label: 'Topic Name', type: 'text' },
  { value: 'atom.content', label: 'Atom Content', type: 'text' },
]

const numberOperators = [
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'eq', label: '=' },
  { value: 'ne', label: '≠' },
]

const textOperators = [
  { value: 'contains', label: 'Contains' },
  { value: 'eq', label: 'Equals' },
  { value: 'starts_with', label: 'Starts with' },
]

export function RuleConditionInput({ value, onChange, onRemove }: RuleConditionInputProps) {
  const [field, setField] = useState(value.field || 'confidence')
  const [operator, setOperator] = useState(value.operator || 'gte')
  const [conditionValue, setConditionValue] = useState(value.value || '')

  const selectedField = fieldOptions.find((f) => f.value === field)
  const operators = selectedField?.type === 'number' ? numberOperators : textOperators

  const handleFieldChange = (newField: string) => {
    const newFieldOption = fieldOptions.find((f) => f.value === newField)
    const defaultOperator = newFieldOption?.type === 'number' ? 'gte' : 'contains'

    setField(newField)
    setOperator(defaultOperator)
    onChange({ field: newField, operator: defaultOperator, value: conditionValue })
  }

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator)
    onChange({ field, operator: newOperator, value: conditionValue })
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      selectedField?.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
    setConditionValue(newValue)
    onChange({ field, operator, value: newValue })
  }

  return (
    <div className="flex gap-2 items-center w-full">
      <Select value={field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fieldOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type={selectedField?.type === 'number' ? 'number' : 'text'}
        value={conditionValue}
        onChange={handleValueChange}
        placeholder="Value"
        className="flex-1"
        step={selectedField?.type === 'number' ? '0.01' : undefined}
        min={selectedField?.type === 'number' ? 0 : undefined}
        max={selectedField?.type === 'number' ? 100 : undefined}
      />

      <Button variant="ghost" size="icon" onClick={onRemove} type="button">
        <XMarkIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}
