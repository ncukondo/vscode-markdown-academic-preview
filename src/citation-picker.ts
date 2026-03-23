/**
 * Types and pure functions for the citation insert command (QuickPick).
 */

export interface CslEntry {
  id: string;
  type?: string;
  title?: string;
  author?: Array<{ family?: string; given?: string }>;
  issued?: { "date-parts"?: number[][] };
  [key: string]: unknown;
}

export interface CitationQuickPickItem {
  label: string;
  description: string;
  detail: string;
  citationKey: string;
}

function formatAuthors(
  authors: Array<{ family?: string; given?: string }> | undefined,
): string {
  if (!authors || authors.length === 0) return "";
  const names = authors.map((a) => a.family ?? a.given ?? "").filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function formatYear(
  issued: { "date-parts"?: number[][] } | undefined,
): string {
  const year = issued?.["date-parts"]?.[0]?.[0];
  return year != null ? String(year) : "";
}

function formatDescription(entry: CslEntry): string {
  const author = formatAuthors(entry.author);
  const year = formatYear(entry.issued);
  if (author && year) return `${author} (${year})`;
  if (author) return author;
  if (year) return year;
  return "";
}

export function toQuickPickItems(
  entries: CslEntry[],
): CitationQuickPickItem[] {
  return entries.map((entry) => {
    const desc = formatDescription(entry);
    const title = entry.title ?? "";
    return {
      label: `@${entry.id}`,
      description: [desc, title].filter(Boolean).join(" · "),
      detail: title,
      citationKey: entry.id,
    };
  });
}

export function buildInsertText(keys: string[]): string {
  if (keys.length === 0) return "";
  return `[${keys.map((k) => `@${k}`).join("; ")}]`;
}
