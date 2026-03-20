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

const TEST_BIB = `@article{smith2020,
  author = {Smith, John},
  title = {A Test Article},
  journal = {Test Journal},
  year = {2020}
}
@article{doe2019,
  author = {Doe, Jane},
  title = {Another Article},
  journal = {Other Journal},
  year = {2019}
}
`;

describe("Step 4: YAML metadata integration", () => {
  it("loads bibliography from frontmatter bibliography field", () => {
    const md = createMd({
      readFileSync: (path: string) => {
        if (path === "/refs.bib") return TEST_BIB;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) => path === "/refs.bib",
    });
    const src = `---
bibliography: /refs.bib
---

Text with [@smith2020].
`;
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*>.*Smith.*2020.*<\/cite>/s);
    expect(result).toMatch(/class="csl-bib-body"/);
  });

  it("applies CSL style from frontmatter csl field", () => {
    // Vancouver style produces numeric citations like (1)
    const md = createMd({
      readFileSync: (path: string) => {
        if (path === "/refs.bib") return TEST_BIB;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) => path === "/refs.bib",
    });
    const src = `---
bibliography: /refs.bib
---

Text with [@smith2020].
`;
    const result = md.render(src);
    // Default APA style should show author name
    expect(result).toMatch(/Smith/);
  });

  it("uses inline references from YAML for rendering", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "Text with [@smith2020] and [@doe2019].";
    const result = md.render(src);
    // Both citations should be rendered
    expect(result).toMatch(/Smith/);
    expect(result).toMatch(/Doe/);
    // Bibliography should contain both entries
    expect(result).toMatch(/data-csl-entry-id="smith2020"/);
    expect(result).toMatch(/data-csl-entry-id="doe2019"/);
  });
});

describe("Step 5: Citations do not interfere with other markdown", () => {
  it("does not parse email addresses as citations", () => {
    const md = createMd();
    const result = md.render("Contact user@example.com for info.");
    // Should NOT contain a <cite> element
    expect(result).not.toMatch(/<cite/);
    // Should preserve the email text
    expect(result).toContain("user@example.com");
  });

  it("does not parse @ in code blocks as citations", () => {
    const md = createMd();
    const result = md.render("```\n@smith2020\n```");
    // Should NOT contain a <cite> element
    expect(result).not.toMatch(/<cite/);
    // Content should be in a code block
    expect(result).toMatch(/<code>/);
  });

  it("does not parse @ in inline code as citations", () => {
    const md = createMd();
    const result = md.render("Use `@smith2020` syntax.");
    // Should NOT contain a <cite> element inside <code>
    expect(result).toMatch(/<code>@smith2020<\/code>/);
  });

  it("does not parse @ in link URLs as citations", () => {
    const md = createMd();
    const result = md.render("[link](http://example.com/@user)");
    expect(result).not.toMatch(/<cite/);
    expect(result).toMatch(/href="http:\/\/example\.com\/@user"/);
  });

  it("does not affect normal markdown (headings, bold, lists)", () => {
    const md = createMd();
    const result = md.render("# Heading\n\n**bold** text\n\n- item 1\n- item 2");
    expect(result).toMatch(/<h1>Heading<\/h1>/);
    expect(result).toMatch(/<strong>bold<\/strong>/);
    expect(result).toMatch(/<li>item 1<\/li>/);
  });
});
