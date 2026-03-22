import { describe, it, expect } from "vitest";
import { renderCrossref } from "./crossref-renderer";
import type { CrossrefConfig } from "./types";

describe("renderCrossref", () => {
  it("renders without number as type: label", () => {
    expect(renderCrossref("fig", "diagram")).toBe(
      '<a href="#fig:diagram" class="pandoc-crossref">Figure: diagram</a>',
    );
  });

  it("renders with number as type + number", () => {
    expect(renderCrossref("fig", "diagram", 1)).toBe(
      '<a href="#fig:diagram" class="pandoc-crossref">Figure\u00a01</a>',
    );
  });

  it("renders table type", () => {
    expect(renderCrossref("tbl", "results")).toBe(
      '<a href="#tbl:results" class="pandoc-crossref">Table: results</a>',
    );
  });

  it("renders equation type with number", () => {
    expect(renderCrossref("eq", "euler", 3)).toBe(
      '<a href="#eq:euler" class="pandoc-crossref">Equation\u00a03</a>',
    );
  });

  it("renders section type", () => {
    expect(renderCrossref("sec", "intro")).toBe(
      '<a href="#sec:intro" class="pandoc-crossref">Section: intro</a>',
    );
  });

  it("renders listing type", () => {
    expect(renderCrossref("lst", "code1")).toBe(
      '<a href="#lst:code1" class="pandoc-crossref">Listing: code1</a>',
    );
  });

  it("unknown type falls back gracefully", () => {
    // At runtime, type could be an unexpected string
    const result = renderCrossref("unknown" as never, "foo");
    expect(result).toBe(
      '<a href="#unknown:foo" class="pandoc-crossref">unknown: foo</a>',
    );
  });

  it("HTML-escapes the label parameter", () => {
    expect(renderCrossref("fig", '<img onerror="xss">')).toBe(
      '<a href="#fig:&lt;img onerror=&quot;xss&quot;&gt;" class="pandoc-crossref">Figure: &lt;img onerror=&quot;xss&quot;&gt;</a>',
    );
  });

  describe("with custom CrossrefConfig", () => {
    const config: CrossrefConfig = {
      figPrefix: "Fig.",
      tblPrefix: "Tbl.",
      eqnPrefix: "Eq.",
      secPrefix: "Sec.",
      lstPrefix: "Lst.",
    };

    it("figPrefix: 'Fig.' + @fig:a renders 'Fig. 1'", () => {
      expect(renderCrossref("fig", "a", 1, undefined, config)).toBe(
        '<a href="#fig:a" class="pandoc-crossref">Fig.\u00a01</a>',
      );
    });

    it("eqnPrefix maps to eq type", () => {
      expect(renderCrossref("eq", "euler", 3, undefined, config)).toBe(
        '<a href="#eq:euler" class="pandoc-crossref">Eq.\u00a03</a>',
      );
    });

    it("unset config uses default display names", () => {
      expect(renderCrossref("fig", "a", 1)).toBe(
        '<a href="#fig:a" class="pandoc-crossref">Figure\u00a01</a>',
      );
    });

    it("custom prefix without number shows prefix: label", () => {
      expect(renderCrossref("tbl", "results", undefined, undefined, config)).toBe(
        '<a href="#tbl:results" class="pandoc-crossref">Tbl.: results</a>',
      );
    });
  });
});
