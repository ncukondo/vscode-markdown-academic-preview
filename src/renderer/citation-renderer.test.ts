import { describe, it, expect } from "vitest";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-csl";
import { renderCitation } from "./citation-renderer";
import type { CitationRenderOptions } from "./citation-renderer";

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
      title: e.title ?? "Test",
      issued: { "date-parts": [[e.year]] },
    })),
  );
  return { cite, ids: cite.getIds() };
}

const defaultBib = () =>
  makeBibData([
    { id: "smith2020", family: "Smith", given: "John", year: 2020 },
    { id: "doe2019", family: "Doe", given: "Jane", year: 2019 },
  ]);

const defaultOptions = (): CitationRenderOptions => ({
  bibliographyData: defaultBib(),
  cslStyle: null,
});

describe("renderCitation", () => {
  describe("Step 1: Basic single citation", () => {
    it("renders a known citation id", () => {
      const result = renderCitation(
        [{ id: "smith2020" }],
        defaultOptions(),
      );
      expect(result).toBe("(Smith, 2020)");
    });

    it("renders placeholder for unknown id", () => {
      const result = renderCitation(
        [{ id: "unknown_id" }],
        defaultOptions(),
      );
      expect(result).toContain("unknown_id");
    });
  });

  describe("Step 2: Citation with locator", () => {
    it("renders citation with page locator", () => {
      const result = renderCitation(
        [{ id: "smith2020", locator: { label: "page", value: "10" } }],
        defaultOptions(),
      );
      expect(result).toBe("(Smith, 2020, p. 10)");
    });
  });

  describe("Step 3: Suppress author", () => {
    it("renders citation without author when suppressAuthor is true", () => {
      const result = renderCitation(
        [{ id: "smith2020", suppressAuthor: true }],
        defaultOptions(),
      );
      expect(result).toBe("(2020)");
    });
  });

  describe("Step 4: Prefix and suffix", () => {
    it("renders citation with prefix", () => {
      const result = renderCitation(
        [{ id: "smith2020", prefix: "see " }],
        defaultOptions(),
      );
      expect(result).toBe("(see Smith, 2020)");
    });

    it("renders citation with suffix", () => {
      const result = renderCitation(
        [{ id: "smith2020", suffix: ", emphasis added" }],
        defaultOptions(),
      );
      expect(result).toBe("(Smith, 2020, emphasis added)");
    });
  });

  describe("Step 5: Multiple citations in one group", () => {
    it("renders multiple citations sorted by style", () => {
      const result = renderCitation(
        [{ id: "smith2020" }, { id: "doe2019" }],
        defaultOptions(),
      );
      expect(result).toBe("(Doe, 2019; Smith, 2020)");
    });
  });

  describe("Mixed known/unknown items", () => {
    it("renders known items and appends unknown placeholders", () => {
      const result = renderCitation(
        [{ id: "smith2020" }, { id: "nonexistent" }],
        defaultOptions(),
      );
      expect(result).toContain("Smith, 2020");
      expect(result).toContain("?nonexistent");
    });
  });

  describe("Empty items array", () => {
    it("returns empty string when items array is empty", () => {
      const result = renderCitation([], defaultOptions());
      expect(result).toBe("");
    });
  });

  describe("Step 6: Custom CSL style", () => {
    it("renders with custom CSL XML (vancouver/numeric)", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { plugins } = require("@citation-js/core");
      const vancouverXml: string = plugins.config.get("@csl").templates.get("vancouver");

      const result = renderCitation(
        [{ id: "smith2020" }],
        { bibliographyData: defaultBib(), cslStyle: vancouverXml },
      );
      // Vancouver uses numeric format: (1)
      expect(result).toBe("(1)");
    });

    it("uses default APA style when cslStyle is null", () => {
      const result = renderCitation(
        [{ id: "smith2020" }],
        { bibliographyData: defaultBib(), cslStyle: null },
      );
      // APA author-date format
      expect(result).toBe("(Smith, 2020)");
    });
  });
});
