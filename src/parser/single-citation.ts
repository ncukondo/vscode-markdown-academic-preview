import type { Locator } from "./locator";
import { parseCitationKey } from "./citation-key";

export interface SingleCitation {
  id: string;
  prefix: string;
  suffix: string;
  locator: Locator | null;
  suppressAuthor: boolean;
}

/**
 * Parse a single citation entry (one item between semicolons inside brackets)
 * into its structured components.
 *
 * @param text - The text of one citation item (between `;` separators, without surrounding brackets)
 * @returns Parsed citation or null if no valid `@key` found
 */
export function parseSingleCitation(text: string): SingleCitation | null {
  // Find the @ sign
  const atIndex = text.indexOf("@");
  if (atIndex === -1) return null;

  // Parse the citation key starting after @
  const keyResult = parseCitationKey(text, atIndex + 1);
  if (!keyResult) return null;

  return {
    id: keyResult.key,
    prefix: "",
    suffix: "",
    locator: null,
    suppressAuthor: false,
  };
}
