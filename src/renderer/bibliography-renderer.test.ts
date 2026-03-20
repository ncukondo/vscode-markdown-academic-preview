import { describe, it, expect } from "vitest";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-csl";
import { renderBibliography } from "./bibliography-renderer";
import type { BibliographyRenderOptions } from "./bibliography-renderer";

function makeBibData(
  entries: Array<{
    id: string;
    family: string;
    given: string;
    year: number;
    type?: string;
    title?: string;
  }>,
) {
  const cite = new Cite(
    entries.map((e) => ({
      id: e.id,
      type: e.type ?? "article-journal",
      author: [{ family: e.family, given: e.given }],
      title: e.title ?? `Test Article by ${e.family}`,
      issued: { "date-parts": [[e.year]] },
    })),
  );
  return { cite, ids: cite.getIds() };
}

const threeEntries = () =>
  makeBibData([
    { id: "smith2020", family: "Smith", given: "John", year: 2020 },
    { id: "doe2019", family: "Doe", given: "Jane", year: 2019 },
    { id: "adams2021", family: "Adams", given: "Alice", year: 2021 },
  ]);

describe("renderBibliography", () => {
  describe("Step 1: Bibliography from cited entries", () => {
    it("renders bibliography with 2 cited ids", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020", "doe2019"],
        nocite: [],
        cslStyle: null,
      });
      expect(result).toContain("Smith");
      expect(result).toContain("Doe");
      expect(result).not.toContain("Adams");
    });

    it("returns empty string for 0 cited ids and no nocite", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: [],
        nocite: [],
        cslStyle: null,
      });
      expect(result).toBe("");
    });
  });

  describe("Step 2: nocite with specific ids", () => {
    it("includes nocite entries alongside cited entries", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020"],
        nocite: ["adams2021"],
        cslStyle: null,
      });
      expect(result).toContain("Smith");
      expect(result).toContain("Adams");
    });

    it("ignores nocite id that does not exist in bibliography", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020"],
        nocite: ["nonexistent"],
        cslStyle: null,
      });
      expect(result).toContain("Smith");
      expect(result).not.toContain("nonexistent");
    });
  });
});
