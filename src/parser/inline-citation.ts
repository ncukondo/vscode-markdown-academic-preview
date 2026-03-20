import type { Locator } from "./locator";
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

  const keyResult = parseCitationKey(src, pos + 1);
  if (!keyResult) return null;

  return {
    type: "inline",
    id: keyResult.key,
    locator: null,
    startPos: pos,
    endPos: keyResult.endPos,
  };
}
