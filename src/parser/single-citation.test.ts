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
});
