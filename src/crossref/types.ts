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

/** YAML-configurable prefix strings for each crossref type. */
export interface CrossrefConfig {
  figPrefix: string;
  tblPrefix: string;
  eqnPrefix: string;
  secPrefix: string;
  lstPrefix: string;
}

export const DEFAULT_CROSSREF_CONFIG: Readonly<CrossrefConfig> = {
  figPrefix: "Figure",
  tblPrefix: "Table",
  eqnPrefix: "Equation",
  secPrefix: "Section",
  lstPrefix: "Listing",
};

/** Maps CrossrefType to the corresponding CrossrefConfig key. */
export const CROSSREF_TYPE_TO_PREFIX_KEY: Record<CrossrefType, keyof CrossrefConfig> = {
  fig: "figPrefix",
  tbl: "tblPrefix",
  eq: "eqnPrefix",
  sec: "secPrefix",
  lst: "lstPrefix",
};
