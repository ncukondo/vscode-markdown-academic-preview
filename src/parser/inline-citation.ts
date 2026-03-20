import type { Locator } from "./locator";
import { matchLocator } from "./locator";
import { parseCitationKey } from "./citation-key";

export interface InlineCitation {
  type: "inline";
  id: string;
  locator: Locator | null;
  startPos: number;
  endPos: number;
}

/**
 * Attempt to parse an inline citation at the given position.
 * pos should point to the '@' character.
 */
export function parseInlineCitation(
  src: string,
  pos: number,
): InlineCitation | null {
  if (pos >= src.length || src[pos] !== "@") return null;

  // @ must not be preceded by a word character (avoids matching emails etc.)
  if (pos > 0 && /\w/.test(src[pos - 1])) return null;

  const keyResult = parseCitationKey(src, pos + 1);
  if (!keyResult) return null;

  let locator: Locator | null = null;
  let endPos = keyResult.endPos;

  // Check for trailing locator in brackets: @key [locator]
  // Pandoc requires a space before the opening bracket
  if (
    keyResult.endPos < src.length &&
    src[keyResult.endPos] === " " &&
    keyResult.endPos + 1 < src.length &&
    src[keyResult.endPos + 1] === "["
  ) {
    const closeBracket = src.indexOf("]", keyResult.endPos + 2);
    if (closeBracket !== -1) {
      const bracketContent = src.slice(keyResult.endPos + 2, closeBracket);
      const locatorResult = matchLocator(bracketContent);
      if (locatorResult) {
        locator = locatorResult.locator;
        endPos = closeBracket + 1;
      }
    }
  }

  return {
    type: "inline",
    id: keyResult.key,
    locator,
    startPos: pos,
    endPos,
  };
}
