/**
 * DecisionsList Component
 *
 * T031: Displays decisions grouped by topics.
 */

import { CheckCircle, Clock, Folder } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type {
  TopicDecisions,
  ExecutiveSummaryAtom,
} from '@/features/executive-summary/types';

interface DecisionsListProps {
  decisionsByTopic: TopicDecisions[];
  uncategorizedDecisions: ExecutiveSummaryAtom[];
}

export function DecisionsList({
  decisionsByTopic,
  uncategorizedDecisions,
}: DecisionsListProps) {
  const totalDecisions =
    decisionsByTopic.reduce((sum, td) => sum + td.count, 0) +
    uncategorizedDecisions.length;

  if (totalDecisions === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle className="h-5 w-5 text-primary" />
          Рішення
          <Badge variant="default" className="ml-2">
            {totalDecisions}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Decisions by topic */}
        {decisionsByTopic.map((topicDecisions) => (
          <TopicDecisionsGroup
            key={topicDecisions.topic.id}
            topicDecisions={topicDecisions}
          />
        ))}

        {/* Uncategorized decisions */}
        {uncategorizedDecisions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Без топіку ({uncategorizedDecisions.length})
            </h4>
            <div className="space-y-2">
              {uncategorizedDecisions.map((decision) => (
                <DecisionItem key={decision.id} decision={decision} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TopicDecisionsGroupProps {
  topicDecisions: TopicDecisions;
}

function TopicDecisionsGroup({ topicDecisions }: TopicDecisionsGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { topic, decisions, count } = topicDecisions;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: topic.color || '#64748B' }}
          />
          <span className="font-medium text-sm">{topic.name}</span>
          <Badge variant="secondary" className="text-xs">
            {count}
          </Badge>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 pl-4">
        {decisions.map((decision) => (
          <DecisionItem key={decision.id} decision={decision} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface DecisionItemProps {
  decision: ExecutiveSummaryAtom;
}

function DecisionItem({ decision }: DecisionItemProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
            <h5 className="font-medium text-sm truncate">{decision.title}</h5>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {decision.content}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <Clock className="h-3 w-3" />
          {decision.days_old} дн.
        </div>
      </div>
    </div>
  );
}

export default DecisionsList;
