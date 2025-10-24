# Phase 5: Knowledge Proposal Review System - Frontend Specification

**Created:** October 23, 2025
**Status:** Design Specification
**Phase:** 5 (Frontend UI)
**Dependencies:** Phase 0-4 (Database, Services, API, Duplicate Detection)

---

## Overview

Comprehensive frontend specification for Knowledge Proposal Review System following the proven TaskProposal pattern. All components mirror existing `features/proposals/` architecture with adaptations for Topics and Atoms.

**Reference Implementation:** `frontend/src/features/proposals/`
**Target:** `frontend/src/features/knowledge/proposals/`

---

## 1. Type Definitions

### 1.1 Core Proposal Types

**File:** `frontend/src/features/knowledge/types/proposals.ts`

```typescript
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'merged'

export type SimilarityType = 'exact' | 'semantic' | 'fuzzy' | 'none'

export interface TopicProposal {
  id: string
  extraction_run_id: string
  status: ProposalStatus

  proposed_name: string
  proposed_description: string
  proposed_keywords: string[]
  proposed_icon: string | null
  proposed_color: string | null

  confidence: number
  reasoning: string

  similar_topic_id: number | null
  similarity_score: number | null
  similarity_type: SimilarityType | null

  source_message_ids: number[]
  message_count: number

  reviewed_by_user_id: number | null
  reviewed_at: string | null
  review_action: 'approved' | 'rejected' | 'merged' | null
  review_notes: string | null

  created_at: string
}

export interface AtomProposal {
  id: string
  extraction_run_id: string
  status: ProposalStatus

  proposed_type: AtomType
  proposed_title: string
  proposed_content: string
  proposed_topic_id: number | null
  proposed_topic_name: string | null

  confidence: number
  reasoning: string

  similar_atom_id: number | null
  similarity_score: number | null
  similarity_type: SimilarityType | null

  source_message_ids: number[]
  message_count: number

  reviewed_by_user_id: number | null
  reviewed_at: string | null
  review_action: 'approved' | 'rejected' | 'merged' | null
  review_notes: string | null

  created_at: string
}

export interface KnowledgeExtractionRun {
  id: string
  agent_config_id: string
  message_count: number
  topics_proposed: number
  atoms_proposed: number
  topics_approved: number
  atoms_approved: number
  status: 'pending' | 'completed' | 'failed'
  started_at: string
  completed_at: string | null
}

export interface ProposalListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface ProposalFilters {
  run_id?: string
  status?: ProposalStatus
  confidence_min?: number
  confidence_max?: number
  type?: 'topic' | 'atom'
  atom_type?: AtomType
  has_similar?: boolean
  skip?: number
  limit?: number
}

export interface ApproveProposalRequest {
  review_notes?: string
}

export interface RejectProposalRequest {
  reason: string
}

export interface MergeProposalRequest {
  target_id: number
  merge_strategy?: 'keep_existing' | 'keep_new' | 'manual'
}

export interface UpdateTopicProposalRequest {
  proposed_name?: string
  proposed_description?: string
  proposed_keywords?: string[]
  proposed_icon?: string | null
  proposed_color?: string | null
}

export interface UpdateAtomProposalRequest {
  proposed_type?: AtomType
  proposed_title?: string
  proposed_content?: string
  proposed_topic_id?: number | null
}
```

---

## 2. Component Architecture

### 2.1 Feature Structure

```
frontend/src/features/knowledge/proposals/
├── api/
│   ├── topicProposalService.ts
│   ├── atomProposalService.ts
│   └── extractionRunService.ts
├── components/
│   ├── ProposalReviewDashboard.tsx
│   ├── TopicProposalCard.tsx
│   ├── AtomProposalCard.tsx
│   ├── MergeProposalDialog.tsx
│   ├── VersionHistoryViewer.tsx
│   ├── ConfidenceFilter.tsx
│   ├── ProposalFilters.tsx
│   ├── ExtractionRunCard.tsx
│   ├── BulkActionToolbar.tsx
│   └── index.ts
├── hooks/
│   ├── useTopicProposals.ts
│   ├── useAtomProposals.ts
│   ├── useProposalReview.ts
│   ├── useBulkActions.ts
│   └── useExtractionRuns.ts
└── types/
    └── index.ts
```

