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
