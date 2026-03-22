import { describe, it, expect } from "vitest";
import { resolveDocumentBibliography } from "./document-bibliography";

const BIBTEX_CONTENT = `@article{smith2020,
  author = {Smith, John},
  title = {A Great Paper},
  journal = {Journal of Testing},
  year = {2020}
}`;

describe("resolveDocumentBibliography", () => {
  it("returns BibliographyData from document with YAML bibliography field", () => {
    const documentText = `---
bibliography: refs.bib
---

Some text with @smith2020 citation.
`;
    const files: Record<string, string> = {
      "/doc/refs.bib": BIBTEX_CONTENT,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
    });

    expect(result.bibData.ids).toContain("smith2020");
    expect(result.bibData.cite).toBeDefined();
  });

  it("returns empty BibliographyData when no bibliography is specified", () => {
    const result = resolveDocumentBibliography({
      documentText: "No metadata here.",
      documentPath: "/doc/paper.md",
      readFile: () => "",
      exists: () => false,
    });

    expect(result.bibData.ids).toEqual([]);
  });

  it("resolves bibliography paths from YAML bibliography array", () => {
    const documentText = `---
bibliography:
  - refs1.bib
  - refs2.bib
---

Text.
`;
    const bibtex2 = `@article{doe2021,
  author = {Doe, Jane},
  title = {Another Paper},
  journal = {Testing Journal},
  year = {2021}
}`;
    const files: Record<string, string> = {
      "/doc/refs1.bib": BIBTEX_CONTENT,
      "/doc/refs2.bib": bibtex2,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
    });

    expect(result.bibData.ids).toContain("smith2020");
    expect(result.bibData.ids).toContain("doe2021");
  });

  it("merges inline references from YAML references field", () => {
    const documentText = `---
bibliography: refs.bib
references:
  - id: inline2022
    type: article-journal
    title: Inline Reference
    author:
      - family: Test
        given: Author
    issued:
      date-parts: [[2022]]
---

Text.
`;
    const files: Record<string, string> = {
      "/doc/refs.bib": BIBTEX_CONTENT,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
    });

    expect(result.bibData.ids).toContain("smith2020");
    expect(result.bibData.ids).toContain("inline2022");
  });

  it("inline references override file entries with same id", () => {
    const documentText = `---
bibliography: refs.bib
references:
  - id: smith2020
    type: article-journal
    title: Overridden Title
    author:
      - family: Smith
        given: John
    issued:
      date-parts: [[2020]]
---

Text.
`;
    const files: Record<string, string> = {
      "/doc/refs.bib": BIBTEX_CONTENT,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
    });

    expect(result.bibData.ids).toContain("smith2020");
    // The inline reference should have overridden the file entry
    const entry = result.bibData.cite.data.find(
      (e: { id: string }) => e.id === "smith2020",
    );
    expect(entry.title).toBe("Overridden Title");
  });
});