---

## 3. Core Components

### 3.1 ProposalReviewDashboard

**File:** `components/ProposalReviewDashboard.tsx`

**Purpose:** Main review interface with tabbed view for Topics/Atoms, filters, and bulk actions

```typescript
interface ProposalReviewDashboardProps {
  extractionRunId?: string
  defaultTab?: 'topics' | 'atoms'
}

export const ProposalReviewDashboard: React.FC<ProposalReviewDashboardProps> = ({
  extractionRunId,
  defaultTab = 'topics',
}) => {
  const [activeTab, setActiveTab] = useState<'topics' | 'atoms'>(defaultTab)
  const [filters, setFilters] = useState<ProposalFilters>({
    status: 'pending',
    confidence_min: 0.5,
    run_id: extractionRunId,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // TanStack Query hooks
  const topicProposalsQuery = useTopicProposals(filters)
  const atomProposalsQuery = useAtomProposals(filters)

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const unsubscribe = websocketClient.subscribe(
      'knowledge.proposal_created',
      () => {
        topicProposalsQuery.refetch()
        atomProposalsQuery.refetch()
      }
    )
    return unsubscribe
  }, [])

  const handleBulkApprove = async () => {
    await bulkApproveProposals(Array.from(selectedIds), activeTab)
    setSelectedIds(new Set())
    refetch()
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Knowledge Proposal Review</h1>
        <p className="text-muted-foreground">
          Review and approve auto-extracted Topics and Atoms
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'topics' | 'atoms')}>
        <TabsList className="mb-4">
          <TabsTrigger value="topics">
            Topics ({topicProposalsQuery.data?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="atoms">
            Atoms ({atomProposalsQuery.data?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <ProposalFilters
          filters={filters}
          onFiltersChange={setFilters}
          proposalType={activeTab}
        />

        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <BulkActionToolbar
            selectedCount={selectedIds.size}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        )}

        {/* Topic Proposals Tab */}
        <TabsContent value="topics">
          {topicProposalsQuery.isLoading ? (
            <Spinner />
          ) : topicProposalsQuery.error ? (
            <ErrorMessage error={topicProposalsQuery.error} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {topicProposalsQuery.data?.items.map((proposal) => (
                <TopicProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isSelected={selectedIds.has(proposal.id)}
                  onToggleSelect={() => toggleSelection(proposal.id)}
                  onApprove={() => handleApprove(proposal.id, 'topic')}
                  onReject={() => openRejectDialog(proposal.id, 'topic')}
                  onMerge={() => openMergeDialog(proposal)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Atom Proposals Tab */}
        <TabsContent value="atoms">
          {atomProposalsQuery.isLoading ? (
            <Spinner />
          ) : atomProposalsQuery.error ? (
            <ErrorMessage error={atomProposalsQuery.error} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {atomProposalsQuery.data?.items.map((proposal) => (
                <AtomProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isSelected={selectedIds.has(proposal.id)}
                  onToggleSelect={() => toggleSelection(proposal.id)}
                  onApprove={() => handleApprove(proposal.id, 'atom')}
                  onReject={() => openRejectDialog(proposal.id, 'atom')}
                  onMerge={() => openMergeDialog(proposal)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <MergeProposalDialog
        open={mergeDialogOpen}
        proposal={selectedProposal}
        onClose={() => setMergeDialogOpen(false)}
      />
      <RejectProposalDialog
        open={rejectDialogOpen}
        proposalId={selectedProposalId}
        proposalType={activeTab}
        onClose={() => setRejectDialogOpen(false)}
      />
    </div>
  )
}
```

**Key Features:**
- Tabbed interface (Topics/Atoms)
- Real-time updates via WebSocket
- Bulk selection and actions
- Confidence-based filtering
- Mobile-responsive grid (1/2/3 columns)
- Keyboard navigation support

---

### 3.2 TopicProposalCard

**File:** `components/TopicProposalCard.tsx`

**Purpose:** Display topic proposal with similar entity detection

