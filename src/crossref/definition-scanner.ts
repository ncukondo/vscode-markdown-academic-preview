/** Pandoc-crossref type prefixes */
export type CrossrefType = "fig" | "tbl" | "eq" | "sec" | "lst";

export const CROSSREF_PREFIXES: readonly string[] = [
  "fig:",
  "tbl:",
  "eq:",
  "sec:",
  "lst:",
] as const;

/** A single crossref definition found in the document */
export interface CrossrefDefinition {
  type: CrossrefType;
  label: string;
  order: number;
}

/** Map from full id (e.g. "fig:diagram") to its definition */
export type CrossrefDefinitionMap = Map<string, CrossrefDefinition>;
