import React, { useState, useEffect } from 'react'
import { Card, Badge, Button } from '@/shared/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { ClockIcon } from '@heroicons/react/24/outline'
import { versioningService } from '@/features/knowledge/api/versioningService'
import { useWebSocket } from '@/features/websocket/hooks/useWebSocket'
import { VersionHistoryList } from '@/features/knowledge/components/VersionHistoryList'
import type { Atom, AtomType } from '../types'

interface AtomCardProps {
  atom: Atom
  onClick?: () => void
}

const atomTypeColors: Record<AtomType, string> = {
  problem: 'badge-error',
  solution: 'badge-success',
  decision: 'badge-info',
  question: 'badge-warning',
  insight: 'badge-purple',
  pattern: 'badge-purple',
  requirement: 'badge-info',
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

  useEffect(() => {
    loadPendingVersions()
  }, [atom.id])

  const loadPendingVersions = async () => {
    try {
      const versions = await versioningService.getAtomVersions(atom.id)
      const pendingCount = versions.filter((v) => !v.approved).length
      setPendingVersionsCount(pendingCount)
    } catch (error) {
      console.error('Failed to load atom versions:', error)
    }
  }

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

  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${atomTypeColors[atom.type]}`}>
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
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
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
            <Badge className="text-xs bg-amber-500 text-white hover:bg-amber-600">
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
              <ClockIcon className="h-3 w-3 mr-1" />
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
            onSelectVersion={(version) => {
              console.log('Selected version:', version)
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default AtomCard
