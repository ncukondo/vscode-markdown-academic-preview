import { describe, it, expect } from "vitest";
import {
  buildCompletionEntries,
  isInsideBracket,
  type CslEntry,
} from "./completion";

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

  describe("Step 2: completion item content", () => {
    const entry: CslEntry = {
      id: "smith2020",
      author: [{ family: "Smith", given: "John" }],
      title: "A Great Paper",
      issued: { "date-parts": [[2020]] },
    };

    it("label is the citation key", () => {
      const [item] = buildCompletionEntries([entry], { insideBracket: false });
      expect(item.label).toBe("smith2020");
    });

    it("detail contains author name and year", () => {
      const [item] = buildCompletionEntries([entry], { insideBracket: false });
      expect(item.detail).toBe("Smith (2020)");
    });

    it("documentation contains the title", () => {
      const [item] = buildCompletionEntries([entry], { insideBracket: false });
      expect(item.documentation).toBe("A Great Paper");
    });

    it("filterText contains key, author, and title", () => {
      const [item] = buildCompletionEntries([entry], { insideBracket: false });
      expect(item.filterText).toContain("smith2020");
      expect(item.filterText).toContain("Smith");
      expect(item.filterText).toContain("A Great Paper");
    });

    it("detail shows two authors with &", () => {
      const twoAuthors: CslEntry = {
        id: "doe2021",
        author: [
          { family: "Doe", given: "Jane" },
          { family: "Smith", given: "John" },
        ],
        title: "Two Authors",
        issued: { "date-parts": [[2021]] },
      };
      const [item] = buildCompletionEntries([twoAuthors], { insideBracket: false });
      expect(item.detail).toBe("Doe & Smith (2021)");
    });

    it("detail shows et al. for three or more authors", () => {
      const manyAuthors: CslEntry = {
        id: "team2022",
        author: [
          { family: "Alpha" },
          { family: "Beta" },
          { family: "Gamma" },
        ],
        title: "Many Authors",
        issued: { "date-parts": [[2022]] },
      };
      const [item] = buildCompletionEntries([manyAuthors], { insideBracket: false });
      expect(item.detail).toBe("Alpha et al. (2022)");
    });

    it("detail handles missing author", () => {
      const noAuthor: CslEntry = {
        id: "anon2020",
        title: "Anonymous Work",
        issued: { "date-parts": [[2020]] },
      };
      const [item] = buildCompletionEntries([noAuthor], { insideBracket: false });
      expect(item.detail).toBe("(2020)");
    });

    it("detail handles missing year", () => {
      const noYear: CslEntry = {
        id: "smith_nd",
        author: [{ family: "Smith" }],
        title: "No Date",
      };
      const [item] = buildCompletionEntries([noYear], { insideBracket: false });
      expect(item.detail).toBe("Smith");
    });

    it("documentation is empty string when title is missing", () => {
      const noTitle: CslEntry = {
        id: "key1",
        author: [{ family: "Author" }],
        issued: { "date-parts": [[2020]] },
      };
      const [item] = buildCompletionEntries([noTitle], { insideBracket: false });
      expect(item.documentation).toBe("");
    });
  });

  describe("Step 3: insert text generation", () => {
    const entry: CslEntry = {
      id: "smith2020",
      author: [{ family: "Smith" }],
      title: "Paper",
      issued: { "date-parts": [[2020]] },
    };

    it("inserts only key when inside bracket (e.g. [@|])", () => {
      const [item] = buildCompletionEntries([entry], { insideBracket: true });
      expect(item.insertText).toBe("smith2020");
    });

    it("inserts [@key] when outside bracket", () => {
      const [item] = buildCompletionEntries([entry], { insideBracket: false });
      expect(item.insertText).toBe("[@smith2020]");
    });
  });

  describe("isInsideBracket", () => {
    it("returns true when @ is after [ on the same line", () => {
      expect(isInsideBracket("some text [@", 11)).toBe(true);
    });

    it("returns true when @ is inside [... with preceding content", () => {
      expect(isInsideBracket("[see @doe2021; @", 15)).toBe(true);
    });

    it("returns false when no preceding [", () => {
      expect(isInsideBracket("some text @", 10)).toBe(false);
    });

    it("returns false when [ is closed by ] before cursor", () => {
      expect(isInsideBracket("[@doe2021] @", 11)).toBe(false);
    });

    it("returns true for -@ suppress-author inside bracket", () => {
      expect(isInsideBracket("[-@", 3)).toBe(true);
    });

    it("returns false for -@ suppress-author outside bracket", () => {
      expect(isInsideBracket("text -@", 6)).toBe(false);
    });
  });
});
