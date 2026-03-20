import { describe, it, expect } from "vitest";
import MarkdownIt from "markdown-it";
import { pandocCitationPlugin } from "./plugin";
import type { PluginOptions } from "./plugin";

const INLINE_REFS_DOC = `---
references:
  - id: smith2020
    type: article-journal
    author:
      - family: Smith
        given: John
    title: A Test Article
    container-title: Test Journal
    issued:
      date-parts: [[2020]]
  - id: doe2019
    type: article-journal
    author:
      - family: Doe
        given: Jane
    title: Another Article
    container-title: Other Journal
    issued:
      date-parts: [[2019]]
---

`;

function createMd(options?: PluginOptions): MarkdownIt {
  const md = new MarkdownIt();
  md.use(pandocCitationPlugin, options);
  return md;
}

describe("Step 1: Bracket citation rendering", () => {
  it("renders a bracket citation with loaded bibliography", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    // Should contain a <cite> element with formatted citation text
    expect(result).toMatch(/<cite[^>]*>.*Smith.*2020.*<\/cite>/s);
  });

  it("renders fallback for unknown citation key", () => {
    const md = createMd();
    const result = md.render("Text with [@unknown].");
    // Should contain a cite element with a warning class and the unknown key
    expect(result).toMatch(/<cite[^>]*class="[^"]*warning[^"]*"[^>]*>/);
    expect(result).toContain("unknown");
  });
});

describe("Step 2: Inline citation rendering", () => {
  it("renders inline citation with loaded bibliography", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "@smith2020 says something.";
    const result = md.render(src);
    // Should contain a <cite> with inline class and author-style text
    expect(result).toMatch(
      /<cite[^>]*class="[^"]*pandoc-citation-inline[^"]*"[^>]*>.*Smith.*2020.*<\/cite>/s,
    );
  });

  it("renders inline citation with locator", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "@smith2020 [p. 10] says something.";
    const result = md.render(src);
    // Should contain both the author citation and locator info
    expect(result).toMatch(/<cite[^>]*>.*Smith.*<\/cite>/s);
    expect(result).toMatch(/10/);
  });
});

describe("Step 3: Bibliography injection", () => {
  it("appends bibliography section after document with citations", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    // Should contain a bibliography section with csl-bib-body class
    expect(result).toMatch(/class="csl-bib-body"/);
    // Bibliography should contain the cited entry
    expect(result).toMatch(/data-csl-entry-id="smith2020"/);
  });

  it("includes all entries when nocite: @* is specified", () => {
    const md = createMd();
    const src = `---
references:
  - id: smith2020
    type: article-journal
    author:
      - family: Smith
        given: John
    title: A Test Article
    container-title: Test Journal
    issued:
      date-parts: [[2020]]
  - id: doe2019
    type: article-journal
    author:
      - family: Doe
        given: Jane
    title: Another Article
    container-title: Other Journal
    issued:
      date-parts: [[2019]]
nocite: |
  @*
---

Some text without citations.
`;
    const result = md.render(src);
    // Both entries should be in bibliography even though none are cited
    expect(result).toMatch(/data-csl-entry-id="smith2020"/);
    expect(result).toMatch(/data-csl-entry-id="doe2019"/);
  });

  it("does not inject bibliography when no citations and no nocite", () => {
    const md = createMd();
    const src = `---
references:
  - id: smith2020
    type: article-journal
    author:
      - family: Smith
        given: John
    title: A Test Article
    container-title: Test Journal
    issued:
      date-parts: [[2020]]
---

Some text without any citations.
`;
    const result = md.render(src);
    // No bibliography section should appear
    expect(result).not.toMatch(/class="csl-bib-body"/);
  });
});