```typescript
interface TopicProposalCardProps {
  proposal: TopicProposal
  isSelected?: boolean
  onToggleSelect?: () => void
  onApprove?: () => void
  onReject?: () => void
  onMerge?: () => void
  isLoading?: boolean
}

export const TopicProposalCard: React.FC<TopicProposalCardProps> = ({
  proposal,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onMerge,
  isLoading,
}) => {
  const [showReasoning, setShowReasoning] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const similarTopic = useSimilarTopic(proposal.similar_topic_id)

  const getConfidenceBadge = (confidence: number) => {
    if (confidence < 0.7) return <Badge className="badge-error">Low {(confidence * 100).toFixed(0)}%</Badge>
    if (confidence < 0.9) return <Badge className="badge-warning">Medium {(confidence * 100).toFixed(0)}%</Badge>
    return <Badge className="badge-success">High {(confidence * 100).toFixed(0)}%</Badge>
  }

  const statusBadge = {
    pending: <Badge className="badge-warning">Pending</Badge>,
    approved: <Badge className="badge-success">Approved</Badge>,
    rejected: <Badge className="badge-error">Rejected</Badge>,
    merged: <Badge className="badge-purple">Merged</Badge>,
  }[proposal.status]

  return (
    <Card className="p-4 hover:shadow-md transition-all relative">
      {/* Selection Checkbox */}
      {onToggleSelect && proposal.status === 'pending' && (
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300"
            aria-label="Select proposal"
          />
        </div>
      )}

      <div className="space-y-3 pl-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {statusBadge}
            {getConfidenceBadge(proposal.confidence)}
            {proposal.similar_topic_id && (
              <Badge className="badge-warning flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Similar Found
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground" title={proposal.id}>
            ID: {proposal.id.slice(0, 8)}
          </span>
        </div>

        {/* Topic Name with Icon/Color Preview */}
        <div className="flex items-center gap-3">
          {proposal.proposed_icon && (
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: proposal.proposed_color ?? '#6366f1' }}
            >
              <span className="text-white text-xl">{proposal.proposed_icon}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{proposal.proposed_name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {proposal.proposed_description}
            </p>
          </div>
        </div>

        {/* Keywords */}
        {proposal.proposed_keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {proposal.proposed_keywords.map((keyword) => (
              <span
                key={keyword}
                className="text-xs px-2 py-0.5 bg-muted rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}

        {/* Similar Entity Warning */}
        {proposal.similar_topic_id && similarTopic.data && (
          <div className="border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Similar to existing topic
                </p>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>{similarTopic.data.name}</strong>
                  <span className="ml-2 text-xs opacity-75">
                    ({(proposal.similarity_score! * 100).toFixed(0)}% {proposal.similarity_type})
                  </span>
                </div>
                {onMerge && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onMerge}
                    className="mt-2 text-xs"
                  >
                    Review Merge
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LLM Reasoning (expandable) */}
        <div className="border-t pt-2">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            aria-expanded={showReasoning}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            {showReasoning ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            LLM Reasoning
          </button>
          {showReasoning && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap font-mono text-xs">{proposal.reasoning}</pre>
            </div>
          )}
        </div>

        {/* Source Messages */}
        <div className="text-sm text-muted-foreground">
          Source: {proposal.message_count} messages
        </div>

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          Created: {formatFullDate(proposal.created_at)}
          {proposal.reviewed_at && (
            <div>Reviewed: {formatFullDate(proposal.reviewed_at)}</div>
          )}
        </div>

        {/* Actions */}
        {proposal.status === 'pending' && (onApprove || onReject) && (
          <div className="flex gap-2 pt-3 border-t">
            {onApprove && (
              <Button
                size="sm"
                variant="default"
                onClick={onApprove}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onReject}
                disabled={isLoading}
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
```

**Key Features:**
- Icon/color preview matching backend selection
- Similar entity detection with visual warning
- Expandable LLM reasoning
- Confidence badge with color coding
- Bulk selection checkbox
- Mobile-responsive layout
- Accessibility attributes (aria-labels, roles)

---

### 3.3 AtomProposalCard

**File:** `components/AtomProposalCard.tsx`

**Purpose:** Display atom proposal with type-specific styling

