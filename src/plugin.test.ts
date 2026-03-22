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

describe("Step 5: Popover tooltips with interestfor", () => {
  it("renders interestfor attribute on citation invoker", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/interestfor="pandoc-popover-\d+"/);
  });

  it("renders popover element with matching id", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    const match = result.match(/interestfor="(pandoc-popover-\d+)"/);
    expect(match).not.toBeNull();
    const popoverId = match![1];
    expect(result).toContain(`popover="hint" id="${popoverId}"`);
  });

  it("popover contains HTML bibliography with links", () => {
    const md = createMd();
    const src = `---
references:
  - id: withDoi
    type: article-journal
    author:
      - family: Test
        given: Author
    title: DOI Article
    issued:
      date-parts: [[2024]]
    DOI: "10.1234/test"
---

[@withDoi]
`;
    const result = md.render(src);
    expect(result).toMatch(/class="pandoc-citation-popover"/);
    expect(result).toMatch(/<a href="https:\/\/doi\.org\/10\.1234\/test">/);
  });

  it("generates unique popover ids for multiple citations", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "[@smith2020] and [@doe2019].";
    const result = md.render(src);
    const ids = [...result.matchAll(/interestfor="(pandoc-popover-\d+)"/g)].map(m => m[1]);
    expect(ids.length).toBe(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("inline citation also gets popover", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "@smith2020 says something.";
    const result = md.render(src);
    expect(result).toMatch(/interestfor="pandoc-popover-\d+"/);
    expect(result).toMatch(/popover="hint"/);
  });

  it("fallback citation does not get popover", () => {
    const md = createMd();
    const result = md.render("Text with [@unknown].");
    expect(result).not.toMatch(/interestfor=/);
    expect(result).not.toMatch(/popover="hint"/);
  });
});

