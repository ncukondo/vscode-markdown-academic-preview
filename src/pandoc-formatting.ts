import type MarkdownIt from "markdown-it";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";

const TILDE = 0x7e; // ~
const CARET = 0x5e; // ^
const BACKSLASH = 0x5c; // \
const SPACE = 0x20;
const NEWLINE = 0x0a;

/**
 * Create a markdown-it inline rule for single-character wrap markers.
 * Used for Pandoc subscript (~text~) and superscript (^text^).
 *
 * Rules:
 * - Content between markers must not contain unescaped spaces or newlines
 * - Content must not be empty
 * - For ~: double ~~ is strikethrough, handled by markdown-it's built-in rule
 */
function createWrapRule(marker: number, tag: string, markerStr: string) {
  return function rule(state: StateInline, silent: boolean): boolean {
    const start = state.pos;
    const max = state.posMax;

    if (state.src.charCodeAt(start) !== marker) return false;

    // Need at least: marker + one char + marker
    if (start + 2 > max) return false;

    // Scan for closing marker
    let end = start + 1;
    while (end <= max) {
      const ch = state.src.charCodeAt(end);

      // Backslash escape: skip next character
      if (ch === BACKSLASH && end + 1 <= max) {
        end += 2;
        continue;
      }

      // Found closing marker
      if (ch === marker) break;

      // No unescaped spaces or newlines
      if (ch === SPACE || ch === NEWLINE) return false;

      end++;
    }

    // No closing marker found, or empty content
    if (end > max || end === start + 1) return false;

    if (!silent) {
      const content = state.src.slice(start + 1, end);
      state.push(`${tag}_open`, tag, 1).markup = markerStr;
      state.push("text", "", 0).content = content;
      state.push(`${tag}_close`, tag, -1).markup = markerStr;
    }

    state.pos = end + 1;
    return true;
  };
}

/**
 * Add Pandoc subscript (~text~ → <sub>) and superscript (^text^ → <sup>) rules.
 * Strikethrough (~~text~~ → <s>) is already built into markdown-it.
 */
export function pandocFormattingPlugin(md: MarkdownIt): void {
  // Register after emphasis so citation rules (before link) have higher priority
  // Strikethrough (built-in, requires ~~) runs before these and won't conflict
  md.inline.ruler.after(
    "emphasis",
    "pandoc_subscript",
    createWrapRule(TILDE, "sub", "~"),
  );
  md.inline.ruler.after(
    "pandoc_subscript",
    "pandoc_superscript",
    createWrapRule(CARET, "sup", "^"),
  );
}
