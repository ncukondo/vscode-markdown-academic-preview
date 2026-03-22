import { describe, it, expect } from "vitest";
import { CROSSREF_PREFIXES, parseCrossrefKey, isCrossrefKey } from "./types";

describe("CROSSREF_PREFIXES", () => {
  it("contains exactly the five known prefixes", () => {
    expect(CROSSREF_PREFIXES).toEqual(["fig:", "tbl:", "eq:", "sec:", "lst:"]);
  });
});

describe("parseCrossrefKey", () => {
  it('parses "fig:diagram1"', () => {
    expect(parseCrossrefKey("fig:diagram1")).toEqual({
      type: "fig",
      label: "diagram1",
    });
  });

  it('parses "tbl:results"', () => {
    expect(parseCrossrefKey("tbl:results")).toEqual({
      type: "tbl",
      label: "results",
    });
  });

  it('parses "eq:euler"', () => {
    expect(parseCrossrefKey("eq:euler")).toEqual({
      type: "eq",
      label: "euler",
    });
  });

  it('parses "sec:intro"', () => {
    expect(parseCrossrefKey("sec:intro")).toEqual({
      type: "sec",
      label: "intro",
    });
  });

  it('parses "lst:code1"', () => {
    expect(parseCrossrefKey("lst:code1")).toEqual({
      type: "lst",
      label: "code1",
    });
  });

  it('returns null for "smith2020" (regular citation key)', () => {
    expect(parseCrossrefKey("smith2020")).toBeNull();
  });

  it('returns null for "configure:" (not a known prefix)', () => {
    expect(parseCrossrefKey("configure:")).toBeNull();
  });

  it('returns null for "fig:" (empty label)', () => {
    expect(parseCrossrefKey("fig:")).toBeNull();
  });
});

describe("isCrossrefKey", () => {
  it('returns true for "fig:x"', () => {
    expect(isCrossrefKey("fig:x")).toBe(true);
  });

  it('returns false for "smith2020"', () => {
    expect(isCrossrefKey("smith2020")).toBe(false);
  });
});
