import { describe, it, expect } from "vitest";
import { loadBibliography, loadBibliographySync } from "./bibliography";

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
      const entry = result.entriesById.get("smith2020") as
        | { title?: string }
        | undefined;
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

  describe("Duplicate IDs across multiple files", () => {
    it("deduplicates entries with the same id, keeping the first occurrence", async () => {
      const bib1 = `@article{smith2020, author={Smith, A}, title={First File Title}, journal={J}, year={2020}}`;
      const bib2 = `@article{smith2020, author={Smith, B}, title={Second File Title}, journal={J}, year={2021}}`;
      const files: Record<string, string> = {
        "/refs1.bib": bib1,
        "/refs2.bib": bib2,
      };
      const result = await loadBibliography({
        bibliographyPaths: ["/refs1.bib", "/refs2.bib"],
        inlineReferences: [],
        readFile: async (path) => files[path],
      });

      expect(result.ids).toHaveLength(1);
      expect(result.ids).toContain("smith2020");
      // First file wins (consistent with Pandoc)
      const entry = result.entriesById.get("smith2020") as
        | { title?: string }
        | undefined;
      expect(entry?.title).toBe("First File Title");
    });

    it("keeps unique entries from both files while deduplicating shared ids", async () => {
      const bib1 = `@article{shared, author={A}, title={From First}, journal={J}, year={2020}}
@article{only1, author={B}, title={Only In First}, journal={J}, year={2020}}`;
      const bib2 = `@article{shared, author={C}, title={From Second}, journal={J}, year={2021}}
@article{only2, author={D}, title={Only In Second}, journal={J}, year={2021}}`;
      const files: Record<string, string> = {
        "/refs1.bib": bib1,
        "/refs2.bib": bib2,
      };
      const result = await loadBibliography({
        bibliographyPaths: ["/refs1.bib", "/refs2.bib"],
        inlineReferences: [],
        readFile: async (path) => files[path],
      });

      expect(result.ids).toHaveLength(3);
      expect(result.ids).toContain("shared");
      expect(result.ids).toContain("only1");
      expect(result.ids).toContain("only2");
      const sharedEntry = result.entriesById.get("shared") as
        | { title?: string }
        | undefined;
      expect(sharedEntry?.title).toBe("From First");
    });

    it("inline reference still overrides deduplicated file entry", async () => {
      const bib1 = `@article{smith2020, author={Smith, A}, title={File One}, journal={J}, year={2020}}`;
      const bib2 = `@article{smith2020, author={Smith, B}, title={File Two}, journal={J}, year={2021}}`;
      const files: Record<string, string> = {
        "/refs1.bib": bib1,
        "/refs2.bib": bib2,
      };
      const result = await loadBibliography({
        bibliographyPaths: ["/refs1.bib", "/refs2.bib"],
        inlineReferences: [
          {
            id: "smith2020",
            type: "article-journal",
            title: "Inline Override",
            author: [{ family: "Smith", given: "A" }],
          },
        ],
        readFile: async (path) => files[path],
      });

      expect(result.ids).toHaveLength(1);
      const entry = result.entriesById.get("smith2020") as
        | { title?: string }
        | undefined;
      expect(entry?.title).toBe("Inline Override");
    });
  });

  describe("entriesById index", () => {
    it("exposes an O(1) entriesById Map mirroring cite.data", async () => {
      const cslJson = JSON.stringify([
        {
          id: "doe2022",
          type: "article-journal",
          title: "Article",
          author: [{ family: "Doe", given: "Jane" }],
          issued: { "date-parts": [[2022]] },
        },
        {
          id: "lee2023",
          type: "book",
          title: "A Book",
          author: [{ family: "Lee", given: "Bob" }],
          issued: { "date-parts": [[2023]] },
        },
      ]);
      const result = await loadBibliography({
        bibliographyPaths: ["/refs.json"],
        inlineReferences: [],
        readFile: async () => cslJson,
      });

      expect(result.entriesById).toBeInstanceOf(Map);
      expect(result.entriesById.size).toBe(2);
      expect(result.entriesById.has("doe2022")).toBe(true);
      expect(result.entriesById.has("lee2023")).toBe(true);
      expect(result.entriesById.has("missing")).toBe(false);

      const doe = result.entriesById.get("doe2022") as { id: string; title?: string };
      expect(doe.id).toBe("doe2022");
      expect(doe.title).toBe("Article");
    });

    it("entriesById reflects dedup (first wins)", async () => {
      const bib1 = `@article{shared, author={A}, title={From First}, journal={J}, year={2020}}`;
      const bib2 = `@article{shared, author={B}, title={From Second}, journal={J}, year={2021}}`;
      const files: Record<string, string> = {
        "/refs1.bib": bib1,
        "/refs2.bib": bib2,
      };
      const result = await loadBibliography({
        bibliographyPaths: ["/refs1.bib", "/refs2.bib"],
        inlineReferences: [],
        readFile: async (path) => files[path],
      });

      expect(result.entriesById.size).toBe(1);
      const entry = result.entriesById.get("shared") as { title?: string };
      expect(entry.title).toBe("From First");
    });

    it("entriesById reflects inline reference override", async () => {
      const bibContent = `@article{smith2020, author={Smith, John}, title={Original}, journal={J}, year={2020}}`;
      const result = await loadBibliography({
        bibliographyPaths: ["/refs.bib"],
        inlineReferences: [
          {
            id: "smith2020",
            type: "article-journal",
            title: "Overridden",
            author: [{ family: "Smith", given: "John" }],
          },
        ],
        readFile: async () => bibContent,
      });

      expect(result.entriesById.size).toBe(1);
      const entry = result.entriesById.get("smith2020") as { title?: string };
      expect(entry.title).toBe("Overridden");
    });

    it("loadBibliographySync also exposes entriesById", () => {
      const cslJson = JSON.stringify([
        {
          id: "sync1",
          type: "article-journal",
          title: "Sync Article",
        },
      ]);
      const result = loadBibliographySync({
        bibliographyPaths: ["/refs.json"],
        inlineReferences: [],
        readFile: () => cslJson,
      });

      expect(result.entriesById).toBeInstanceOf(Map);
      expect(result.entriesById.has("sync1")).toBe(true);
    });

    it("CSL-JSON entries skip citation-js normalization (raw reference preserved)", () => {
      // The exact same object passed in via JSON should land in entriesById.
      // citation-js's cite.add() would clone+normalize the entry; our fast path
      // for CSL-JSON files should not.
      const entry = {
        id: "raw1",
        type: "article-journal",
        title: "Raw",
        // A field that citation-js does not understand — it should still be present.
        __markdown_academic_preview_marker: "kept",
      };
      const cslJson = JSON.stringify([entry]);
      const result = loadBibliographySync({
        bibliographyPaths: ["/refs.json"],
        inlineReferences: [],
        readFile: () => cslJson,
      });
      const got = result.entriesById.get("raw1") as
        | { __markdown_academic_preview_marker?: string; title?: string }
        | undefined;
      expect(got).toBeDefined();
      expect(got?.__markdown_academic_preview_marker).toBe("kept");
      expect(got?.title).toBe("Raw");
    });

    it("accepts Pandoc-style { references: [...] } wrapper in JSON", () => {
      const wrapped = JSON.stringify({
        references: [
          { id: "wrapped1", type: "article-journal", title: "Wrapped A" },
          { id: "wrapped2", type: "book", title: "Wrapped B" },
        ],
      });
      const result = loadBibliographySync({
        bibliographyPaths: ["/refs.json"],
        inlineReferences: [],
        readFile: () => wrapped,
      });
      expect(result.entriesById.size).toBe(2);
      expect(result.entriesById.has("wrapped1")).toBe(true);
      expect(result.entriesById.has("wrapped2")).toBe(true);
    });

    it("accepts Pandoc-style { references: [...] } wrapper in YAML", () => {
      const yaml = `references:\n  - id: y1\n    type: article-journal\n    title: Y1\n  - id: y2\n    type: book\n    title: Y2\n`;
      const result = loadBibliographySync({
        bibliographyPaths: ["/refs.yaml"],
        inlineReferences: [],
        readFile: () => yaml,
      });
      expect(result.entriesById.size).toBe(2);
      expect(result.entriesById.has("y1")).toBe(true);
      expect(result.entriesById.has("y2")).toBe(true);
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
      expect(result.entriesById).toBeInstanceOf(Map);
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
      expect(result.entriesById.size).toBe(0);
    });

    it("returns empty BibliographyData for empty bibliography list and no inline refs", async () => {
      const result = await loadBibliography({
        bibliographyPaths: [],
        inlineReferences: [],
        readFile: async () => "",
      });

      expect(result.ids).toHaveLength(0);
      expect(result.entriesById.size).toBe(0);
    });
  });
});
