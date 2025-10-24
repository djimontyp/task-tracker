import type { VersionChange } from '../types';

export function formatDiffChanges(changes: VersionChange[]): {
  added: string[];
  removed: string[];
  modified: Array<{ field: string; oldValue: string; newValue: string }>;
} {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: Array<{ field: string; oldValue: string; newValue: string }> = [];

  changes.forEach((change) => {
    const field = change.path.replace(/root\['(.+?)'\]/g, '$1');

    if (change.type === 'values_changed') {
      modified.push({
        field,
        oldValue: formatValue(change.old_value),
        newValue: formatValue(change.new_value),
      });
    } else if (change.type === 'dictionary_item_added') {
      added.push(`${field}: ${formatValue(change.new_value)}`);
    } else if (change.type === 'dictionary_item_removed') {
      removed.push(`${field}: ${formatValue(change.old_value)}`);
    }
  });

  return { added, removed, modified };
}

function formatValue(value: any): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return JSON.stringify(value, null, 2);
}

export function extractFieldName(path: string): string {
  return path.replace(/root\['(.+?)'\]/g, '$1');
}
