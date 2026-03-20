export type ParseResult = { key: string; endPos: number } | null;

/**
 * Parse a Pandoc citation key from `src` starting at position `pos`.
 *
 * Citation key rules (per Pandoc manual, excluding curly-brace syntax):
 * - Must start with a letter, digit, or underscore
 * - May contain letters, digits, underscores, and internal punctuation from [:.#$%&\-+?<>~/]
 * - Trailing punctuation characters are excluded from the key
 * - Consecutive internal punctuation characters terminate the key
 */
export function parseCitationKey(src: string, pos: number): ParseResult {
  const len = src.length;
  if (pos >= len) return null;

  const startChar = src[pos];
  // Must start with a letter, digit, or underscore
  if (!isAlphanumOrUnderscore(startChar)) return null;

  let i = pos + 1;
  // Track the end of the last alphanumeric/underscore character
  let lastAlnumEnd = pos + 1;

  while (i < len) {
    const ch = src[i];

    if (isAlphanumOrUnderscore(ch)) {
      i++;
      lastAlnumEnd = i;
    } else if (isInternalPunctuation(ch)) {
      // Check for consecutive punctuation — terminates the key
      if (i + 1 < len && isInternalPunctuation(src[i + 1])) {
        break;
      }
      // Single internal punctuation: only include if followed by an alnum/underscore
      if (i + 1 < len && isAlphanumOrUnderscore(src[i + 1])) {
        i++;
        // Don't update lastAlnumEnd yet — the punctuation itself is internal
      } else {
        // Trailing punctuation or followed by non-alnum: stop
        break;
      }
    } else {
      // Any other character terminates the key
      break;
    }
  }

  // The key extends to the last alphanumeric/underscore position
  const key = src.slice(pos, lastAlnumEnd);
  if (key.length === 0) return null;

  return { key, endPos: lastAlnumEnd };
}

function isAlphanumOrUnderscore(ch: string): boolean {
  return /^[a-zA-Z0-9_]$/.test(ch);
}

function isInternalPunctuation(ch: string): boolean {
  return /^[:.#$%&\-+?<>~/]$/.test(ch);
}