```typescript
interface AtomProposalCardProps {
  proposal: AtomProposal
  isSelected?: boolean
  onToggleSelect?: () => void
  onApprove?: () => void
  onReject?: () => void
  onMerge?: () => void
  isLoading?: boolean
}

export const AtomProposalCard: React.FC<AtomProposalCardProps> = ({
  proposal,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onMerge,
  isLoading,
}) => {
  const [showReasoning, setShowReasoning] = useState(false)
  const similarAtom = useSimilarAtom(proposal.similar_atom_id)

  const atomTypeConfig: Record<AtomType, { label: string; className: string }> = {
    problem: { label: 'Problem', className: 'badge-error' },
    solution: { label: 'Solution', className: 'badge-success' },
    decision: { label: 'Decision', className: 'badge-info' },
    question: { label: 'Question', className: 'badge-warning' },
    insight: { label: 'Insight', className: 'badge-purple' },
    pattern: { label: 'Pattern', className: 'badge-purple' },
    requirement: { label: 'Requirement', className: 'badge-info' },
  }

  const typeConfig = atomTypeConfig[proposal.proposed_type]

  return (
    <Card className="p-4 hover:shadow-md transition-all relative">
      {/* Selection Checkbox */}
      {onToggleSelect && proposal.status === 'pending' && (
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300"
            aria-label="Select atom proposal"
          />
        </div>
      )}

      <div className="space-y-3 pl-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge className={typeConfig.className}>{typeConfig.label}</Badge>
            {proposal.confidence < 0.7 && (
              <Badge className="badge-error">Low {(proposal.confidence * 100).toFixed(0)}%</Badge>
            )}
            {proposal.confidence >= 0.7 && proposal.confidence < 0.9 && (
              <Badge className="badge-warning">Medium {(proposal.confidence * 100).toFixed(0)}%</Badge>
            )}
            {proposal.confidence >= 0.9 && (
              <Badge className="badge-success">High {(proposal.confidence * 100).toFixed(0)}%</Badge>
            )}
            {proposal.similar_atom_id && (
              <Badge className="badge-warning flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Duplicate?
              </Badge>
            )}
          </div>
        </div>

        {/* Title & Content */}
        <div>
          <h3 className="text-base font-semibold mb-1 line-clamp-2">
            {proposal.proposed_title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {proposal.proposed_content}
          </p>
        </div>

        {/* Topic Association */}
        {proposal.proposed_topic_name && (
          <div className="text-sm">
            <span className="text-muted-foreground">Topic:</span>{' '}
            <span className="font-medium">{proposal.proposed_topic_name}</span>
          </div>
        )}

        {/* Similar Atom Warning */}
        {proposal.similar_atom_id && similarAtom.data && (
          <div className="border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Similar atom exists
                </p>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>{similarAtom.data.title}</strong>
                  <span className="ml-2 text-xs">
                    ({(proposal.similarity_score! * 100).toFixed(0)}% match)
                  </span>
                </div>
                <p className="text-xs opacity-75 line-clamp-2">
                  {similarAtom.data.content}
                </p>
                {onMerge && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onMerge}
                    className="mt-2 text-xs"
                  >
                    Compare & Merge
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LLM Reasoning */}
        <div className="border-t pt-2">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            aria-expanded={showReasoning}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary"
          >
            {showReasoning ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            LLM Reasoning
          </button>
          {showReasoning && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap font-mono text-xs">{proposal.reasoning}</pre>
            </div>
          )}
        </div>

        {/* Source Messages */}
        <div className="text-sm text-muted-foreground">
          Source: {proposal.message_count} messages
        </div>

        {/* Actions */}
        {proposal.status === 'pending' && (onApprove || onReject) && (
          <div className="flex gap-2 pt-3 border-t">
            {onApprove && (
              <Button
                size="sm"
                variant="default"
                onClick={onApprove}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onReject}
                disabled={isLoading}
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
```

**Key Features:**
- Atom type color coding (problem=red, solution=green, etc.)
- Similar atom detection with content preview
- Topic association display
- Content truncation with line-clamp
- Same UX patterns as TopicProposalCard

---

### 3.4 MergeProposalDialog

**File:** `components/MergeProposalDialog.tsx`

**Purpose:** Side-by-side comparison and merge interface

