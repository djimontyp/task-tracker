/**
 * Hardware Alias Utility
 *
 * Converts technical GPU/hardware names to user-friendly aliases.
 * Example: "4070 ti" -> "Local GPU"
 */

/**
 * GPU model patterns that indicate local hardware.
 * Matches common NVIDIA and AMD GPU naming conventions.
 */
const GPU_PATTERNS = [
  /\b\d{4}\s*(?:ti|super)?\b/i, // 4070 ti, 3090 super, etc.
  /\brtx\s*\d{4}/i, // RTX 4090, RTX 3080
  /\bgtx\s*\d{4}/i, // GTX 1080, GTX 1660
  /\brx\s*\d{4}/i, // RX 6800, RX 7900
  /\bradeon/i, // Radeon
  /\bgeforce/i, // GeForce
  /\bnvidia/i, // NVIDIA
  /\bamd\s*gpu/i, // AMD GPU
  /\bcuda/i, // CUDA
];

export interface HardwareAliasResult {
  /** Display name (friendly alias or original) */
  displayName: string;
  /** Original technical name (for tooltip) */
  technicalName: string;
  /** Whether the name was transformed */
  isAlias: boolean;
}

/**
 * Detects if a name contains GPU/hardware identifiers.
 *
 * @param name - Provider or hardware name to check
 * @returns true if name appears to be a GPU/hardware identifier
 */
export function isGpuName(name: string): boolean {
  return GPU_PATTERNS.some((pattern) => pattern.test(name));
}

/**
 * Converts technical GPU names to user-friendly aliases.
 *
 * @param name - Provider or hardware name
 * @param alias - Custom alias to use (default: "Local GPU")
 * @returns Object with displayName, technicalName, and isAlias flag
 *
 * @example
 * getHardwareAlias("4070 tis")
 * // { displayName: "Local GPU", technicalName: "4070 tis", isAlias: true }
 *
 * @example
 * getHardwareAlias("OpenAI Production")
 * // { displayName: "OpenAI Production", technicalName: "OpenAI Production", isAlias: false }
 */
export function getHardwareAlias(
  name: string,
  alias: string = 'Local GPU'
): HardwareAliasResult {
  const trimmedName = name.trim();

  if (isGpuName(trimmedName)) {
    return {
      displayName: alias,
      technicalName: trimmedName,
      isAlias: true,
    };
  }

  return {
    displayName: trimmedName,
    technicalName: trimmedName,
    isAlias: false,
  };
}
