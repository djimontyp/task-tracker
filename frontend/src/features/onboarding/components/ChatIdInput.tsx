import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import { cn } from '@/shared/lib';

/**
 * Parse Telegram group ID from URL or direct input.
 *
 * Supports:
 * - web.telegram.org/k/#-2531774047
 * - t.me/c/2531774047
 * - Direct number: -1002531774047
 */
function parseGroupInput(input: string): number | null {
  const cleaned = input.trim();

  // Match web.telegram.org URLs with # fragment
  // Example: https://web.telegram.org/k/#-2531774047
  const webMatch = cleaned.match(/#(-?\d+)$/);
  if (webMatch) {
    return parseInt(webMatch[1], 10);
  }

  // Match t.me/c/ID format
  // Example: https://t.me/c/2531774047/123
  const tmeMatch = cleaned.match(/t\.me\/c\/(\d+)/);
  if (tmeMatch) {
    // t.me/c/ format uses positive IDs, convert to negative
    return -parseInt(tmeMatch[1], 10);
  }

  // Direct number input
  const directNumber = parseInt(cleaned, 10);
  if (!isNaN(directNumber)) {
    return directNumber;
  }

  return null;
}

/**
 * Convert short group ID to long format (-100 prefix).
 * Telegram supergroups use -100XXXXXXXXX format.
 */
function convertToLongFormat(groupId: number): number {
  // Already in long format
  if (groupId < 0 && groupId.toString().startsWith('-100')) {
    return groupId;
  }

  // Convert -123 to -100123
  if (groupId < 0) {
    return parseInt(`-100${Math.abs(groupId)}`, 10);
  }

  // Positive ID (channel) - add -100 prefix
  if (groupId > 0) {
    return parseInt(`-100${groupId}`, 10);
  }

  return groupId;
}

/**
 * Validate group ID input.
 */
function isValidGroupId(input: string): boolean {
  const parsed = parseGroupInput(input);
  // Group IDs are negative, or positive for channel IDs from URLs
  return parsed !== null && parsed !== 0;
}

export interface ChatIdInputProps {
  /** List of added chat IDs */
  chatIds: string[];
  /** Callback when a new chat ID is added */
  onAdd: (chatId: string) => void;
  /** Callback when a chat ID is removed */
  onRemove: (chatId: string) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

type ValidationState = 'idle' | 'valid' | 'invalid';

/**
 * Input component for adding Telegram chat IDs.
 *
 * Features:
 * - Real-time validation (green/red border)
 * - Parses Telegram URLs (web.telegram.org, t.me)
 * - Converts to long format (-100XXXXXXXXX)
 * - Shows added IDs as removable chips
 * - Enter key support
 *
 * @example
 * <ChatIdInput
 *   chatIds={['-1002531774047']}
 *   onAdd={(id) => setChatIds([...chatIds, id])}
 *   onRemove={(id) => setChatIds(chatIds.filter(c => c !== id))}
 * />
 */
export function ChatIdInput({
  chatIds,
  onAdd,
  onRemove,
  disabled = false,
  className,
}: ChatIdInputProps) {
  const { t } = useTranslation('onboarding');
  const [input, setInput] = useState('');
  const [validation, setValidation] = useState<ValidationState>('idle');

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (!value.trim()) {
      setValidation('idle');
    } else {
      setValidation(isValidGroupId(value) ? 'valid' : 'invalid');
    }
  }, []);

  const handleAdd = useCallback(() => {
    if (!isValidGroupId(input)) return;

    const parsed = parseGroupInput(input);
    if (parsed === null) return;

    const longFormat = convertToLongFormat(parsed);
    const chatIdStr = String(longFormat);

    // Prevent duplicates
    if (chatIds.includes(chatIdStr)) {
      setInput('');
      setValidation('idle');
      return;
    }

    onAdd(chatIdStr);
    setInput('');
    setValidation('idle');
  }, [input, chatIds, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd]
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="chat-id-input">{t('import.chatId.label')}</Label>
        <div className="flex gap-2">
          <Input
            id="chat-id-input"
            placeholder={t('import.chatId.placeholder')}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'flex-1',
              validation === 'valid' && 'border-semantic-success focus-visible:ring-semantic-success',
              validation === 'invalid' && 'border-semantic-error focus-visible:ring-semantic-error'
            )}
            aria-describedby="chat-id-help"
          />
          <Button
            type="button"
            onClick={handleAdd}
            disabled={disabled || validation !== 'valid'}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label={t('import.chatId.addButton')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p id="chat-id-help" className="text-sm text-muted-foreground">
          {t('import.chatId.help')}
        </p>
      </div>

      {/* Chip list */}
      {chatIds.length > 0 && (
        <div className="flex flex-wrap gap-2" role="list" aria-label={t('import.chatId.listLabel')}>
          {chatIds.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 pr-1 text-sm"
            >
              <span className="font-mono">{id}</span>
              <button
                type="button"
                onClick={() => onRemove(id)}
                disabled={disabled}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 hover:text-destructive focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={t('import.chatId.removeButton', { id })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
