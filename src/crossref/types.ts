export type CrossrefType = "fig" | "tbl" | "eq" | "sec" | "lst";

export const CROSSREF_PREFIXES: readonly `${CrossrefType}:`[] = [
  "fig:",
  "tbl:",
  "eq:",
  "sec:",
  "lst:",
];

export const CROSSREF_DISPLAY_NAMES: Record<CrossrefType, string> = {
  fig: "Figure",
  tbl: "Table",
  eq: "Equation",
  sec: "Section",
  lst: "Listing",
};

type StripColon<S extends string> = S extends `${infer T}:` ? T : never;

function stripColon<S extends `${string}:`>(s: S): StripColon<S> {
  return s.slice(0, -1) as StripColon<S>;
}

export function parseCrossrefKey(
  key: string,
): { type: CrossrefType; label: string } | null {
  for (const prefix of CROSSREF_PREFIXES) {
    if (key.startsWith(prefix)) {
      const label = key.slice(prefix.length);
      if (label.length === 0) return null;
      return { type: stripColon(prefix), label };
    }
  }
  return null;
}

export function isCrossrefKey(key: string): boolean {
  return parseCrossrefKey(key) !== null;
}
