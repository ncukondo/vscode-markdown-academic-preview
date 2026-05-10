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
    DOI?: string;
    URL?: string;
  }>,
) {
  const cite = new Cite(
    entries.map((e) => ({
      id: e.id,
      type: e.type ?? "article-journal",
      author: [{ family: e.family, given: e.given }],
      title: e.title ?? `Test Article by ${e.family}`,
      issued: { "date-parts": [[e.year]] },
      ...(e.DOI ? { DOI: e.DOI } : {}),
      ...(e.URL ? { URL: e.URL } : {}),
    })),
  );
  const entriesById = new Map<string, { id: string }>();
  for (const entry of cite.data as Array<{ id: string }>) {
    entriesById.set(entry.id, entry);
  }
  return { cite, ids: cite.getIds(), entriesById };
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
      expect(result).not.toContain("Doe");
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

  describe("Step 3: nocite wildcard (@*)", () => {
    it("includes all entries when nocite contains '*'", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: [],
        nocite: ["*"],
        cslStyle: null,
      });
      expect(result).toContain("Smith");
      expect(result).toContain("Doe");
      expect(result).toContain("Adams");
    });
  });

  describe("Step 4: Custom CSL style", () => {
    it("renders with custom CSL XML producing different output", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { plugins } = require("@citation-js/core");
      const vancouverXml: string = plugins.config.get("@csl").templates.get("vancouver");

      const defaultResult = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
      });

      const customResult = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: vancouverXml,
      });

      // Vancouver and APA produce different formatting
      expect(customResult).toContain("Smith");
      expect(customResult).not.toBe(defaultResult);
    });

    it("uses default APA style when cslStyle is null", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
      });
      // APA bibliography includes author name
      expect(result).toContain("Smith");
    });
  });

  describe("Step 5: DOI and URL linkification", () => {
    it("renders DOI as a clickable link", () => {
      const bibData = makeBibData([
        { id: "smith2020", family: "Smith", given: "John", year: 2020, DOI: "10.1234/test" },
      ]);
      const result = renderBibliography({
        bibliographyData: bibData,
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
      });
      expect(result).toContain('<a href="https://doi.org/10.1234/test">https://doi.org/10.1234/test</a>');
    });

    it("renders URL as a clickable link", () => {
      const bibData = makeBibData([
        { id: "doe2021", family: "Doe", given: "Jane", year: 2021, URL: "https://example.com/article" },
      ]);
      const result = renderBibliography({
        bibliographyData: bibData,
        citedIds: ["doe2021"],
        nocite: [],
        cslStyle: null,
      });
      expect(result).toContain('<a href="https://example.com/article">https://example.com/article</a>');
    });

    it("renders both DOI and URL as links when both present", () => {
      const bibData = makeBibData([
        {
          id: "lee2022",
          family: "Lee",
          given: "Bob",
          year: 2022,
          DOI: "10.5678/example",
          URL: "https://example.org/paper",
        },
      ]);
      const result = renderBibliography({
        bibliographyData: bibData,
        citedIds: ["lee2022"],
        nocite: [],
        cslStyle: null,
      });
      expect(result).toContain('<a href="https://doi.org/10.5678/example">https://doi.org/10.5678/example</a>');
    });

    it("does not double-linkify URLs already in anchor tags", () => {
      const bibData = makeBibData([
        { id: "smith2020", family: "Smith", given: "John", year: 2020, DOI: "10.1234/test" },
      ]);
      const result = renderBibliography({
        bibliographyData: bibData,
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
      });
      // Should not have nested anchors
      expect(result).not.toContain('<a href="<a');
      expect(result).not.toMatch(/<a[^>]*>.*<a/);
    });
  });

  describe("Locale support", () => {
    it("renders with German locale producing different terms", () => {
      const bibData = makeBibData([
        {
          id: "smith2020",
          family: "Smith",
          given: "John",
          year: 2020,
          type: "book",
        },
      ]);
      // Add editor to the entry data to trigger locale-dependent "Ed." / "Hrsg."
      bibData.cite.data[0].editor = [{ family: "Editor", given: "Ed" }];

      const enResult = renderBibliography({
        bibliographyData: bibData,
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
      });
      const deResult = renderBibliography({
        bibliographyData: bibData,
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
        locale: "de-DE",
      });
      // English uses "Ed." while German uses "Hrsg."
      expect(enResult).toContain("Ed.");
      expect(deResult).toContain("Hrsg.");
    });

    it("uses default locale when locale is undefined", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
      });
      expect(result).toContain("Smith");
    });
  });

  describe("Step 6: HTML output structure", () => {
    it("wraps output in a container div with appropriate class", () => {
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020"],
        nocite: [],
        cslStyle: null,
      });
      expect(result).toContain('<div class="csl-bib-body');
      expect(result).toContain("csl-entry");
    });

    it("entries are ordered according to CSL style rules", () => {
      // APA orders alphabetically by author family name
      const result = renderBibliography({
        bibliographyData: threeEntries(),
        citedIds: ["smith2020", "doe2019", "adams2021"],
        nocite: [],
        cslStyle: null,
      });
      const adamsPos = result.indexOf("Adams");
      const doePos = result.indexOf("Doe");
      const smithPos = result.indexOf("Smith");
      expect(adamsPos).toBeLessThan(doePos);
      expect(doePos).toBeLessThan(smithPos);
    });
  });
});
