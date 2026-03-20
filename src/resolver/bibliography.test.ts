import { describe, it, expect } from "vitest";
import { loadBibliography } from "./bibliography";

describe("loadBibliography", () => {
  describe("Step 1: Load BibTeX (.bib) file", () => {
    it("parses a simple .bib string with one entry and extracts correct id", async () => {
      const bibContent = `@article{smith2020,
  author = {Smith, John},
  title = {A Test Article},
  journal = {Test Journal},
  year = {2020}
}`;
      const result = await loadBibliography({
        bibliographyPaths: ["/path/to/refs.bib"],
        inlineReferences: [],
        readFile: async () => bibContent,
      });

      expect(result.ids).toContain("smith2020");
      expect(result.ids).toHaveLength(1);
    });

    it("parses .bib with multiple entries and all ids are available", async () => {
      const bibContent = `@article{smith2020,
  author = {Smith, John},
  title = {Article One},
  journal = {J1},
  year = {2020}
}

@book{jones2021,
  author = {Jones, Alice},
  title = {A Book},
  publisher = {Press},
  year = {2021}
}`;
      const result = await loadBibliography({
        bibliographyPaths: ["/path/to/refs.bib"],
        inlineReferences: [],
        readFile: async () => bibContent,
      });

      expect(result.ids).toContain("smith2020");
      expect(result.ids).toContain("jones2021");
      expect(result.ids).toHaveLength(2);
    });
  });

  describe("Step 2: Load CSL JSON (.json) file", () => {
    it("parses CSL JSON array with one entry and extracts correct id", async () => {
      const cslJson = JSON.stringify([
        {
          id: "doe2022",
          type: "article-journal",
          author: [{ family: "Doe", given: "Jane" }],
          title: "CSL JSON Article",
          issued: { "date-parts": [[2022]] },
        },
      ]);
      const result = await loadBibliography({
        bibliographyPaths: ["/path/to/refs.json"],
        inlineReferences: [],
        readFile: async () => cslJson,
      });

      expect(result.ids).toContain("doe2022");
      expect(result.ids).toHaveLength(1);
    });

    it("parses CSL JSON with multiple entries and all ids available", async () => {
      const cslJson = JSON.stringify([
        {
          id: "doe2022",
          type: "article-journal",
          author: [{ family: "Doe", given: "Jane" }],
          title: "Article",
          issued: { "date-parts": [[2022]] },
        },
        {
          id: "lee2023",
          type: "book",
          author: [{ family: "Lee", given: "Bob" }],
          title: "A Book",
          issued: { "date-parts": [[2023]] },
        },
      ]);
      const result = await loadBibliography({
        bibliographyPaths: ["/path/to/refs.json"],
        inlineReferences: [],
        readFile: async () => cslJson,
      });

      expect(result.ids).toContain("doe2022");
      expect(result.ids).toContain("lee2023");
      expect(result.ids).toHaveLength(2);
    });
  });
});
