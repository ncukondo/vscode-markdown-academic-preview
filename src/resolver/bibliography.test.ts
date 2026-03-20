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

  describe("Step 3: Load CSL YAML (.yaml) file", () => {
    it("parses CSL YAML and extracts correct ids", async () => {
      const cslYaml = `- id: kim2020
  type: article-journal
  title: YAML Article
  author:
    - family: Kim
      given: Sue
  issued:
    date-parts:
      - [2020]
`;
      const result = await loadBibliography({
        bibliographyPaths: ["/path/to/refs.yaml"],
        inlineReferences: [],
        readFile: async () => cslYaml,
      });

      expect(result.ids).toContain("kim2020");
      expect(result.ids).toHaveLength(1);
    });
  });

  describe("Step 4: Merge inline references", () => {
    it("inline references added to cite instance with ids available", async () => {
      const result = await loadBibliography({
        bibliographyPaths: [],
        inlineReferences: [
          {
            id: "inline2020",
            type: "article-journal",
            title: "Inline Article",
            author: [{ family: "Inline", given: "A" }],
          },
        ],
        readFile: async () => "",
      });

      expect(result.ids).toContain("inline2020");
      expect(result.ids).toHaveLength(1);
    });

    it("inline reference with same id as .bib entry overrides it", async () => {
      const bibContent = `@article{smith2020,
  author = {Smith, John},
  title = {Original Title},
  journal = {J},
  year = {2020}
}`;
      const result = await loadBibliography({
        bibliographyPaths: ["/path/to/refs.bib"],
        inlineReferences: [
          {
            id: "smith2020",
            type: "article-journal",
            title: "Overridden Title",
            author: [{ family: "Smith", given: "John" }],
          },
        ],
        readFile: async () => bibContent,
      });

      expect(result.ids).toContain("smith2020");
      // Should only have one entry, not duplicated
      expect(result.ids).toHaveLength(1);
      // The inline version should win
      const entry = result.cite.data.find(
        (d: { id: string }) => d.id === "smith2020",
      );
      expect(entry?.title).toBe("Overridden Title");
    });
  });

  describe("Step 5: Multiple bibliography files", () => {
    it("merges ids from two .bib files", async () => {
      const bib1 = `@article{alpha, author={A}, title={T1}, journal={J}, year={2020}}`;
      const bib2 = `@article{beta, author={B}, title={T2}, journal={J}, year={2021}}`;
      const files: Record<string, string> = {
        "/refs1.bib": bib1,
        "/refs2.bib": bib2,
      };
      const result = await loadBibliography({
        bibliographyPaths: ["/refs1.bib", "/refs2.bib"],
        inlineReferences: [],
        readFile: async (path) => files[path],
      });

      expect(result.ids).toContain("alpha");
      expect(result.ids).toContain("beta");
      expect(result.ids).toHaveLength(2);
    });

    it("merges ids from mixed formats (.bib + .json)", async () => {
      const bibContent = `@article{fromBib, author={A}, title={T1}, journal={J}, year={2020}}`;
      const jsonContent = JSON.stringify([
        {
          id: "fromJson",
          type: "book",
          title: "JSON Book",
          author: [{ family: "B" }],
        },
      ]);
      const files: Record<string, string> = {
        "/refs.bib": bibContent,
        "/refs.json": jsonContent,
      };
      const result = await loadBibliography({
        bibliographyPaths: ["/refs.bib", "/refs.json"],
        inlineReferences: [],
        readFile: async (path) => files[path],
      });

      expect(result.ids).toContain("fromBib");
      expect(result.ids).toContain("fromJson");
      expect(result.ids).toHaveLength(2);
    });
  });

  describe("Step 6: Error handling", () => {
    it("returns empty result for invalid BibTeX", async () => {
      const result = await loadBibliography({
        bibliographyPaths: ["/bad.bib"],
        inlineReferences: [],
        readFile: async () => "this is not valid bibtex {{{",
      });

      // Should not throw, returns empty or partial
      expect(result.ids).toBeDefined();
      expect(result.cite).toBeDefined();
    });

    it("handles file read failure gracefully", async () => {
      const result = await loadBibliography({
        bibliographyPaths: ["/missing.bib"],
        inlineReferences: [],
        readFile: async () => {
          throw new Error("ENOENT: file not found");
        },
      });

      // Should not throw, returns empty
      expect(result.ids).toHaveLength(0);
      expect(result.cite).toBeDefined();
    });

    it("returns empty BibliographyData for empty bibliography list and no inline refs", async () => {
      const result = await loadBibliography({
        bibliographyPaths: [],
        inlineReferences: [],
        readFile: async () => "",
      });

      expect(result.ids).toHaveLength(0);
      expect(result.cite.data).toHaveLength(0);
    });
  });
});
