import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, CheckCircleIcon, CloudArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { Card, Input, Textarea, Button, Skeleton, Switch, Label } from '@/shared/ui'
import { ColorPickerPopover } from '@/shared/components'
import { topicService } from '@/features/topics/api/topicService'
import { renderTopicIcon } from '@/features/topics/utils/renderIcon'
import { useDebounce } from '@/shared/hooks'
import type { Topic } from '@/features/topics/types'
import toast from 'react-hot-toast'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const TopicDetailPage = () => {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)

  const initialValuesRef = useRef<{ name: string; description: string } | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isFirstRenderRef = useRef(true)

  const debouncedName = useDebounce(name, 500)
  const debouncedDescription = useDebounce(description, 500)

  const { data: topic, isLoading, error } = useQuery<Topic>({
    queryKey: ['topic', parseInt(topicId!)],
    queryFn: () => topicService.getTopicById(parseInt(topicId!)),
    enabled: !!topicId,
  })

  useEffect(() => {
    setIsInitialized(false)
    setHasUnsavedChanges(false)
    setSaveStatus('idle')
    initialValuesRef.current = null
    isFirstRenderRef.current = true
  }, [topicId])

  useEffect(() => {
    if (topic && !isInitialized) {
      setName(topic.name)
      setDescription(topic.description)
      setLastSavedAt(new Date(topic.updated_at))
      initialValuesRef.current = {
        name: topic.name,
        description: topic.description,
      }
      setIsInitialized(true)

      setTimeout(() => {
        isFirstRenderRef.current = false
      }, 100)
    }
  }, [topic, isInitialized])

  useEffect(() => {
    if (isInitialized && initialValuesRef.current) {
      const hasChanges =
        name !== initialValuesRef.current.name ||
        description !== initialValuesRef.current.description

      if (hasChanges && !hasUnsavedChanges) {
        setHasUnsavedChanges(true)
        setSaveStatus('idle')
      }
    }
  }, [name, description, isInitialized, hasUnsavedChanges])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Topic> }) =>
      topicService.updateTopic(id, data),
    onMutate: async ({ data }) => {
      setSaveStatus('saving')
      setHasUnsavedChanges(false)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      await queryClient.cancelQueries({ queryKey: ['topic', parseInt(topicId!)] })
      const previousTopic = queryClient.getQueryData<Topic>(['topic', parseInt(topicId!)])

      queryClient.setQueryData<Topic>(['topic', parseInt(topicId!)], (old) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousTopic }
    },
    onSuccess: (updatedTopic) => {
      queryClient.setQueryData(['topic', parseInt(topicId!)], updatedTopic)
      queryClient.invalidateQueries({ queryKey: ['topics'] })

      initialValuesRef.current = {
        name: updatedTopic.name,
        description: updatedTopic.description,
      }

      setHasUnsavedChanges(false)
      setSaveStatus('saved')
      setLastSavedAt(new Date())

      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
    },
    onError: (err, variables, context) => {
      if (context?.previousTopic) {
        queryClient.setQueryData(['topic', parseInt(topicId!)], context.previousTopic)
      }
      setSaveStatus('error')
      setHasUnsavedChanges(true)
      toast.error('Failed to save changes')
    },
  })

  useEffect(() => {
    if (autoSaveEnabled && !isFirstRenderRef.current && isInitialized && initialValuesRef.current && debouncedName !== initialValuesRef.current.name && debouncedName.trim()) {
      updateMutation.mutate({
        id: parseInt(topicId!),
        data: { name: debouncedName },
      })
    }
  }, [debouncedName, isInitialized, topicId, autoSaveEnabled])

  useEffect(() => {
    if (autoSaveEnabled && !isFirstRenderRef.current && isInitialized && initialValuesRef.current && debouncedDescription !== initialValuesRef.current.description) {
      updateMutation.mutate({
        id: parseInt(topicId!),
        data: { description: debouncedDescription },
      })
    }
  }, [debouncedDescription, isInitialized, topicId, autoSaveEnabled])

  const handleManualSave = () => {
    if (hasUnsavedChanges && initialValuesRef.current) {
      const updates: Partial<Topic> = {}
      if (name !== initialValuesRef.current.name) updates.name = name
      if (description !== initialValuesRef.current.description) updates.description = description

      if (Object.keys(updates).length > 0) {
        updateMutation.mutate({
          id: parseInt(topicId!),
          data: updates,
        })
      }
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const handleColorChange = (color: string) => {
    updateMutation.mutate({
      id: parseInt(topicId!),
      data: { color },
    })
  }

  const handleAutoPickColor = async () => {
    try {
      const result = await topicService.suggestColor(parseInt(topicId!))
      updateMutation.mutate({
        id: parseInt(topicId!),
        data: { color: result.suggested_color },
      })
    } catch (error) {
      toast.error('Failed to suggest color')
    }
  }

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return ''
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 animate-pulse">
            <CloudArrowUpIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1 duration-300">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              Saved {formatTimeAgo(lastSavedAt)}
            </span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <ExclamationCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Save failed</span>
          </div>
        )
      default:
        return hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm">All changes saved</span>
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/topics')}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Topics
        </Button>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-3">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-1">Topic not found</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/topics')}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Topics
        </Button>

        <div className="flex items-center gap-4">
          {renderSaveStatus()}

          <div className="flex items-center gap-2 pl-4 border-l border-border">
            <Label htmlFor="auto-save-toggle" className="text-sm text-muted-foreground cursor-pointer">
              Auto-save
            </Label>
            <Switch
              id="auto-save-toggle"
              checked={autoSaveEnabled}
              onCheckedChange={setAutoSaveEnabled}
            />
          </div>
        </div>
      </div>

      {!autoSaveEnabled && hasUnsavedChanges && (
        <div className="flex items-center justify-end gap-3 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (topic) {
                setName(topic.name)
                setDescription(topic.description)
                setHasUnsavedChanges(false)
              }
            }}
          >
            Discard Changes
          </Button>
          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={updateMutation.isPending || !hasUnsavedChanges}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      <Card className="p-8">
        <div className="space-y-6">

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center">
                {renderTopicIcon(topic.icon, 'h-10 w-10', topic.color)}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Topic Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter topic name"
                  className={`text-2xl font-bold h-auto py-2 transition-colors ${
                    hasUnsavedChanges ? 'border-amber-300 dark:border-amber-700' : ''
                  }`}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-muted-foreground">Color:</div>
                <ColorPickerPopover
                  color={topic.color || '#64748B'}
                  onColorChange={handleColorChange}
                  onAutoPickClick={handleAutoPickColor}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter topic description"
              rows={6}
              className={`resize-none transition-colors ${
                hasUnsavedChanges ? 'border-amber-300 dark:border-amber-700' : ''
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Topic ID</div>
              <div className="text-sm font-mono">{topic.id}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Created</div>
              <div className="text-sm">
                {new Date(topic.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Last Updated</div>
              <div className="text-sm">
                {new Date(topic.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TopicDetailPage