```typescript
interface MergeProposalDialogProps {
  open: boolean
  proposal: TopicProposal | AtomProposal | null
  proposalType: 'topic' | 'atom'
  onClose: () => void
}

export const MergeProposalDialog: React.FC<MergeProposalDialogProps> = ({
  open,
  proposal,
  proposalType,
  onClose,
}) => {
  const [mergeStrategy, setMergeStrategy] = useState<'keep_existing' | 'keep_new' | 'manual'>('manual')
  const [mergedData, setMergedData] = useState<Partial<Topic | Atom> | null>(null)

  const existingEntity = proposalType === 'topic'
    ? useTopic(proposal?.similar_topic_id)
    : useAtom(proposal?.similar_atom_id)

  const mergeMutation = useMergeProposal(proposalType)

  useEffect(() => {
    if (!proposal || !existingEntity.data) return

    if (proposalType === 'topic') {
      const topicProposal = proposal as TopicProposal
      const existingTopic = existingEntity.data as Topic

      setMergedData({
        name: mergeStrategy === 'keep_new' ? topicProposal.proposed_name : existingTopic.name,
        description: mergeStrategy === 'keep_new' ? topicProposal.proposed_description : existingTopic.description,
        keywords: mergeStrategy === 'manual'
          ? [...new Set([...existingTopic.keywords, ...topicProposal.proposed_keywords])]
          : mergeStrategy === 'keep_new'
            ? topicProposal.proposed_keywords
            : existingTopic.keywords,
        icon: mergeStrategy === 'keep_new' ? topicProposal.proposed_icon : existingTopic.icon,
        color: mergeStrategy === 'keep_new' ? topicProposal.proposed_color : existingTopic.color,
      })
    } else {
      const atomProposal = proposal as AtomProposal
      const existingAtom = existingEntity.data as Atom

      setMergedData({
        title: mergeStrategy === 'keep_new' ? atomProposal.proposed_title : existingAtom.title,
        content: mergeStrategy === 'keep_new' ? atomProposal.proposed_content : existingAtom.content,
        type: mergeStrategy === 'keep_new' ? atomProposal.proposed_type : existingAtom.type,
      })
    }
  }, [mergeStrategy, proposal, existingEntity.data, proposalType])

  const handleMerge = async () => {
    if (!proposal || !mergedData) return

    await mergeMutation.mutateAsync({
      proposalId: proposal.id,
      targetId: proposalType === 'topic' ? proposal.similar_topic_id! : proposal.similar_atom_id!,
      mergeStrategy,
      mergedData,
    })

    onClose()
  }

  if (!proposal || !existingEntity.data) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge {proposalType === 'topic' ? 'Topic' : 'Atom'} Proposal</DialogTitle>
          <DialogDescription>
            Compare and merge similar {proposalType}s. Choose which fields to keep.
          </DialogDescription>
        </DialogHeader>

        {/* Merge Strategy Selector */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Merge Strategy</label>
          <RadioGroup value={mergeStrategy} onValueChange={setMergeStrategy}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="keep_existing" id="keep_existing" />
              <label htmlFor="keep_existing" className="text-sm cursor-pointer">
                Keep Existing (discard proposal)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="keep_new" id="keep_new" />
              <label htmlFor="keep_new" className="text-sm cursor-pointer">
                Keep New (update existing with proposal)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <label htmlFor="manual" className="text-sm cursor-pointer">
                Manual (choose fields individually)
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Existing Entity */}
          <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Existing {proposalType === 'topic' ? 'Topic' : 'Atom'}
            </h3>
            {proposalType === 'topic' ? (
              <TopicComparisonView topic={existingEntity.data as Topic} />
            ) : (
              <AtomComparisonView atom={existingEntity.data as Atom} />
            )}
          </div>

          {/* New Proposal */}
          <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            <h3 className="text-sm font-semibold mb-2 text-green-900 dark:text-green-100">
              New Proposal
            </h3>
            {proposalType === 'topic' ? (
              <TopicProposalComparisonView proposal={proposal as TopicProposal} />
            ) : (
              <AtomProposalComparisonView proposal={proposal as AtomProposal} />
            )}
          </div>

          {/* Merged Result Preview */}
          <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
            <h3 className="text-sm font-semibold mb-2 text-purple-900 dark:text-purple-100">
              Merged Result
            </h3>
            {proposalType === 'topic' ? (
              <TopicComparisonView topic={mergedData as Topic} editable={mergeStrategy === 'manual'} />
            ) : (
              <AtomComparisonView atom={mergedData as Atom} editable={mergeStrategy === 'manual'} />
            )}
          </div>
        </div>

        {/* Similarity Score */}
        <div className="text-sm text-muted-foreground mb-4">
          Similarity: {((proposal.similarity_score ?? 0) * 100).toFixed(0)}% ({proposal.similarity_type})
        </div>

        {/* Actions */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={mergeMutation.isPending}
          >
            {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Key Features:**
- Three merge strategies (keep existing, keep new, manual selection)
- Side-by-side 3-column comparison (existing / new / result)
- Real-time preview of merged result
- Field-level editing in manual mode
- Color-coded panels (blue=existing, green=new, purple=merged)

---

### 3.5 VersionHistoryViewer

**File:** `components/VersionHistoryViewer.tsx`

**Purpose:** Display approval/rejection history and changes

```typescript
interface VersionHistoryViewerProps {
  entityType: 'topic' | 'atom'
  entityId: number
}

