/**
 * AgentCard - Refactored version using new card layout patterns
 *
 * This file demonstrates how to refactor AgentCard using:
 * - CardHeaderWithActions (dropdown layout)
 * - DataList (semantic key-value display)
 * - TruncatedText (auto-tooltip on overflow)
 *
 * Migration benefits:
 * - Title visible in full (tooltip on hover)
 * - 5 actions collapsed to dropdown menu
 * - Better visual hierarchy
 * - Responsive layout
 * - Full accessibility
 *
 * To use: Replace AgentCard.tsx content with this file
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  Badge,
  Spinner,
  CardHeaderWithActions,
  TruncatedText,
} from '@/shared/ui';
import { DataList } from '@/shared/patterns';
import { cn } from '@/shared/lib';
import { AgentConfig } from '@/features/agents/types';
import {
  Pencil,
  Trash2,
  Settings,
  TestTube2,
  Copy,
  AlertCircle,
  RefreshCw,
  Bot,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface AgentCardProps {
  agent: AgentConfig;
  className?: string;
  onEdit: (agent: AgentConfig) => void;
  onCopy: (agent: AgentConfig) => void;
  onDelete: (id: string) => void;
  onManageTasks: (agent: AgentConfig) => void;
  onTest: (agent: AgentConfig) => void;
  isDeleting?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error;
  onRetry?: () => void;
}

const AgentCardRefactored = React.forwardRef<HTMLDivElement, AgentCardProps>(
  (
    {
      agent,
      className,
      onEdit,
      onCopy,
      onDelete,
      onManageTasks,
      onTest,
      isDeleting = false,
      isLoading = false,
      isError = false,
      error,
      onRetry,
    },
    ref
  ) => {
    const { t } = useTranslation('agents');

    // Error state
    if (isError) {
      return (
        <Card ref={ref}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {t('card.error.title', 'Failed to load')}
                </p>
                {error && (
                  <p className="text-xs text-muted-foreground">{error.message}</p>
                )}
              </div>
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('card.error.retry', 'Retry')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <Card ref={ref}>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      );
    }

    // Build data items for DataList
    const dataItems = [
      {
        label: t('card.fields.model', 'Model'),
        value: <code className="text-xs font-mono">{agent.model_name}</code>,
      },
    ];

    if (agent.temperature !== undefined) {
      dataItems.push({
        label: t('card.fields.temperature', 'Temperature'),
        value: <span>{agent.temperature.toString()}</span>,
      });
    }

    if (agent.max_tokens !== undefined) {
      dataItems.push({
        label: t('card.fields.maxTokens', 'Max Tokens'),
        value: <span>{agent.max_tokens.toString()}</span>,
      });
    }

    return (
      <Card ref={ref} className={cn('card-interactive', className)}>
        <CardHeaderWithActions
          title={agent.name}
          description={agent.description}
          layout="dropdown"
          icon={<Bot className="h-5 w-5 text-primary" />}
          badge={
            <Badge variant={agent.is_active ? 'default' : 'secondary'}>
              {agent.is_active ? t('status.active') : t('status.inactive')}
            </Badge>
          }
          dropdownActions={[
            {
              label: t('card.actions.edit', 'Edit'),
              icon: Pencil,
              onClick: () => onEdit(agent),
            },
            {
              label: t('card.actions.copy', 'Duplicate'),
              icon: Copy,
              onClick: () => onCopy(agent),
            },
            {
              label: t('card.actions.manageTasks', 'Manage Tasks'),
              icon: Settings,
              onClick: () => onManageTasks(agent),
            },
            {
              label: t('card.actions.test', 'Test Agent'),
              icon: TestTube2,
              onClick: () => onTest(agent),
            },
            {
              label: t('card.actions.delete', 'Delete'),
              icon: Trash2,
              onClick: () => onDelete(agent.id),
              variant: 'destructive',
              disabled: isDeleting,
              separatorBefore: true,
            },
          ]}
          dropdownLabel={t('card.actions.more', 'Agent actions')}
        />

        <CardContent>
          {/* Configuration data */}
          <DataList
            density="compact"
            columns={2}
            items={dataItems}
          />

          {/* System prompt preview */}
          {agent.system_prompt && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {t('card.fields.systemPrompt', 'System Prompt')}
              </p>
              <TruncatedText
                text={agent.system_prompt}
                lines={2}
                className="text-sm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

AgentCardRefactored.displayName = 'AgentCardRefactored';

export { AgentCardRefactored };
