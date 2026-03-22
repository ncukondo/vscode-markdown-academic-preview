import type { CrossrefDefinitionMap } from "./definition-scanner";

export function resolveCrossrefNumber(
  id: string,
  definitions: CrossrefDefinitionMap,
): number | null {
  const def = definitions.get(id);
  return def ? def.order : null;
}

export function resolveAllCrossrefs(
  ids: string[],
  definitions: CrossrefDefinitionMap,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const id of ids) {
    const num = resolveCrossrefNumber(id, definitions);
    if (num !== null) {
      result.set(id, num);
    }
  }
  return result;
}
