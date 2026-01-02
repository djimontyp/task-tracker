/**
 * Syntax highlighting utility for JSON strings
 * Converts JSON to HTML with Tailwind CSS classes for coloring
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Applies syntax highlighting to a formatted JSON string
 * Returns HTML string with Tailwind CSS classes
 */
export function highlightJson(jsonString: string): string {
  // Escape HTML first for security
  const escaped = escapeHtml(jsonString)

  // Apply syntax highlighting with regex replacements
  let highlighted = escaped

  // Highlight strings (green)
  highlighted = highlighted.replace(
    /("(?:[^"\\]|\\.)*")/g,
    '<span class="text-semantic-success">$1</span>'
  )

  // Highlight numbers (orange/blue from chart colors)
  highlighted = highlighted.replace(
    /\b(-?\d+\.?\d*)\b/g,
    '<span class="text-chart-1">$1</span>'
  )

  // Highlight booleans (purple from chart colors)
  highlighted = highlighted.replace(
    /\b(true|false)\b/g,
    '<span class="text-chart-2">$1</span>'
  )

  // Highlight null (muted gray)
  highlighted = highlighted.replace(
    /\bnull\b/g,
    '<span class="text-muted-foreground">$1</span>'
  )

  // Highlight object keys (primary blue)
  // This needs to be done carefully to not affect strings
  highlighted = highlighted.replace(
    /(<span class="text-semantic-success">"[^"]*"<\/span>)(\s*:)/g,
    '<span class="text-primary">$1</span>$2'
  )

  return highlighted
}

/**
 * Attempts to parse and format JSON string
 * Returns formatted JSON if valid, or null if invalid
 */
export function tryFormatJson(
  response: string
): { formatted: string; isValid: true } | { isValid: false; error: string } {
  try {
    const parsed = JSON.parse(response)
    const formatted = JSON.stringify(parsed, null, 2)
    return { formatted, isValid: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
    return { isValid: false, error: errorMessage }
  }
}
