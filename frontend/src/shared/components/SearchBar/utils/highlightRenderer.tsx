/**
 * Safely render HTML snippets with highlighted matches.
 *
 * Backend returns snippets with <mark> tags for highlights.
 * This component sanitizes and renders them safely.
 */

/**
 * Sanitize HTML snippet to only allow <mark> tags.
 * Removes all other HTML tags and entities.
 */
function sanitizeHighlightSnippet(html: string): string {
  // First, decode HTML entities
  const decoded = html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Extract text and mark positions
  const parts: { text: string; isHighlight: boolean }[] = []
  let match

  // Match <mark>...</mark> patterns
  const markRegex = /<mark>(.*?)<\/mark>/gi

  let lastIndex = 0
  while ((match = markRegex.exec(decoded)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = decoded.slice(lastIndex, match.index)
      // Strip any other HTML tags from non-highlighted text
      const cleanText = beforeText.replace(/<[^>]*>/g, '')
      if (cleanText) {
        parts.push({ text: cleanText, isHighlight: false })
      }
    }

    // Add the highlighted text (content inside <mark>)
    parts.push({ text: match[1], isHighlight: true })
    lastIndex = markRegex.lastIndex
  }

  // Add remaining text after last match
  if (lastIndex < decoded.length) {
    const afterText = decoded.slice(lastIndex)
    const cleanText = afterText.replace(/<[^>]*>/g, '')
    if (cleanText) {
      parts.push({ text: cleanText, isHighlight: false })
    }
  }

  // If no marks found, just strip all HTML
  if (parts.length === 0) {
    return decoded.replace(/<[^>]*>/g, '')
  }

  // Reconstruct safe HTML with only <mark> tags
  return parts
    .map((part) => (part.isHighlight ? `<mark>${escapeHtml(part.text)}</mark>` : escapeHtml(part.text)))
    .join('')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface HighlightedTextProps {
  html: string
  className?: string
}

/**
 * Component to safely render highlighted search snippets.
 */
export function HighlightedText({ html, className }: HighlightedTextProps) {
  const sanitized = sanitizeHighlightSnippet(html)

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
