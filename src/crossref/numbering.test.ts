import { describe, it, expect } from "vitest";
import { resolveCrossrefNumber, resolveAllCrossrefs } from "./numbering";
import type { CrossrefDefinitionMap } from "./definition-scanner";

function buildDefinitions(
  entries: { id: string; type: "fig" | "tbl" | "eq" | "sec" | "lst"; label: string; order: number }[],
): CrossrefDefinitionMap {
  const map: CrossrefDefinitionMap = new Map();
  for (const e of entries) {
    map.set(e.id, { type: e.type, label: e.label, order: e.order });
  }
  return map;
}

describe("resolveCrossrefNumber", () => {
  it("returns the order number for a defined id", () => {
    const defs = buildDefinitions([
      { id: "fig:a", type: "fig", label: "a", order: 1 },
    ]);
    expect(resolveCrossrefNumber("fig:a", defs)).toBe(1);
  });

  it("returns null for an undefined id", () => {
    const defs = buildDefinitions([
      { id: "fig:a", type: "fig", label: "a", order: 1 },
    ]);
    expect(resolveCrossrefNumber("fig:missing", defs)).toBeNull();
  });

  it("returns independent numbering per type", () => {
    const defs = buildDefinitions([
      { id: "fig:a", type: "fig", label: "a", order: 1 },
      { id: "tbl:x", type: "tbl", label: "x", order: 1 },
    ]);
    expect(resolveCrossrefNumber("tbl:x", defs)).toBe(1);
  });
});

describe("resolveAllCrossrefs", () => {
  it("returns numbers for defined ids and omits undefined ids", () => {
    const defs = buildDefinitions([
      { id: "fig:a", type: "fig", label: "a", order: 1 },
      { id: "fig:b", type: "fig", label: "b", order: 2 },
      { id: "tbl:x", type: "tbl", label: "x", order: 1 },
    ]);
    const result = resolveAllCrossrefs(["fig:a", "fig:b", "fig:missing", "tbl:x"], defs);
    expect(result).toEqual(
      new Map([
        ["fig:a", 1],
        ["fig:b", 2],
        ["tbl:x", 1],
      ]),
    );
  });

  it("returns empty map for empty input", () => {
    const defs = buildDefinitions([
      { id: "fig:a", type: "fig", label: "a", order: 1 },
    ]);
    const result = resolveAllCrossrefs([], defs);
    expect(result).toEqual(new Map());
  });
});
