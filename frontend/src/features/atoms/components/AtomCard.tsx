import React, { useState, useEffect } from 'react'
import { Card, Badge, Button } from '@/shared/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Clock } from 'lucide-react'
import { versioningService } from '@/features/knowledge/api/versioningService'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'
import { VersionHistoryList } from '@/features/knowledge/components/VersionHistoryList'
import type { Atom, AtomType } from '../types'

interface AtomCardProps {
  atom: Atom
  onClick?: () => void
}

const atomTypeColors: Record<AtomType, string> = {
  problem: 'bg-[hsl(var(--atom-problem))] text-white',
  solution: 'bg-[hsl(var(--atom-solution))] text-white',
  decision: 'bg-[hsl(var(--atom-decision))] text-white',
  question: 'bg-[hsl(var(--atom-question))] text-white',
  insight: 'bg-[hsl(var(--atom-insight))] text-white',
  pattern: 'bg-[hsl(var(--atom-pattern))] text-white',
  requirement: 'bg-[hsl(var(--atom-requirement))] text-white',
}

const atomTypeLabels: Record<AtomType, string> = {
  problem: 'Problem',
  solution: 'Solution',
  decision: 'Decision',
  question: 'Question',
  insight: 'Insight',
  pattern: 'Pattern',
  requirement: 'Requirement',
}

const AtomCard: React.FC<AtomCardProps> = ({ atom, onClick }) => {
  const [pendingVersionsCount, setPendingVersionsCount] = useState(0)
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  const loadPendingVersions = React.useCallback(async () => {
    try {
      const versions = await versioningService.getAtomVersions(atom.id)
      const pendingCount = versions.filter((v) => !v.approved).length
      setPendingVersionsCount(pendingCount)
    } catch {
      // Silently handle error - versions may not be available
    }
  }, [atom.id])

  useEffect(() => {
    loadPendingVersions()
  }, [loadPendingVersions])

  useWebSocket({
    topics: ['knowledge'],
    onMessage: (data: unknown) => {
      const event = data as { type?: string; data?: { entity_type?: string; entity_id?: number } }

      if (
        event.type === 'knowledge.version_created' &&
        event.data?.entity_type === 'atom' &&
        event.data?.entity_id === atom.id
      ) {
        setPendingVersionsCount((prev) => prev + 1)
      }
    },
  })

  const isFeatured = atom.confidence !== null && atom.confidence > 0.8
  // Featured atoms: always glow + stronger on hover
  // Regular atoms: glow only on hover
  const glowClass = isFeatured
    ? 'shadow-glow-sm hover:shadow-glow-hover'
    : 'hover:shadow-glow-sm'

  return (
    <Card
      className={`p-4 transition-all duration-300 ${glowClass} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-xs font-semibold px-2 py-2 rounded-full ${atomTypeColors[atom.type]}`}>
            {atomTypeLabels[atom.type]}
          </span>
          {atom.confidence !== null && (
            <span className="text-xs text-muted-foreground">
              {Math.round(atom.confidence * 100)}%
            </span>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-base mb-2 line-clamp-2">{atom.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">{atom.content}</p>
        </div>

        {atom.user_approved && (
          <div className="flex items-center gap-2 text-semantic-success">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">Approved</span>
          </div>
        )}

        {pendingVersionsCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Badge className="text-xs bg-semantic-warning text-white hover:bg-semantic-warning/90">
              {pendingVersionsCount} pending version{pendingVersionsCount > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                setShowVersionHistory(true)
              }}
              aria-label="View version history"
            >
              <Clock className="h-3 w-3 mr-2" />
              View History
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History - {atom.title}</DialogTitle>
          </DialogHeader>
          <VersionHistoryList
            entityType="atom"
            entityId={atom.id}
            enableBulkActions={true}
            onSelectVersion={(_version) => {
              // Version selected - implementation pending
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default AtomCard
