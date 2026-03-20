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

  // Step 4: Locator
  describe("locator", () => {
    it('parses "@smith2020, p. 10" with page locator', () => {
      expect(parseSingleCitation("@smith2020, p. 10")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: "",
        locator: { label: "page", value: "10" },
        suppressAuthor: false,
      });
    });

    it('parses "@smith2020, chap. 3" with chapter locator', () => {
      expect(parseSingleCitation("@smith2020, chap. 3")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: "",
        locator: { label: "chapter", value: "3" },
        suppressAuthor: false,
      });
    });

    it('parses "@smith2020, 15" with bare number as page locator', () => {
      expect(parseSingleCitation("@smith2020, 15")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: "",
        locator: { label: "page", value: "15" },
        suppressAuthor: false,
      });
    });
  });

  // Step 5: Suffix text
  describe("suffix text", () => {
    it('parses "@smith2020, p. 10, and *passim*" with locator and suffix', () => {
      expect(parseSingleCitation("@smith2020, p. 10, and *passim*")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: ", and *passim*",
        locator: { label: "page", value: "10" },
        suppressAuthor: false,
      });
    });

    it('parses "@smith2020, see also" with no locator, all as suffix', () => {
      expect(parseSingleCitation("@smith2020, see also")).toEqual({
        id: "smith2020",
        prefix: "",
        suffix: ", see also",
        locator: null,
        suppressAuthor: false,
      });
    });
  });
});
