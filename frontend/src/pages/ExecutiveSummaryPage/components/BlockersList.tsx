/**
 * BlockersList Component
 *
 * T030: Displays blockers with stale highlighting.
 * Stale blockers (>14 days) are visually emphasized.
 */

import { AlertTriangle, AlertCircle, Clock, Folder } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import type { ExecutiveSummaryAtom } from '@/features/executive-summary/types';

interface BlockersListProps {
  blockers: ExecutiveSummaryAtom[];
}

export function BlockersList({ blockers }: BlockersListProps) {
  if (blockers.length === 0) {
    return null;
  }

  const staleBlockers = blockers.filter((b) => b.is_stale);
  const recentBlockers = blockers.filter((b) => !b.is_stale);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Блокери
          <Badge variant="destructive" className="ml-2">
            {blockers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stale blockers first - critical */}
        {staleBlockers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Потребують негайної уваги ({staleBlockers.length})
            </h4>
            <div className="space-y-2">
              {staleBlockers.map((blocker) => (
                <BlockerItem key={blocker.id} blocker={blocker} isStale />
              ))}
            </div>
          </div>
        )}

        {/* Recent blockers */}
        {recentBlockers.length > 0 && (
          <div className="space-y-2">
            {staleBlockers.length > 0 && (
              <h4 className="text-sm font-medium text-muted-foreground">
                Активні блокери ({recentBlockers.length})
              </h4>
            )}
            <div className="space-y-2">
              {recentBlockers.map((blocker) => (
                <BlockerItem key={blocker.id} blocker={blocker} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BlockerItemProps {
  blocker: ExecutiveSummaryAtom;
  isStale?: boolean;
}

function BlockerItem({ blocker, isStale = false }: BlockerItemProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isStale
          ? 'border-destructive/50 bg-destructive/5'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle
              className={`h-4 w-4 flex-shrink-0 ${
                isStale ? 'text-destructive' : 'text-semantic-warning'
              }`}
            />
            <h5 className="font-medium text-sm truncate">{blocker.title}</h5>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {blocker.content}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isStale && (
            <Badge variant="destructive" className="gap-2">
              <AlertTriangle className="h-3 w-3" />
              Критично
            </Badge>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {blocker.days_old} дн.
          </div>
        </div>
      </div>
      {blocker.topic && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Folder className="h-3 w-3" />
          {blocker.topic.name}
        </div>
      )}
    </div>
  );
}

export default BlockersList;
