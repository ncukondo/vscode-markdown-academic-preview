import { describe, it, expect } from "vitest";
import { renderCrossref } from "./crossref-renderer";

describe("renderCrossref", () => {
  it("renders without number as type: label", () => {
    expect(renderCrossref("fig", "diagram")).toBe(
      '<span class="pandoc-crossref">Figure: diagram</span>',
    );
  });

  it("renders with number as type + number", () => {
    expect(renderCrossref("fig", "diagram", 1)).toBe(
      '<span class="pandoc-crossref">Figure\u00a01</span>',
    );
  });

  it("renders table type", () => {
    expect(renderCrossref("tbl", "results")).toBe(
      '<span class="pandoc-crossref">Table: results</span>',
    );
  });

  it("renders equation type with number", () => {
    expect(renderCrossref("eq", "euler", 3)).toBe(
      '<span class="pandoc-crossref">Equation\u00a03</span>',
    );
  });

  it("renders section type", () => {
    expect(renderCrossref("sec", "intro")).toBe(
      '<span class="pandoc-crossref">Section: intro</span>',
    );
  });

  it("renders listing type", () => {
    expect(renderCrossref("lst", "code1")).toBe(
      '<span class="pandoc-crossref">Listing: code1</span>',
    );
  });

  it("unknown type falls back gracefully", () => {
    // At runtime, type could be an unexpected string
    const result = renderCrossref("unknown" as never, "foo");
    expect(result).toBe(
      '<span class="pandoc-crossref">unknown: foo</span>',
    );
  });

  it("HTML-escapes the label parameter", () => {
    expect(renderCrossref("fig", '<img onerror="xss">')).toBe(
      '<span class="pandoc-crossref">Figure: &lt;img onerror=&quot;xss&quot;&gt;</span>',
    );
  });
});
