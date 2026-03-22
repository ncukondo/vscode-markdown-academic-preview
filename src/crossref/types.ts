export type CrossrefType = "fig" | "tbl" | "eq" | "sec" | "lst";

export const CROSSREF_PREFIXES: readonly string[] = [
  "fig:",
  "tbl:",
  "eq:",
  "sec:",
  "lst:",
];

export function parseCrossrefKey(
  key: string,
): { type: CrossrefType; label: string } | null {
  for (const prefix of CROSSREF_PREFIXES) {
    if (key.startsWith(prefix)) {
      const label = key.slice(prefix.length);
      if (label.length === 0) return null;
      return { type: prefix.slice(0, -1) as CrossrefType, label };
    }
  }
  return null;
}

export function isCrossrefKey(key: string): boolean {
  return parseCrossrefKey(key) !== null;
}
