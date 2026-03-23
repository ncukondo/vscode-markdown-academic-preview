import { describe, it, expect } from "vitest";
import {
  toQuickPickItems,
  buildInsertText,
  type CslEntry,
} from "./citation-picker";

function makeEntry(overrides: Partial<CslEntry> & { id: string }): CslEntry {
  return {
    type: "article-journal",
    title: "Default Title",
    author: [{ family: "Smith", given: "John" }],
    issued: { "date-parts": [[2020]] },
    ...overrides,
  };
}

describe("toQuickPickItems", () => {
  it("generates QuickPickItem from a CSL-JSON entry", () => {
    const entries = [
      makeEntry({ id: "smith2020", title: "A Great Paper" }),
    ];
    const items = toQuickPickItems(entries);
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe("@smith2020");
    expect(items[0].description).toBe("Smith (2020) · A Great Paper");
    expect(items[0].detail).toBe("A Great Paper");
  });

  it("formats multiple authors with ampersand", () => {
    const entries = [
      makeEntry({
        id: "multi2020",
        author: [
          { family: "Smith", given: "A" },
          { family: "Jones", given: "B" },
          { family: "Lee", given: "C" },
        ],
      }),
    ];
    const items = toQuickPickItems(entries);
    expect(items[0].description).toBe(
      "Smith, Jones & Lee (2020) · Default Title",
    );
  });

  it("handles two authors", () => {
    const entries = [
      makeEntry({
        id: "duo2021",
        author: [
          { family: "Doe", given: "J" },
          { family: "Roe", given: "R" },
        ],
        issued: { "date-parts": [[2021]] },
      }),
    ];
    const items = toQuickPickItems(entries);
    expect(items[0].description).toBe("Doe & Roe (2021) · Default Title");
  });

  it("falls back when author is missing", () => {
    const entries = [
      { id: "noauthor2020", type: "article-journal", title: "No Author" } as CslEntry,
    ];
    const items = toQuickPickItems(entries);
    expect(items[0].description).not.toContain("undefined");
    expect(items[0].label).toBe("@noauthor2020");
  });

  it("falls back when year is missing", () => {
    const entries = [
      makeEntry({ id: "noyear", issued: undefined }),
    ];
    const items = toQuickPickItems(entries);
    expect(items[0].description).toBe("Smith · Default Title");
    expect(items[0].description).not.toContain("undefined");
    expect(items[0].description).not.toContain("()");
  });

  it("falls back when title is missing", () => {
    const entries = [
      makeEntry({ id: "notitle", title: undefined }),
    ];
    const items = toQuickPickItems(entries);
    expect(items[0].detail).toBe("");
    expect(items[0].description).toBe("Smith (2020)");
  });

  it("includes both author and title in description for cross-field search", () => {
    const entries = [
      makeEntry({
        id: "kondo2024",
        author: [{ family: "Kondo", given: "T" }],
        title: "AI in Education",
        issued: { "date-parts": [[2024]] },
      }),
    ];
    const items = toQuickPickItems(entries);
    expect(items[0].description).toContain("Kondo");
    expect(items[0].description).toContain("AI in Education");
  });
});

describe("buildInsertText", () => {
  it("generates [@key] for a single selection", () => {
    expect(buildInsertText(["smith2020"])).toBe("[@smith2020]");
  });

  it("generates [@key1; @key2; @key3] for multiple selections", () => {
    expect(buildInsertText(["a2020", "b2021", "c2022"])).toBe(
      "[@a2020; @b2021; @c2022]",
    );
  });

  it("returns empty string for empty selection", () => {
    expect(buildInsertText([])).toBe("");
  });
});
