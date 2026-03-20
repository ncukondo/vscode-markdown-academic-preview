import { describe, it, expect } from "vitest";
import { parseSingleCitation } from "./single-citation";

describe("parseSingleCitation", () => {
  // Step 1: Basic citation (key only)
  describe("basic citation (key only)", () => {
    it('parses "@smith2020" as basic citation', () => {
      expect(parseSingleCitation("@smith2020")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: "",
        locator: null,
        suppressAuthor: false,
      });
    });

    it('returns null for ""', () => {
      expect(parseSingleCitation("")).toBeNull();
    });

    it('returns null for "no citation here"', () => {
      expect(parseSingleCitation("no citation here")).toBeNull();
    });
  });

  // Step 2: Suppress author
  describe("suppress author", () => {
    it('parses "-@smith2020" with suppressAuthor true', () => {
      expect(parseSingleCitation("-@smith2020")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: "",
        locator: null,
        suppressAuthor: true,
      });
    });

    it('parses " -@smith2020" with leading space and suppressAuthor true', () => {
      expect(parseSingleCitation(" -@smith2020")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: "",
        locator: null,
        suppressAuthor: true,
      });
    });
  });

  // Step 3: Prefix text
  describe("prefix text", () => {
    it('parses "see @smith2020" with prefix', () => {
      expect(parseSingleCitation("see @smith2020")).toEqual({
        id: "smith2020",
        prefix: "see ",
        suffix: "",
        locator: null,
        suppressAuthor: false,
      });
    });

    it('parses "e.g., @smith2020" with prefix', () => {
      expect(parseSingleCitation("e.g., @smith2020")).toEqual({
        id: "smith2020",
        prefix: "e.g., ",
        suffix: "",
        locator: null,
        suppressAuthor: false,
      });
    });

    it('parses "see -@smith2020" with prefix and suppressAuthor', () => {
      expect(parseSingleCitation("see -@smith2020")).toEqual({
        id: "smith2020",
        prefix: "see ",
        suffix: "",
        locator: null,
        suppressAuthor: true,
      });
    });
  });
});
