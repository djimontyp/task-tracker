/**
 * TEST FILE: Intentional Design System violations
 * This file should be BLOCKED by pre-commit hook
 */

import { Badge } from '@/shared/ui/badge';

export function TestViolations() {
  return (
    <div>
      {/* ❌ VIOLATION 1: Raw color (should trigger ESLint error) */}
      <Badge className="bg-green-500 text-green-700">
        Bad Badge
      </Badge>

      {/* ❌ VIOLATION 2: Non-4px spacing (should trigger ESLint error) */}
      <div className="gap-3 p-5">
        Bad Spacing
      </div>

      {/* ❌ VIOLATION 3: Another raw color */}
      <span className="text-red-600 border-blue-500">
        More violations
      </span>
    </div>
  );
}
