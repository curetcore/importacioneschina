/**
 * Mention parsing and utilities
 */

export interface MentionMatch {
  userId: string
  username: string
  displayName: string
  startIndex: number
  endIndex: number
}

/**
 * Detects @mentions in text
 * Format: @[userId:displayName]
 * Example: "@[clw123:Juan Perez]"
 */
export function parseMentions(text: string): MentionMatch[] {
  const mentionRegex = /@\[([^:]+):([^\]]+)\]/g
  const mentions: MentionMatch[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      userId: match[1],
      username: match[2].toLowerCase().replace(/\s+/g, "."),
      displayName: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return mentions
}

/**
 * Extracts unique user IDs from mentions in text
 */
export function extractMentionedUserIds(text: string): string[] {
  const mentions = parseMentions(text)
  const uniqueIds = Array.from(new Set(mentions.map(m => m.userId)))
  return uniqueIds
}

/**
 * Converts mention tags to readable format for display
 * @[userId:Name] -> @Name
 */
export function convertMentionsToDisplay(text: string): string {
  return text.replace(/@\[([^:]+):([^\]]+)\]/g, "@$2")
}

/**
 * Converts mention tags to HTML links for rendering
 * @[userId:Name] -> <span class="mention">@Name</span>
 */
export function convertMentionsToHTML(text: string): string {
  return text.replace(
    /@\[([^:]+):([^\]]+)\]/g,
    '<span class="mention text-blue-600 font-medium hover:underline cursor-pointer" data-user-id="$1">@$2</span>'
  )
}

/**
 * Creates a mention tag from user data
 */
export function createMentionTag(userId: string, displayName: string): string {
  return `@[${userId}:${displayName}]`
}

/**
 * Replaces @username with mention tag
 * Used when user selects from autocomplete
 */
export function insertMention(
  text: string,
  cursorPosition: number,
  userId: string,
  displayName: string
): { newText: string; newCursorPosition: number } {
  // Find the start of the @ mention
  let mentionStart = cursorPosition
  while (mentionStart > 0 && text[mentionStart - 1] !== "@") {
    mentionStart--
  }

  if (mentionStart === 0 || text[mentionStart - 1] !== "@") {
    // No @ found, just insert mention at cursor
    const mentionTag = createMentionTag(userId, displayName)
    const newText = text.slice(0, cursorPosition) + mentionTag + " " + text.slice(cursorPosition)
    return {
      newText,
      newCursorPosition: cursorPosition + mentionTag.length + 1,
    }
  }

  // Replace from @ to cursor with mention tag
  const mentionTag = createMentionTag(userId, displayName)
  const before = text.slice(0, mentionStart - 1)
  const after = text.slice(cursorPosition)
  const newText = before + mentionTag + " " + after

  return {
    newText,
    newCursorPosition: before.length + mentionTag.length + 1,
  }
}

/**
 * Checks if cursor is in a mention context (after @)
 * Returns the query string if in mention context, null otherwise
 */
export function getMentionQuery(text: string, cursorPosition: number): string | null {
  // Look back from cursor to find @
  let i = cursorPosition - 1
  let query = ""

  while (i >= 0) {
    const char = text[i]

    // If we hit whitespace or newline before @, not a mention
    if (char === " " || char === "\n" || char === "\r") {
      return null
    }

    // If we found @, return the query
    if (char === "@") {
      return query
    }

    // Build query backwards
    query = char + query
    i--
  }

  return null
}

/**
 * Gets cursor position in textarea/input element
 */
export function getCursorPosition(element: HTMLTextAreaElement | HTMLInputElement): number {
  return element.selectionStart || 0
}

/**
 * Sets cursor position in textarea/input element
 */
export function setCursorPosition(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number
): void {
  element.setSelectionRange(position, position)
  element.focus()
}