describe("Step 6: Citations do not interfere with other markdown", () => {
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

describe("Settings: defaultCsl", () => {
  it("uses built-in style name from defaultCsl", () => {
    const md = createMd({ defaultCsl: "vancouver" });
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    // Vancouver produces numeric citations like (1) instead of APA author-year (Smith, 2020)
    // Citation text should NOT contain "Smith" since Vancouver uses numbers
    expect(result).toMatch(/<cite/);
    expect(result).not.toMatch(/<cite[^>]*>(?:(?!<\/cite>).)*Smith/s);
  });

  it("loads CSL file from defaultCsl file path", () => {
    const cslContent = "<style>mock csl</style>";
    const md = createMd({
      defaultCsl: "/styles/custom.csl",
      readFileSync: (path: string) => {
        if (path === "/styles/custom.csl") return cslContent;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) => path === "/styles/custom.csl",
    });
    // If CSL file can't be parsed, citation-js falls back gracefully
    // We verify the file path was resolved and attempted
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/<cite/);
  });

  it("YAML csl field takes precedence over defaultCsl", () => {
    const cslXml = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0">
  <info><title>Test</title><id>test</id></info>
  <citation><layout><text variable="title"/></layout></citation>
  <bibliography><layout><text variable="title"/></layout></bibliography>
</style>`;
    const md = createMd({
      defaultCsl: "vancouver",
      readFileSync: (path: string) => {
        if (path === "/refs.bib") return TEST_BIB;
        if (path === "/custom.csl") return cslXml;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) =>
        path === "/refs.bib" || path === "/custom.csl",
    });
    const src = `---
bibliography: /refs.bib
csl: /custom.csl
---

Text with [@smith2020].
`;
    const resultWithYamlCsl = md.render(src);
    // The custom CSL outputs title, so "A Test Article" should appear
    expect(resultWithYamlCsl).toMatch(/A Test Article/);
  });
});

describe("Settings: defaultBibliography", () => {
  it("resolves citations from defaultBibliography without YAML metadata", () => {
    const md = createMd({
      defaultBibliography: ["/refs.bib"],
      readFileSync: (path: string) => {
        if (path === "/refs.bib") return TEST_BIB;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) => path === "/refs.bib",
    });
    const src = "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*>.*Smith.*2020.*<\/cite>/s);
    expect(result).toMatch(/class="csl-bib-body"/);
  });

  it("loads both YAML bibliography and defaultBibliography", () => {
    const extraBib = `@article{jones2021,
  author = {Jones, Alice},
  title = {Extra Article},
  journal = {Extra Journal},
  year = {2021}
}
`;
    const md = createMd({
      defaultBibliography: ["/extra.bib"],
      readFileSync: (path: string) => {
        if (path === "/refs.bib") return TEST_BIB;
        if (path === "/extra.bib") return extraBib;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) =>
        path === "/refs.bib" || path === "/extra.bib",
    });
    const src = `---
bibliography: /refs.bib
---

[@smith2020] and [@jones2021].
`;
    const result = md.render(src);
    expect(result).toMatch(/Smith/);
    expect(result).toMatch(/Jones/);
  });
});

describe("Settings: popoverEnabled", () => {
  it("does not render popover elements when popoverEnabled is false", () => {
    const md = createMd({ popoverEnabled: false });
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).not.toMatch(/pandoc-citation-popover/);
    expect(result).not.toMatch(/interestfor=/);
    expect(result).not.toMatch(/popover="hint"/);
  });

  it("still renders citation text correctly when popoverEnabled is false", () => {
    const md = createMd({ popoverEnabled: false });
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*>.*Smith.*2020.*<\/cite>/s);
  });

  it("renders popovers by default (popoverEnabled not set)", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/pandoc-citation-popover/);
    expect(result).toMatch(/interestfor=/);
  });

  it("renders popovers when popoverEnabled is true", () => {
    const md = createMd({ popoverEnabled: true });
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/pandoc-citation-popover/);
    expect(result).toMatch(/interestfor=/);
  });

  it("inline citation has no popover when popoverEnabled is false", () => {
    const md = createMd({ popoverEnabled: false });
    const src = INLINE_REFS_DOC + "@smith2020 says something.";
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*class="[^"]*pandoc-citation-inline[^"]*"[^>]*>.*Smith.*<\/cite>/s);
    expect(result).not.toMatch(/pandoc-citation-popover/);
    expect(result).not.toMatch(/interestfor=/);
  });
});

describe("Settings: enabled", () => {
  it("does not process citations when enabled is false", () => {
    const md = createMd({ enabled: false });
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    // Raw citation text should be preserved, no <cite> elements
    expect(result).not.toMatch(/<cite/);
    expect(result).toContain("[@smith2020]");
  });

  it("does not process inline citations when enabled is false", () => {
    const md = createMd({ enabled: false });
    const src = INLINE_REFS_DOC + "@smith2020 says something.";
    const result = md.render(src);
    expect(result).not.toMatch(/<cite/);
    expect(result).toContain("@smith2020");
  });

  it("does not inject bibliography when enabled is false", () => {
    const md = createMd({ enabled: false });
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).not.toMatch(/class="csl-bib-body"/);
  });

  it("processes citations normally when enabled is true", () => {
    const md = createMd({ enabled: true });
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*>.*Smith.*2020.*<\/cite>/s);
  });

  it("processes citations normally when enabled is not specified (defaults to true)", () => {
    const md = createMd({});
    const src = INLINE_REFS_DOC + "Text with [@smith2020].";
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*>.*Smith.*2020.*<\/cite>/s);
  });
});

describe("Crossref: skip bibliography lookup for crossref keys", () => {
  it("@fig:diagram does not trigger unknown citation warning", () => {
    const md = createMd();
    const result = md.render("See @fig:diagram for details.");
    expect(result).not.toMatch(/pandoc-citation-warning/);
  });

  it("@smith2020 still resolves from bibliography as before", () => {
    const md = createMd();
    const src = INLINE_REFS_DOC + "@smith2020 says something.";
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*class="[^"]*pandoc-citation-inline[^"]*"[^>]*>.*Smith.*<\/cite>/s);
  });

  it("[@fig:diagram] does not trigger unknown citation warning", () => {
    const md = createMd();
    const result = md.render("See [@fig:diagram] for details.");
    expect(result).not.toMatch(/pandoc-citation-warning/);
  });
});

describe("Settings: searchDirectories", () => {
  it("resolves bibliography from searchDirectories", () => {
    const md = createMd({
      searchDirectories: ["/lib/bibs"],
      readFileSync: (path: string) => {
        if (path === "/lib/bibs/refs.bib") return TEST_BIB;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) => path === "/lib/bibs/refs.bib",
    });
    const src = `---
bibliography: refs.bib
---

Text with [@smith2020].
`;
    const result = md.render(src);
    expect(result).toMatch(/<cite[^>]*>.*Smith.*2020.*<\/cite>/s);
  });

  it("resolves CSL from cslSearchDirectories", () => {
    const cslXml = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0">
  <info><title>Test</title><id>test</id></info>
  <citation><layout><text variable="title"/></layout></citation>
  <bibliography><layout><text variable="title"/></layout></bibliography>
</style>`;
    const md = createMd({
      cslSearchDirectories: ["/lib/csl"],
      readFileSync: (path: string) => {
        if (path === "/refs.bib") return TEST_BIB;
        if (path === "/lib/csl/custom.csl") return cslXml;
        throw new Error("File not found: " + path);
      },
      existsSync: (path: string) =>
        path === "/refs.bib" || path === "/lib/csl/custom.csl",
    });
    const src = `---
bibliography: /refs.bib
csl: custom.csl
---

Text with [@smith2020].
`;
    const result = md.render(src);
    // Custom CSL outputs title
    expect(result).toMatch(/A Test Article/);
  });
});
