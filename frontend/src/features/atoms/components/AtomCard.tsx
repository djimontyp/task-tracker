import React from 'react'
import { Card } from '@/shared/ui'
import type { Atom, AtomType } from '../types'

interface AtomCardProps {
  atom: Atom
  onClick?: () => void
}

const atomTypeColors: Record<AtomType, string> = {
  problem: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  solution: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  decision: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  question: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  insight: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  pattern: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  requirement: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
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
      </div>
    </Card>
  )
}

export default AtomCard