export const VersionHistoryViewer: React.FC<VersionHistoryViewerProps> = ({
  entityType,
  entityId,
}) => {
  const historyQuery = useProposalHistory(entityType, entityId)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Proposal History</h3>

      {historyQuery.isLoading ? (
        <Spinner />
      ) : historyQuery.data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No proposal history found</p>
      ) : (
        <div className="space-y-3">
          {historyQuery.data?.map((event) => (
            <div
              key={event.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {event.review_action === 'approved' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  )}
                  {event.review_action === 'rejected' && (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                  {event.review_action === 'merged' && (
                    <ArrowsRightLeftIcon className="h-5 w-5 text-purple-600" />
                  )}
                  <span className="font-medium capitalize">{event.review_action}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(event.reviewed_at)}
                </span>
              </div>

              {event.review_notes && (
                <p className="text-sm text-muted-foreground mb-2">{event.review_notes}</p>
              )}

              <div className="text-xs text-muted-foreground">
                Confidence: {(event.confidence * 100).toFixed(0)}%
                {event.similar_entity_id && (
                  <span className="ml-2">
                    | Similar: {(event.similarity_score! * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Show diff for merged proposals */}
              {event.review_action === 'merged' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpandedId(event.id)}
                  className="mt-2 text-xs"
                >
                  View Merge Details
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 4. TanStack Query Hooks

### 4.1 useTopicProposals

**File:** `hooks/useTopicProposals.ts`

```typescript
export const useTopicProposals = (filters?: ProposalFilters) => {
  return useQuery({
    queryKey: ['topic-proposals', filters],
    queryFn: () => topicProposalService.list(filters),
    staleTime: 30000,
  })
}

export const useTopicProposal = (id: string) => {
  return useQuery({
    queryKey: ['topic-proposal', id],
    queryFn: () => topicProposalService.get(id),
    enabled: !!id,
  })
}

export const useApproveTopicProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      topicProposalService.approve(id, { review_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-proposals'] })
      toast.success('Topic proposal approved')
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`)
    },
  })
}

export const useRejectTopicProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      topicProposalService.reject(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-proposals'] })
      toast.success('Topic proposal rejected')
    },
  })
}

export const useMergeTopicProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, targetId }: { id: string; targetId: number }) =>
      topicProposalService.merge(id, { target_id: targetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-proposals'] })
      queryClient.invalidateQueries({ queryKey: ['topics'] })
      toast.success('Topic proposal merged')
    },
  })
}
```

### 4.2 useAtomProposals

**File:** `hooks/useAtomProposals.ts`

```typescript
export const useAtomProposals = (filters?: ProposalFilters) => {
  return useQuery({
    queryKey: ['atom-proposals', filters],
    queryFn: () => atomProposalService.list(filters),
    staleTime: 30000,
  })
}

export const useApproveAtomProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      atomProposalService.approve(id, { review_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atom-proposals'] })
      queryClient.invalidateQueries({ queryKey: ['atoms'] })
      toast.success('Atom proposal approved')
    },
  })
}

