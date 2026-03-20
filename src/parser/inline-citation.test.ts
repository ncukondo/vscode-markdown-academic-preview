import { describe, it, expect } from "vitest";
import { parseInlineCitation } from "./inline-citation";

describe("parseInlineCitation", () => {
  // Step 1: Basic inline citation
  describe("basic inline citation", () => {
    it("parses @smith2020 at pos 0", () => {
      expect(parseInlineCitation("@smith2020", 0)).toEqual({
        type: "inline",
        id: "smith2020",
        locator: null,
        startPos: 0,
        endPos: 10,
      });
    });

    it("parses inline citation in middle of text", () => {
      expect(parseInlineCitation("says @smith2020 and", 5)).toEqual({
        type: "inline",
        id: "smith2020",
        locator: null,
        startPos: 5,
        endPos: 15,
      });
    });

    it("excludes trailing dot from key", () => {
      const result = parseInlineCitation("@smith2020.", 0);
      expect(result).toEqual({
        type: "inline",
        id: "smith2020",
        locator: null,
        startPos: 0,
        endPos: 10,
      });
    });

    it("returns null when not starting with @", () => {
      expect(parseInlineCitation("smith2020", 0)).toBeNull();
    });
  });

  // Step 2: Word boundary check
  describe("word boundary check", () => {
    it("rejects @ preceded by word character (email)", () => {
      expect(parseInlineCitation("email@example", 5)).toBeNull();
    });

    it("accepts @ preceded by space", () => {
      expect(parseInlineCitation("a @smith", 2)).toEqual({
        type: "inline",
        id: "smith",
        locator: null,
        startPos: 2,
        endPos: 8,
      });
    });

    it("accepts @ at start of string", () => {
      expect(parseInlineCitation("@smith", 0)).toEqual({
        type: "inline",
        id: "smith",
        locator: null,
        startPos: 0,
        endPos: 6,
      });
    });

    it("accepts @ preceded by non-word char", () => {
      expect(parseInlineCitation("(@smith)", 1)).toEqual({
        type: "inline",
        id: "smith",
        locator: null,
        startPos: 1,
        endPos: 7,
      });
    });
  });

  // Step 3: Trailing locator in brackets
  describe("trailing locator in brackets", () => {
    it("parses locator with page number", () => {
      expect(parseInlineCitation("@smith2020 [p. 10]", 0)).toEqual({
        type: "inline",
        id: "smith2020",
        locator: { label: "page", value: "10" },
        startPos: 0,
        endPos: 18,
      });
    });

    it("parses locator with chapter", () => {
      expect(parseInlineCitation("@smith2020 [chap. 3]", 0)).toEqual({
        type: "inline",
        id: "smith2020",
        locator: { label: "chapter", value: "3" },
        startPos: 0,
        endPos: 20,
      });
    });

    it("does not consume brackets without valid locator", () => {
      const result = parseInlineCitation("@smith2020 [some text]", 0);
      expect(result).toEqual({
        type: "inline",
        id: "smith2020",
        locator: null,
        startPos: 0,
        endPos: 10,
      });
    });
  });
});
