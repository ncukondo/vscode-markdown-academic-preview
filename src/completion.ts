/**
 * Pure logic for building citation completion entries from CSL data.
 * No vscode dependency — testable standalone.
 */

export interface CslEntry {
  id: string;
  author?: Array<{ family?: string; given?: string }>;
  title?: string;
  issued?: { "date-parts"?: number[][] };
}

export interface CompletionEntry {
  key: string;
  label: string;
  detail: string;
  documentation: string;
  filterText: string;
  insertText: string;
}

export interface CompletionContext {
  insideBracket: boolean;
}

export function buildCompletionEntries(
  entries: CslEntry[],
  context: CompletionContext,
): CompletionEntry[] {
  return entries.map((entry) => {
    const key = entry.id;
    const detail = formatDetail(entry);
    const title = entry.title ?? "";
    const insertText = context.insideBracket ? `@${key}` : `[@${key}]`;

    return {
      key,
      label: key,
      detail,
      documentation: title,
      filterText: [key, detail, title].join(" "),
      insertText,
    };
  });
}

function formatDetail(entry: CslEntry): string {
  const authorStr = formatAuthors(entry.author);
  const year = extractYear(entry);
  if (authorStr && year) return `${authorStr} (${year})`;
  if (authorStr) return authorStr;
  if (year) return `(${year})`;
  return "";
}

function formatAuthors(
  authors?: Array<{ family?: string; given?: string }>,
): string {
  if (!authors || authors.length === 0) return "";
  if (authors.length === 1) return authors[0].family ?? "";
  if (authors.length === 2) {
    return `${authors[0].family ?? ""} & ${authors[1].family ?? ""}`;
  }
  return `${authors[0].family ?? ""} et al.`;
}

function extractYear(entry: CslEntry): string {
  const parts = entry.issued?.["date-parts"];
  if (parts && parts.length > 0 && parts[0].length > 0) {
    return String(parts[0][0]);
  }
  return "";
}

/**
 * Determine if the cursor is inside a `[...]` bracket.
 * Scans leftward from one before the cursor position for an unmatched `[`.
 */
export function isInsideBracket(lineText: string, cursorCol: number): boolean {
  let depth = 0;
  for (let i = cursorCol - 1; i >= 0; i--) {
    if (lineText[i] === "]") depth++;
    if (lineText[i] === "[") {
      if (depth === 0) return true;
      depth--;
    }
  }
  return false;
}
