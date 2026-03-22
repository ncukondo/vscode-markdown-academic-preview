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
});
