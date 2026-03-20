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
});
