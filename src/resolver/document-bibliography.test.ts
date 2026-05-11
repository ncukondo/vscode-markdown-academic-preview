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
    expect(result.bibData.entriesById.has("smith2020")).toBe(true);
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
    const entry = result.bibData.entriesById.get("smith2020") as
      | { title?: string }
      | undefined;
    expect(entry?.title).toBe("Overridden Title");
  });

  it("loads defaultBibliography files in addition to YAML bibliography", () => {
    const documentText = `---
bibliography: refs.bib
---

Text.
`;
    const bibtexDefault = `@article{default2023,
  author = {Default, Author},
  title = {Default Paper},
  journal = {Default Journal},
  year = {2023}
}`;
    const files: Record<string, string> = {
      "/doc/refs.bib": BIBTEX_CONTENT,
      "/workspace/default.bib": bibtexDefault,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
      workspaceRoot: "/workspace",
      defaultBibliography: ["default.bib"],
    });

    expect(result.bibData.ids).toContain("smith2020");
    expect(result.bibData.ids).toContain("default2023");
  });

  it("does not duplicate entries when defaultBibliography overlaps with YAML bibliography", () => {
    const documentText = `---
bibliography: refs.bib
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
      defaultBibliography: ["/doc/refs.bib"],
    });

    // Should not duplicate smith2020
    const smithCount = result.bibData.ids.filter((id: string) => id === "smith2020").length;
    expect(smithCount).toBe(1);
  });

  it("resolves bibliography paths using searchDirectories", () => {
    const documentText = `---
bibliography: refs.bib
---

Text.
`;
    const files: Record<string, string> = {
      "/shared/bibs/refs.bib": BIBTEX_CONTENT,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
      searchDirectories: ["/shared/bibs"],
    });

    expect(result.bibData.ids).toContain("smith2020");
  });

  it("resolves CSL style from YAML csl field", () => {
    const documentText = `---
bibliography: refs.bib
csl: custom.csl
---

Text.
`;
    const cslContent = "<style>custom CSL</style>";
    const files: Record<string, string> = {
      "/doc/refs.bib": BIBTEX_CONTENT,
      "/doc/custom.csl": cslContent,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
    });

    expect(result.cslStyle).toBe(cslContent);
  });

  it("falls back to defaultCsl when YAML csl is not specified", () => {
    const documentText = `---
bibliography: refs.bib
---

Text.
`;
    const defaultCslContent = "<style>default CSL</style>";
    const files: Record<string, string> = {
      "/doc/refs.bib": BIBTEX_CONTENT,
      "/workspace/default.csl": defaultCslContent,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => {
        if (!existingFiles.has(p)) throw new Error("not found");
        return files[p];
      },
      exists: (p: string) => existingFiles.has(p),
      workspaceRoot: "/workspace",
      defaultCsl: "default.csl",
    });

    expect(result.cslStyle).toBe(defaultCslContent);
  });

  it("YAML csl takes precedence over defaultCsl", () => {
    const documentText = `---
bibliography: refs.bib
csl: custom.csl
---

Text.
`;
    const customCsl = "<style>custom</style>";
    const defaultCsl = "<style>default</style>";
    const files: Record<string, string> = {
      "/doc/refs.bib": BIBTEX_CONTENT,
      "/doc/custom.csl": customCsl,
      "/workspace/default.csl": defaultCsl,
    };
    const existingFiles = new Set(Object.keys(files));

    const result = resolveDocumentBibliography({
      documentText,
      documentPath: "/doc/paper.md",
      readFile: (p: string) => files[p] ?? "",
      exists: (p: string) => existingFiles.has(p),
      workspaceRoot: "/workspace",
      defaultCsl: "default.csl",
    });

    expect(result.cslStyle).toBe(customCsl);
  });

  it("returns null cslStyle when no CSL is configured", () => {
    const documentText = `---
bibliography: refs.bib
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

    expect(result.cslStyle).toBeNull();
  });
});
