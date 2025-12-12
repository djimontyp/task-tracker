import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, CloudUpload, AlertCircle, Plus, Clock, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea, Button, Skeleton, Switch, Label, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Badge, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/shared/ui'
import { ColorPickerPopover } from '@/shared/components'
import { FormField } from '@/shared/patterns'
import { PageWrapper } from '@/shared/primitives'
import { topicService } from '@/features/topics/api/topicService'
import { atomService } from '@/features/atoms/api/atomService'
import { messageService } from '@/features/messages/api/messageService'
import { AtomCard, CreateAtomDialog } from '@/features/atoms/components'
import { VersionHistoryList, VersionDiffViewer, KnowledgeExtractionPanel } from '@/features/knowledge'
import { ConsumerMessageModal } from '@/features/messages/components'
import { renderTopicIcon } from '@/features/topics/utils/renderIcon'
import { useDebounce } from '@/shared/hooks'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'
import type { Topic } from '@/features/topics/types'
import type { Atom } from '@/features/atoms/types'
import type { Message } from '@/shared/types'
import { toast } from 'sonner'

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [compareToVersion, setCompareToVersion] = useState<number | null>(null)
  const [showExtractionPanel, setShowExtractionPanel] = useState(false)
  const [pendingVersionsCount, setPendingVersionsCount] = useState(0)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  const initialValuesRef = useRef<{ name: string; description: string } | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const isFirstRenderRef = useRef(true)

  const debouncedName = useDebounce(name, 500)
  const debouncedDescription = useDebounce(description, 500)

  const { data: topic, isLoading, error } = useQuery<Topic>({
    queryKey: ['topic', topicId],
    queryFn: () => topicService.getTopicById(topicId!),
    enabled: !!topicId,
  })

  const { data: atoms = [], isLoading: isLoadingAtoms } = useQuery<Atom[]>({
    queryKey: ['atoms', 'topic', topicId],
    queryFn: () => atomService.getAtomsByTopic(topicId!),
    enabled: !!topicId,
  })

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['messages', 'topic', topicId],
    queryFn: () => messageService.getMessagesByTopic(topicId!),
    enabled: !!topicId,
  })

  useWebSocket({
    topics: ['knowledge'],
    onMessage: (data: unknown) => {
      const event = data as { type?: string; data?: { entity_type?: string; entity_id?: string } }

      if (event.type === 'knowledge.version_created' &&
          event.data?.entity_type === 'topic' &&
          event.data?.entity_id === topicId) {
        setPendingVersionsCount((prev) => prev + 1)
        queryClient.invalidateQueries({ queryKey: ['topic', topicId] })
      }
    },
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Topic> }) =>
      topicService.updateTopic(id, data),
    onMutate: async ({ data }) => {
      setSaveStatus('saving')
      setHasUnsavedChanges(false)

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      await queryClient.cancelQueries({ queryKey: ['topic', topicId] })
      const previousTopic = queryClient.getQueryData<Topic>(['topic', topicId])

      queryClient.setQueryData<Topic>(['topic', topicId], (old) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousTopic }
    },
    onSuccess: (updatedTopic) => {
      queryClient.setQueryData(['topic', topicId], updatedTopic)
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
    onError: (_err, _variables, context) => {
      if (context?.previousTopic) {
        queryClient.setQueryData(['topic', topicId], context.previousTopic)
      }
      setSaveStatus('error')
      setHasUnsavedChanges(true)
      toast.error('Failed to save changes')
    },
  })

  useEffect(() => {
    if (autoSaveEnabled && !isFirstRenderRef.current && isInitialized && initialValuesRef.current && debouncedName !== initialValuesRef.current.name && debouncedName.trim()) {
      updateMutation.mutate({
        id: topicId!,
        data: { name: debouncedName },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName, isInitialized, topicId, autoSaveEnabled])

  useEffect(() => {
    if (autoSaveEnabled && !isFirstRenderRef.current && isInitialized && initialValuesRef.current && debouncedDescription !== initialValuesRef.current.description) {
      updateMutation.mutate({
        id: topicId!,
        data: { description: debouncedDescription },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDescription, isInitialized, topicId, autoSaveEnabled])

  const handleManualSave = () => {
    if (hasUnsavedChanges && initialValuesRef.current) {
      const updates: Partial<Topic> = {}
      if (name !== initialValuesRef.current.name) updates.name = name
      if (description !== initialValuesRef.current.description) updates.description = description

      if (Object.keys(updates).length > 0) {
        updateMutation.mutate({
          id: topicId!,
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
      id: topicId!,
      data: { color },
    })
  }

  const handleAutoPickColor = async () => {
    try {
      const result = await topicService.suggestColor(topicId!)
      updateMutation.mutate({
        id: topicId!,
        data: { color: result.suggested_color },
      })
    } catch {
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
          <div className="flex items-center gap-2 text-semantic-info animate-pulse">
            <CloudUpload className="h-5 w-5" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-semantic-success animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">
              Saved {formatTimeAgo(lastSavedAt)}
            </span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-semantic-error">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Save failed</span>
          </div>
        )
      default:
        return hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-semantic-warning">
            <div className="h-2 w-2 rounded-full bg-semantic-warning animate-pulse" />
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle className="h-5 w-5" />
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
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topics
        </Button>
        <Card className="p-6 border-destructive">
          <div className="flex items-start gap-4">
            <div className="text-destructive text-lg">⚠️</div>
            <div>
              <p className="font-semibold text-destructive mb-2">Topic not found</p>
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
    <PageWrapper variant="fullWidth" className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4 flex-1">
          <Button variant="ghost" onClick={() => navigate('/topics')} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Topics
          </Button>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/topics">Topics</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{topic.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

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
        <div className="flex items-center justify-end gap-4 pb-2">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Topic Details</CardTitle>
            <CardDescription>Edit topic information and manage knowledge</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={showVersionHistory} onOpenChange={setShowVersionHistory}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" aria-label="View version history">
                  <Clock className="h-4 w-4 mr-2" />
                  Version History
                  {pendingVersionsCount > 0 && (
                    <Badge className="ml-2 bg-semantic-warning text-white hover:bg-semantic-warning/90">
                      {pendingVersionsCount} pending
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Version History - {topic.name}</SheetTitle>
                </SheetHeader>

                <div className="mt-6">
                  <VersionHistoryList
                    entityType="topic"
                    entityId={topic.id}
                    enableBulkActions={true}
                    onSelectVersion={(version) => {
                      setSelectedVersion(version)
                      setCompareToVersion(version - 1)
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Dialog open={showExtractionPanel} onOpenChange={setShowExtractionPanel}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" aria-label="Extract knowledge from messages">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract Knowledge
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Extract Knowledge from Messages</DialogTitle>
                </DialogHeader>

                <KnowledgeExtractionPanel
                  messageIds={messages.filter(m => typeof m.id === 'number').map((m) => m.id as number)}
                  topicId={topicId!}
                  onComplete={() => {
                    setShowExtractionPanel(false)
                    queryClient.invalidateQueries({ queryKey: ['topic', topicId] })
                    queryClient.invalidateQueries({ queryKey: ['atoms', 'topic', topicId] })
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center">
                {renderTopicIcon(topic.icon, 'h-10 w-10', topic.color)}
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <FormField label="Topic Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter topic name"
                  className={`text-2xl font-bold h-auto py-2 transition-colors ${
                    hasUnsavedChanges ? 'border-semantic-warning/50' : ''
                  }`}
                />
              </FormField>

              <div className="flex items-center gap-4">
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

          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter topic description"
              rows={6}
              className={`resize-none transition-colors ${
                hasUnsavedChanges ? 'border-semantic-warning/50' : ''
              }`}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Topic ID</div>
              <div className="text-sm font-mono">{topic.id}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Created</div>
              <div className="text-sm">
                {new Date(topic.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Last Updated</div>
              <div className="text-sm">
                {new Date(topic.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Knowledge Atoms</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Atom
            </Button>
          </div>

          {isLoadingAtoms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : atoms.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg mb-2">No atoms yet</p>
                <p className="text-sm">Create your first knowledge atom to get started.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atoms.map((atom) => (
                <AtomCard key={atom.id} atom={atom} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Related Messages</h2>

          {isLoadingMessages ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg">No messages linked to this topic yet.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  className="p-4 cursor-pointer hover:bg-accent hover:border-accent-foreground/20 transition-colors"
                  onClick={() => setSelectedMessageId(message.id ? String(message.id) : null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedMessageId(message.id ? String(message.id) : null)
                    }
                  }}
                  aria-label={`Open message: ${message.content.substring(0, 50)}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-foreground line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(message.sent_at).toLocaleString('uk-UA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">{message.author_name}</span>
                      <span>•</span>
                      <span>{message.source_name}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateAtomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        topicId={topicId!}
        onAtomCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['atoms', 'topic', topicId] })
        }}
      />

      {selectedVersion && compareToVersion !== null && (
        <Dialog
          open={selectedVersion !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedVersion(null)
              setCompareToVersion(null)
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version Comparison</DialogTitle>
            </DialogHeader>

            <VersionDiffViewer
              entityType="topic"
              entityId={topic.id}
              version={selectedVersion}
              compareToVersion={compareToVersion}
              onApprove={() => {
                setPendingVersionsCount((prev) => Math.max(0, prev - 1))
                setSelectedVersion(null)
                setCompareToVersion(null)
                queryClient.invalidateQueries({ queryKey: ['topic', topicId] })
              }}
              onReject={() => {
                setSelectedVersion(null)
                setCompareToVersion(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedMessageId && (
        <ConsumerMessageModal
          messageId={selectedMessageId}
          onClose={() => setSelectedMessageId(null)}
        />
      )}
    </PageWrapper>
  )
}

export default TopicDetailPage
