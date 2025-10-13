# useAutoSave Hook - Usage Guide

Reusable hook для auto-save функціональності з manual save режимом.

## Features

- ✅ Auto-save з debounce (default 500ms)
- ✅ Manual save режим (toggle)
- ✅ Optimistic updates
- ✅ Save status tracking (idle/saving/saved/error)
- ✅ Unsaved changes detection
- ✅ Discard changes функція
- ✅ Toast notifications на помилки

## Basic Usage

```tsx
import { useAutoSave } from '@/shared/hooks'
import { AutoSaveToggle, SaveStatusIndicator } from '@/shared/components'

interface FormData {
  name: string
  description: string
}

const MyEditPage = () => {
  const { data: item } = useQuery<FormData>(['item', id], fetchItem)

  const updateMutation = useMutation({
    mutationFn: (values: FormData) => apiClient.updateItem(id, values),
  })

  const autoSave = useAutoSave<FormData>({
    initialValues: item || { name: '', description: '' },
    onSave: async (values) => {
      const result = await updateMutation.mutateAsync(values)
      return result
    },
    debounceMs: 500,
    enabled: true,
    onSuccess: (data) => {
      console.log('Saved!', data)
    },
    onError: (error) => {
      console.error('Save failed:', error)
    },
  })

  return (
    <div>
      {/* Header with status and toggle */}
      <div className="flex items-center justify-between">
        <h1>Edit Item</h1>

        <div className="flex items-center gap-4">
          <SaveStatusIndicator
            status={autoSave.saveStatus}
            hasUnsavedChanges={autoSave.hasUnsavedChanges}
            lastSavedAt={autoSave.lastSavedAt}
          />

          <AutoSaveToggle
            enabled={autoSave.autoSaveEnabled}
            onToggle={autoSave.setAutoSaveEnabled}
          />
        </div>
      </div>

      {/* Manual save buttons (when auto-save is OFF) */}
      {!autoSave.autoSaveEnabled && autoSave.hasUnsavedChanges && (
        <div className="flex gap-2">
          <Button onClick={autoSave.discardChanges}>Discard</Button>
          <Button onClick={autoSave.manualSave}>Save Changes</Button>
        </div>
      )}

      {/* Form inputs */}
      <Input
        value={autoSave.values.name}
        onChange={(e) => autoSave.setValue('name', e.target.value)}
      />

      <Textarea
        value={autoSave.values.description}
        onChange={(e) => autoSave.setValue('description', e.target.value)}
      />
    </div>
  )
}
```

## API Reference

### `useAutoSave<T>(options)`

#### Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initialValues` | `T` | required | Початкові значення форми |
| `onSave` | `(values: T) => Promise<any>` | required | Функція збереження (async) |
| `debounceMs` | `number` | `500` | Затримка debounce (мс) |
| `enabled` | `boolean` | `true` | Увімкнено hook |
| `onSuccess` | `(data: any) => void` | `undefined` | Callback після успішного save |
| `onError` | `(error: Error) => void` | `undefined` | Callback при помилці |

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `values` | `T` | Поточні значення |
| `setValue` | `<K>(key: K, value: T[K]) => void` | Встановити одне поле |
| `setValues` | `(values: T) => void` | Встановити всі значення |
| `saveStatus` | `'idle' \| 'saving' \| 'saved' \| 'error'` | Статус збереження |
| `hasUnsavedChanges` | `boolean` | Є незбережені зміни |
| `lastSavedAt` | `Date \| null` | Час останнього save |
| `autoSaveEnabled` | `boolean` | Auto-save увімкнено |
| `setAutoSaveEnabled` | `(enabled: boolean) => void` | Toggle auto-save |
| `manualSave` | `() => Promise<void>` | Зберегти вручну |
| `discardChanges` | `() => void` | Скинути зміни |
| `isSaving` | `boolean` | В процесі збереження |
| `reset` | `() => void` | Повний reset |

## Components

### `SaveStatusIndicator`

Показує статус збереження з іконками та текстом.

**Props:**
- `status: SaveStatus` - Статус (idle/saving/saved/error)
- `hasUnsavedChanges: boolean` - Є незбережені зміни
- `lastSavedAt: Date | null` - Час останнього save
- `className?: string` - Custom CSS класи

**States:**
- 🟢 "All changes saved" (зелений чек)
- 🔵 "Saving..." (синя хмарка, pulse)
- 🟡 "Unsaved changes" (жовта крапка, pulse)
- 🔴 "Save failed" (червоний warning)

### `AutoSaveToggle`

Switch для увімкнення/вимкнення auto-save.

**Props:**
- `enabled: boolean` - Auto-save увімкнено
- `onToggle: (enabled: boolean) => void` - Callback при toggle
- `className?: string` - Custom CSS класи

## Advanced Examples

### With React Query Integration

```tsx
const { data: topic } = useQuery<Topic>({
  queryKey: ['topic', topicId],
  queryFn: () => topicService.getTopicById(topicId),
})

const updateMutation = useMutation({
  mutationFn: (values: Partial<Topic>) =>
    topicService.updateTopic(topicId, values),
  onSuccess: (updatedTopic) => {
    queryClient.setQueryData(['topic', topicId], updatedTopic)
    queryClient.invalidateQueries(['topics'])
  },
})

const autoSave = useAutoSave({
  initialValues: topic || { name: '', description: '' },
  onSave: async (values) => await updateMutation.mutateAsync(values),
})
```

### With Custom Validation

```tsx
const autoSave = useAutoSave({
  initialValues: formData,
  onSave: async (values) => {
    // Custom validation
    if (!values.name.trim()) {
      throw new Error('Name is required')
    }
    return await saveData(values)
  },
  onError: (error) => {
    toast.error(error.message)
  },
})
```

### Multiple Forms on Same Page

```tsx
const profileAutoSave = useAutoSave({
  initialValues: profile,
  onSave: saveProfile,
})

const settingsAutoSave = useAutoSave({
  initialValues: settings,
  onSave: saveSettings,
})
```

## Best Practices

1. **Always provide initialValues** - Не використовуйте `undefined`
2. **Use React Query** - Для кешування та optimistic updates
3. **Handle errors** - Додавайте `onError` callback
4. **Debounce wisely** - 500ms хороший default, але можна налаштувати
5. **Reset on route change** - Викликайте `reset()` при unmount або зміні route

## Migration from Manual Save

До (manual save):
```tsx
const [name, setName] = useState('')
const handleSave = async () => {
  await apiClient.update({ name })
}
```

Після (auto-save):
```tsx
const autoSave = useAutoSave({
  initialValues: { name: '' },
  onSave: (values) => apiClient.update(values),
})
// autoSave.setValue('name', newValue)
```