export const useRejectAtomProposal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      atomProposalService.reject(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atom-proposals'] })
      toast.success('Atom proposal rejected')
    },
  })
}
```

---

## 5. WebSocket Integration

### 5.1 Real-time Event Handling

**File:** `hooks/useProposalRealtimeUpdates.ts`

```typescript
export const useProposalRealtimeUpdates = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handlers = [
      websocketClient.subscribe('knowledge.proposal_created', (data) => {
        queryClient.invalidateQueries({ queryKey: ['topic-proposals'] })
        queryClient.invalidateQueries({ queryKey: ['atom-proposals'] })
        toast.info(`New ${data.proposal_type} proposal created`)
      }),

      websocketClient.subscribe('knowledge.proposal_approved', (data) => {
        queryClient.invalidateQueries({ queryKey: ['topic-proposals'] })
        queryClient.invalidateQueries({ queryKey: ['atom-proposals'] })
        toast.success(`${data.proposal_type} proposal approved`)
      }),

      websocketClient.subscribe('knowledge.proposal_rejected', (data) => {
        queryClient.invalidateQueries({ queryKey: ['topic-proposals'] })
        queryClient.invalidateQueries({ queryKey: ['atom-proposals'] })
      }),

      websocketClient.subscribe('knowledge.proposal_merged', (data) => {
        queryClient.invalidateQueries({ queryKey: ['topic-proposals'] })
        queryClient.invalidateQueries({ queryKey: ['atom-proposals'] })
        queryClient.invalidateQueries({ queryKey: ['topics'] })
        queryClient.invalidateQueries({ queryKey: ['atoms'] })
        toast.success('Proposals merged successfully')
      }),
    ]

    return () => handlers.forEach((unsubscribe) => unsubscribe())
  }, [queryClient])
}
```

**WebSocket Events:**
- `knowledge.proposal_created` - New proposal from extraction
- `knowledge.proposal_approved` - Proposal approved (creates final entity)
- `knowledge.proposal_rejected` - Proposal rejected
- `knowledge.proposal_merged` - Proposal merged with existing entity
- `knowledge.extraction_completed` - Batch extraction finished

---

## 6. API Services

### 6.1 TopicProposalService

**File:** `api/topicProposalService.ts`

```typescript
class TopicProposalService {
  async list(params?: ProposalFilters): Promise<ProposalListResponse<TopicProposal>> {
    const { data } = await apiClient.get('/api/v1/knowledge/topics/proposals', { params })
    return data
  }

  async get(id: string): Promise<TopicProposal> {
    const { data } = await apiClient.get(`/api/v1/knowledge/topics/proposals/${id}`)
    return data
  }

  async approve(id: string, request: ApproveProposalRequest): Promise<TopicProposal> {
    const { data } = await apiClient.post(`/api/v1/knowledge/topics/proposals/${id}/approve`, request)
    return data
  }

  async reject(id: string, request: RejectProposalRequest): Promise<TopicProposal> {
    const { data } = await apiClient.post(`/api/v1/knowledge/topics/proposals/${id}/reject`, request)
    return data
  }

  async merge(id: string, request: MergeProposalRequest): Promise<TopicProposal> {
    const { data } = await apiClient.post(`/api/v1/knowledge/topics/proposals/${id}/merge`, request)
    return data
  }

  async update(id: string, request: UpdateTopicProposalRequest): Promise<TopicProposal> {
    const { data } = await apiClient.patch(`/api/v1/knowledge/topics/proposals/${id}`, request)
    return data
  }

  async batchApprove(ids: string[]): Promise<{ approved: number }> {
    const { data } = await apiClient.post('/api/v1/knowledge/topics/proposals/batch/approve', { proposal_ids: ids })
    return data
  }
}

export const topicProposalService = new TopicProposalService()
```

### 6.2 AtomProposalService

**File:** `api/atomProposalService.ts`

```typescript
class AtomProposalService {
  async list(params?: ProposalFilters): Promise<ProposalListResponse<AtomProposal>> {
    const { data } = await apiClient.get('/api/v1/knowledge/atoms/proposals', { params })
    return data
  }

  async approve(id: string, request: ApproveProposalRequest): Promise<AtomProposal> {
    const { data } = await apiClient.post(`/api/v1/knowledge/atoms/proposals/${id}/approve`, request)
    return data
  }

