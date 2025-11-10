import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components'
import { Input, Button, Badge, Spinner } from '@/shared/ui'
import { Card } from '@/shared/components'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Dialog, DialogContent } from '@/shared/ui/dialog'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { topicService } from '@/features/topics/api/topicService'
import { versioningService } from '@/features/knowledge/api/versioningService'
import { BulkVersionActions } from '@/features/knowledge/components/BulkVersionActions'
import { VersionDiffViewer } from '@/features/knowledge/components/VersionDiffViewer'
import type { TopicVersion, AtomVersion } from '@/features/knowledge/types'
import { toast } from 'sonner'

type EntityType = 'all' | 'topic' | 'atom'
type VersionStatus = 'pending' | 'approved' | 'rejected'

type UnifiedVersion = {
  id: number
  entityId: string | number
  entityType: 'topic' | 'atom'
  entityName: string
  version: number
  status: VersionStatus
  createdAt: string
  confidence: number
  data: TopicVersion | AtomVersion
}

const VersionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [entityType, setEntityType] = useState<EntityType>(() =>
    (searchParams.get('entity_type') as EntityType) || 'all'
  )
  const [statusFilter, setStatusFilter] = useState<VersionStatus>(() =>
    (searchParams.get('status') as VersionStatus) || 'pending'
  )
  const [selectedVersions, setSelectedVersions] = useState<UnifiedVersion[]>([])
  const [dialogVersion, setDialogVersion] = useState<UnifiedVersion | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (statusFilter !== 'pending') params.status = statusFilter
    if (entityType !== 'all') params.entity_type = entityType
    setSearchParams(params)
  }, [statusFilter, entityType, setSearchParams])

  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['topics', { page: 1 }],
    queryFn: () => topicService.listTopics({ page: 1, page_size: 1000 }),
    staleTime: 1000 * 60 * 5,
  })

  const topicIds = useMemo(() =>
    topicsData?.items?.map(t => t.id) || [],
    [topicsData]
  )

  const { data: topicVersionsData, isLoading: topicVersionsLoading } = useQuery({
    queryKey: ['topic-versions', topicIds],
    queryFn: async () => {
      if (!topicIds.length) return []
      const results = await Promise.allSettled(
        topicIds.map(id => versioningService.getTopicVersions(String(id)))
      )
      return results
        .filter((r): r is PromiseFulfilledResult<TopicVersion[]> => r.status === 'fulfilled')
        .flatMap(r => r.value)
    },
    enabled: topicIds.length > 0,
    staleTime: 1000 * 60 * 2,
  })

  const unifiedVersions = useMemo<UnifiedVersion[]>(() => {
    if (!topicVersionsData || !topicsData?.items) return []

    const topicsMap = new Map(topicsData.items.map(t => [String(t.id), t]))

    return topicVersionsData
      .map((v): UnifiedVersion | null => {
        const topic = topicsMap.get(String(v.topic_id))
        if (!topic) return null

        const status: VersionStatus = v.approved
          ? 'approved'
          : v.approved === false
            ? 'rejected'
            : 'pending'

        return {
          id: v.id,
          entityId: String(v.topic_id),
          entityType: 'topic',
          entityName: topic.name,
          version: v.version,
          status,
          createdAt: v.created_at,
          confidence: v.data.confidence,
          data: v,
        }
      })
      .filter((v): v is UnifiedVersion => v !== null)
  }, [topicVersionsData, topicsData])

  const filteredVersions = useMemo(() => {
    return unifiedVersions.filter(v => {
      if (statusFilter && v.status !== statusFilter) return false
      if (entityType !== 'all' && v.entityType !== entityType) return false
      if (debouncedSearch && !v.entityName.toLowerCase().includes(debouncedSearch.toLowerCase())) {
        return false
      }
      return true
    })
  }, [unifiedVersions, statusFilter, entityType, debouncedSearch])

  const isLoading = topicsLoading || topicVersionsLoading

  const handleSelectVersion = (version: UnifiedVersion, checked: boolean) => {
    setSelectedVersions(prev =>
      checked
        ? [...prev, version]
        : prev.filter(v => v.id !== version.id)
    )
  }

  const handleSelectAll = () => {
    if (selectedVersions.length === filteredVersions.length) {
      setSelectedVersions([])
    } else {
      setSelectedVersions([...filteredVersions])
    }
  }

  const handleBulkActionComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['topic-versions'] })
    queryClient.invalidateQueries({ queryKey: ['pending-versions-count'] })
    setSelectedVersions([])
  }

  const handleCardClick = (version: UnifiedVersion) => {
    setDialogVersion(version)
  }

  const getStatusBadge = (status: VersionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>
    }
  }

  return (
    <>
      <PageHeader
        title="Version Management"
        description="Review and approve pending knowledge versions"
      />

      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by entity name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {statusFilter === 'pending' && selectedVersions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedVersions.length === filteredVersions.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        <Tabs value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="topic">Topics</TabsTrigger>
            <TabsTrigger value="atom">Atoms</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as VersionStatus)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {statusFilter === 'pending' && selectedVersions.length > 0 && (
          <BulkVersionActions
            selectedVersions={selectedVersions.map(v => v.data) as (TopicVersion | AtomVersion)[]}
            entityType={selectedVersions[0]?.entityType || 'topic'}
            onActionComplete={handleBulkActionComplete}
            onClearSelection={() => setSelectedVersions([])}
          />
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredVersions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 space-y-2">
              {statusFilter === 'pending' ? (
                <>
                  <p className="text-lg font-semibold">No pending versions</p>
                  <p>All caught up! 🎉</p>
                </>
              ) : (
                <p className="text-lg">No {statusFilter} versions found</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredVersions.map((version) => (
              <Card
                key={`${version.entityType}-${version.id}`}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(version)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    {statusFilter === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedVersions.some(v => v.id === version.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectVersion(version, e.target.checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{version.entityName}</h3>
                      <p className="text-xs text-gray-500">Version {version.version}</p>
                    </div>
                    {getStatusBadge(version.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Confidence: {Math.round(version.confidence * 100)}%</span>
                    <span className="capitalize">{version.entityType}</span>
                  </div>

                  <div className="text-xs text-gray-400">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {dialogVersion && (
        <Dialog open={!!dialogVersion} onOpenChange={() => setDialogVersion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <VersionDiffViewer
              entityType={dialogVersion.entityType}
              entityId={dialogVersion.entityId}
              version={dialogVersion.version}
              compareToVersion={dialogVersion.version - 1}
              onApprove={async () => {
                try {
                  if (dialogVersion.entityType === 'topic') {
                    await versioningService.approveTopicVersion(
                      dialogVersion.entityId as string,
                      dialogVersion.version
                    )
                  }
                  toast.success('Version approved')
                  queryClient.invalidateQueries({ queryKey: ['topic-versions'] })
                  queryClient.invalidateQueries({ queryKey: ['pending-versions-count'] })
                  setDialogVersion(null)
                } catch (error) {
                  toast.error('Failed to approve version')
                }
              }}
              onReject={async () => {
                try {
                  if (dialogVersion.entityType === 'topic') {
                    await versioningService.rejectTopicVersion(
                      dialogVersion.entityId as string,
                      dialogVersion.version
                    )
                  }
                  toast.success('Version rejected')
                  queryClient.invalidateQueries({ queryKey: ['topic-versions'] })
                  queryClient.invalidateQueries({ queryKey: ['pending-versions-count'] })
                  setDialogVersion(null)
                } catch (error) {
                  toast.error('Failed to reject version')
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default VersionsPage
