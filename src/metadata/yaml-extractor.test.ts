import { describe, it, expect } from "vitest";
import { extractCitationMetadata, extractNonFrontmatterYamlRanges } from "./yaml-extractor";

describe("extractCitationMetadata", () => {
  // ─── Step 1: Single frontmatter block ──────────────────────────────

  describe("Step 1: Single frontmatter block", () => {
    it("extracts bibliography as a single string", () => {
      const doc = "---\nbibliography: refs.bib\n---\ntext";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["refs.bib"]);
      expect(result.csl).toBeNull();
      expect(result.references).toEqual([]);
      expect(result.nocite).toEqual([]);
    });

    it("extracts bibliography as an array of strings", () => {
      const doc = "---\nbibliography:\n  - a.bib\n  - b.bib\n---";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["a.bib", "b.bib"]);
    });

    it("extracts csl field", () => {
      const doc = "---\ncsl: ieee.csl\n---";
      const result = extractCitationMetadata(doc);
      expect(result.csl).toBe("ieee.csl");
    });

    it("returns default empty result when no YAML block exists", () => {
      const doc = "Just some text\nwithout any YAML.";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual([]);
      expect(result.csl).toBeNull();
      expect(result.references).toEqual([]);
      expect(result.nocite).toEqual([]);
    });
  });

  // ─── Step 2: YAML block with `...` terminator ─────────────────────

  describe("Step 2: YAML block with `...` terminator", () => {
    it("parses YAML block terminated with `...`", () => {
      const doc = "---\nbibliography: refs.bib\n...\ntext";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["refs.bib"]);
    });
  });

  // ─── Step 3: Multiple YAML blocks (merge, later wins) ─────────────

  describe("Step 3: Multiple YAML blocks (merge, later wins)", () => {
    it("later block overrides same field from earlier block", () => {
      const doc =
        "---\nbibliography: a.bib\n---\ntext\n\n---\nbibliography: b.bib\n---";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["b.bib"]);
    });

    it("merges different fields from multiple blocks", () => {
      const doc =
        "---\nbibliography: a.bib\n---\ntext\n\n---\ncsl: ieee.csl\n---";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["a.bib"]);
      expect(result.csl).toBe("ieee.csl");
    });
  });

  // ─── Step 4: Non-frontmatter YAML block requires preceding blank line

  describe("Step 4: Non-frontmatter YAML block requires preceding blank line", () => {
    it("parses YAML block in middle with blank line before", () => {
      const doc = "Some text\n\n---\nbibliography: mid.bib\n---\nmore text";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["mid.bib"]);
    });

    it("skips YAML block in middle without blank line before", () => {
      const doc = "Some text\n---\nbibliography: fake.bib\n---\nmore text";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual([]);
    });
  });

  // ─── Step 5: Skip YAML-like content inside fenced code blocks ─────

  describe("Step 5: Skip YAML-like content inside fenced code blocks", () => {
    it("does not extract YAML from backtick fenced code blocks", () => {
      const doc =
        "```\n---\nbibliography: fake.bib\n---\n```";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual([]);
    });

    it("does not extract YAML from tilde fenced code blocks", () => {
      const doc =
        "~~~\n---\nbibliography: fake.bib\n---\n~~~";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual([]);
    });

    it("extracts real YAML block after fenced code block", () => {
      const doc = [
        "```",
        "---",
        "bibliography: fake.bib",
        "---",
        "```",
        "",
        "---",
        "bibliography: real.bib",
        "---",
      ].join("\n");
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["real.bib"]);
    });
  });

  // ─── Step 6: Inline references field ──────────────────────────────

  describe("Step 6: Inline references field", () => {
    it("parses a single CSL reference entry", () => {
      const doc = [
        "---",
        "references:",
        "  - id: smith2020",
        "    title: A Great Paper",
        "    author:",
        "      - family: Smith",
        "        given: John",
        "    issued:",
        "      date-parts:",
        "        - - 2020",
        "---",
      ].join("\n");
      const result = extractCitationMetadata(doc);
      expect(result.references).toHaveLength(1);
      expect(result.references[0].id).toBe("smith2020");
      expect(result.references[0].title).toBe("A Great Paper");
    });

    it("parses multiple CSL reference entries", () => {
      const doc = [
        "---",
        "references:",
        "  - id: smith2020",
        "    title: Paper A",
        "  - id: jones2021",
        "    title: Paper B",
        "---",
      ].join("\n");
      const result = extractCitationMetadata(doc);
      expect(result.references).toHaveLength(2);
      expect(result.references[0].id).toBe("smith2020");
      expect(result.references[1].id).toBe("jones2021");
    });

    it("later references block overrides earlier one", () => {
      const doc = [
        "---",
        "references:",
        "  - id: old",
        "    title: Old Paper",
        "---",
        "text",
        "",
        "---",
        "references:",
        "  - id: new",
        "    title: New Paper",
        "---",
      ].join("\n");
      const result = extractCitationMetadata(doc);
      expect(result.references).toHaveLength(1);
      expect(result.references[0].id).toBe("new");
    });
  });

  // ─── Step 7: nocite field ──────────────────────────────────────────

  describe("Step 7: nocite field", () => {
    it("parses nocite with specific citation keys", () => {
      const doc = "---\nnocite: |\n  @item1, @item2\n---";
      const result = extractCitationMetadata(doc);
      expect(result.nocite).toEqual(["item1", "item2"]);
    });

    it("parses nocite wildcard @*", () => {
      const doc = "---\nnocite: |\n  @*\n---";
      const result = extractCitationMetadata(doc);
      expect(result.nocite).toEqual(["*"]);
    });
  });

  // ─── Content between horizontal rules should not be treated as YAML ──
  describe("Horizontal rules should not be treated as YAML blocks", () => {
    it("does not treat text between --- horizontal rules as YAML", () => {
      const doc = [
        "Some text",
        "",
        "---",
        "This is just regular text between horizontal rules.",
        "---",
        "",
        "More text",
      ].join("\n");
      const ranges = extractNonFrontmatterYamlRanges(doc);
      expect(ranges).toEqual([]);
    });

    it("does not treat blank lines between --- as YAML", () => {
      const doc = [
        "Some text",
        "",
        "---",
        "",
        "---",
        "",
        "More text",
      ].join("\n");
      const ranges = extractNonFrontmatterYamlRanges(doc);
      expect(ranges).toEqual([]);
    });

    it("still detects valid YAML blocks between ---", () => {
      const doc = [
        "Some text",
        "",
        "---",
        "bibliography: refs.bib",
        "---",
        "",
        "More text",
      ].join("\n");
      const ranges = extractNonFrontmatterYamlRanges(doc);
      expect(ranges).toEqual([[2, 5]]);
    });
  });

  // ─── Step 8: Unrelated YAML fields are ignored ────────────────────

  describe("Step 8: Unrelated YAML fields are ignored", () => {
    it("only extracts citation-related fields, ignores others", () => {
      const doc =
        "---\ntitle: Hello\nauthor: Me\nbibliography: refs.bib\ndate: 2024\n---";
      const result = extractCitationMetadata(doc);
      expect(result.bibliography).toEqual(["refs.bib"]);
      expect(result.csl).toBeNull();
      expect(result.references).toEqual([]);
      expect(result.nocite).toEqual([]);
      // Verify no extra fields leak through
      const keys = Object.keys(result);
      expect(keys).toEqual(["bibliography", "csl", "references", "nocite"]);
    });
  });
});
