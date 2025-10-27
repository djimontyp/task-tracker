import { useQuery } from '@tanstack/react-query'
import { Spinner, Card, Badge, Button } from '@/shared/ui'
import { versioningService } from '@/features/knowledge/api/versioningService'
import { CheckCircleIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const VersionsPage = () => {
  const navigate = useNavigate()

  const { data: pendingCount, isLoading } = useQuery({
    queryKey: ['pending-versions-count'],
    queryFn: () => versioningService.getPendingVersionsCount(),
    refetchInterval: 10000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Version Management</h1>
          <p className="text-muted-foreground">
            Review and approve pending knowledge versions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{pendingCount?.count ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Topic Versions</p>
              <p className="text-2xl font-bold">{pendingCount?.topics ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Atom Versions</p>
              <p className="text-2xl font-bold">{pendingCount?.atoms ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pending Versions</h2>
          <Badge variant="outline">
            {pendingCount?.count ?? 0} pending
          </Badge>
        </div>

        {pendingCount && pendingCount.count > 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              Navigate to Topics page to review and approve pending versions
            </p>
            <Button onClick={() => navigate('/topics')} className="gap-2">
              Go to Topics
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">No pending versions to review</p>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-muted/50">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          About Versioning
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Draft Versions:</strong> Changes proposed by AI that need review
          </p>
          <p>
            <strong className="text-foreground">Approved Versions:</strong> Changes that have been reviewed and applied
          </p>
          <p>
            <strong className="text-foreground">Rejected Versions:</strong> Changes that were reviewed but not applied
          </p>
        </div>
      </Card>
    </div>
  )
}

export default VersionsPage
