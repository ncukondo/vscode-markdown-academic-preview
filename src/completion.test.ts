import { describe, it, expect } from "vitest";
import { buildCompletionEntries, type CslEntry } from "./completion";

describe("buildCompletionEntries", () => {
  describe("Step 1: basic structure", () => {
    it("returns CompletionEntry array from CSL entries", () => {
      const entries: CslEntry[] = [
        {
          id: "smith2020",
          author: [{ family: "Smith", given: "John" }],
          title: "A Great Paper",
          issued: { "date-parts": [[2020]] },
        },
      ];

      const result = buildCompletionEntries(entries, { insideBracket: false });

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("smith2020");
    });

    it("returns empty array when no entries", () => {
      const result = buildCompletionEntries([], { insideBracket: false });

      expect(result).toEqual([]);
    });
  });
});