  async reject(id: string, request: RejectProposalRequest): Promise<AtomProposal> {
    const { data } = await apiClient.post(`/api/v1/knowledge/atoms/proposals/${id}/reject`, request)
    return data
  }

  async merge(id: string, request: MergeProposalRequest): Promise<AtomProposal> {
    const { data } = await apiClient.post(`/api/v1/knowledge/atoms/proposals/${id}/merge`, request)
    return data
  }

  async batchApprove(ids: string[]): Promise<{ approved: number }> {
    const { data } = await apiClient.post('/api/v1/knowledge/atoms/proposals/batch/approve', { proposal_ids: ids })
    return data
  }
}

export const atomProposalService = new AtomProposalService()
```

---

## 7. Additional Components

### 7.1 ConfidenceFilter

```typescript
interface ConfidenceFilterProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export const ConfidenceFilter: React.FC<ConfidenceFilterProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Confidence Range</label>
      <Slider
        min={0}
        max={100}
        step={5}
        value={[value[0] * 100, value[1] * 100]}
        onValueChange={([min, max]) => onChange([min / 100, max / 100])}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{(value[0] * 100).toFixed(0)}%</span>
        <span>{(value[1] * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}
```

### 7.2 BulkActionToolbar

```typescript
interface BulkActionToolbarProps {
  selectedCount: number
  onBulkApprove: () => void
  onBulkReject: () => void
  onClearSelection: () => void
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onBulkApprove,
  onBulkReject,
  onClearSelection,
}) => {
  return (
    <div className="sticky top-0 z-10 bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedCount} proposal{selectedCount > 1 ? 's' : ''} selected
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={onBulkApprove}>
            Approve All
          </Button>
          <Button size="sm" variant="destructive" onClick={onBulkReject}>
            Reject All
          </Button>
          <Button size="sm" variant="outline" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## 8. Accessibility Requirements

All components must include:

- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<section>`)
- ARIA labels (`aria-label`, `aria-expanded`, `aria-describedby`)
- Keyboard navigation (Tab, Enter, Escape)
- Focus management (dialogs, modals)
- Screen reader support
- Color contrast WCAG 2.1 AA (4.5:1 for text)
- Loading states announced to screen readers
- Error messages associated with inputs

---

## 9. Mobile Responsiveness

Grid layouts:
- Mobile (< 768px): 1 column
- Tablet (768px - 1279px): 2 columns
- Desktop (≥ 1280px): 3 columns

Touch targets: Minimum 44x44px for interactive elements

---

## 10. State Management Summary

**TanStack Query:**
- Proposal lists (topics, atoms)
- Individual proposal details
- Similar entity lookups
- Extraction run history

**Local State (useState):**
- UI toggles (expanded reasoning, filters visible)
- Selection state (bulk actions)
- Dialog open/close states
- Form inputs

**WebSocket State:**
- Real-time proposal updates
- Extraction completion events
- Approval/rejection notifications

---

## 11. Implementation Checklist

- [ ] Create type definitions (`types/proposals.ts`)
- [ ] Implement API services (topic/atom proposal services)
- [ ] Build TanStack Query hooks
- [ ] Create ProposalReviewDashboard component
- [ ] Create TopicProposalCard component
- [ ] Create AtomProposalCard component
- [ ] Create MergeProposalDialog component
- [ ] Create VersionHistoryViewer component
- [ ] Add WebSocket integration
- [ ] Add confidence filtering UI
- [ ] Add bulk action toolbar
- [ ] Write component tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Verify accessibility (WCAG 2.1 AA)
- [ ] Test mobile responsiveness
- [ ] Update routing configuration
- [ ] Add to navigation menu

---

## 12. File Count & Size Estimates

**Total Files:** ~15
**Estimated Lines of Code:** ~2,500

Breakdown:
- Types: ~200 lines
- API Services: ~300 lines
- TanStack Query Hooks: ~400 lines
- ProposalReviewDashboard: ~250 lines
- TopicProposalCard: ~200 lines
- AtomProposalCard: ~200 lines
- MergeProposalDialog: ~300 lines
- VersionHistoryViewer: ~150 lines
- Supporting components: ~500 lines

---

**Document Status:** ✅ Complete Specification
**Ready for Implementation:** Yes
**Next Phase:** Implementation (Week 4-5 per roadmap)
