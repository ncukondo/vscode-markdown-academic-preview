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

const DEFINITION_PATTERN = /\{#([a-z]+):([a-zA-Z0-9_][\w-]*)\}/g;

const VALID_PREFIXES = new Set<string>(["fig", "tbl", "eq", "sec", "lst"]);

/**
 * Scan a Markdown document for crossref definition targets ({#type:label})
 * and collect them with their document order (per type).
 */
export function scanCrossrefDefinitions(source: string): CrossrefDefinitionMap {
  const result: CrossrefDefinitionMap = new Map();
  const orderCounters = new Map<CrossrefType, number>();

  for (const match of source.matchAll(DEFINITION_PATTERN)) {
    const type = match[1];
    const label = match[2];

    if (!VALID_PREFIXES.has(type)) continue;

    const crossrefType = type as CrossrefType;
    const fullId = `${type}:${label}`;

    if (result.has(fullId)) continue;

    const currentOrder = (orderCounters.get(crossrefType) ?? 0) + 1;
    orderCounters.set(crossrefType, currentOrder);

    result.set(fullId, { type: crossrefType, label, order: currentOrder });
  }

  return result;
}
