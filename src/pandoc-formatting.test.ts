import { describe, it, expect } from "vitest";
import MarkdownIt from "markdown-it";
import { pandocFormattingPlugin } from "./pandoc-formatting";
import { pandocCitationPlugin } from "./plugin";

function createMd(): MarkdownIt {
  const md = new MarkdownIt();
  pandocFormattingPlugin(md);
  return md;
}

function createMdWithCitations(): MarkdownIt {
  const md = new MarkdownIt();
  md.use(pandocCitationPlugin);
  return md;
}

describe("subscript (~text~)", () => {
  it("renders simple subscript", () => {
    const md = createMd();
    expect(md.render("H~2~O")).toContain("<sub>2</sub>");
  });

  it("renders subscript with multiple characters", () => {
    const md = createMd();
    expect(md.render("text~subscript~more")).toContain(
      "<sub>subscript</sub>",
    );
  });

  it("does not render subscript with spaces", () => {
    const md = createMd();
    const result = md.render("~not subscript~");
    expect(result).not.toContain("<sub>");
  });

  it("does not render empty subscript", () => {
    const md = createMd();
    const result = md.render("~~");
    expect(result).not.toContain("<sub>");
  });

  it("does not interfere with strikethrough (~~)", () => {
    const md = createMd();
    const result = md.render("~~strikethrough~~");
    expect(result).toContain("<s>strikethrough</s>");
    expect(result).not.toContain("<sub>");
  });

  it("handles subscript and strikethrough in same text", () => {
    const md = createMd();
    const result = md.render("H~2~O and ~~deleted~~");
    expect(result).toContain("<sub>2</sub>");
    expect(result).toContain("<s>deleted</s>");
  });

  it("handles backslash-escaped tilde", () => {
    const md = createMd();
    const result = md.render("~text\\~more~");
    // The escaped ~ is part of the content, closing ~ is at the end
    expect(result).toContain("<sub>");
  });

  it("does not render with no closing marker", () => {
    const md = createMd();
    const result = md.render("~unclosed");
    expect(result).not.toContain("<sub>");
  });

  it("handles multiple subscripts", () => {
    const md = createMd();
    const result = md.render("H~2~O and CO~2~");
    expect(result).toMatch(/<sub>2<\/sub>.*<sub>2<\/sub>/s);
  });
});

describe("superscript (^text^)", () => {
  it("renders simple superscript", () => {
    const md = createMd();
    expect(md.render("x^2^")).toContain("<sup>2</sup>");
  });

  it("renders superscript with multiple characters", () => {
    const md = createMd();
    expect(md.render("10^10^")).toContain("<sup>10</sup>");
  });

  it("does not render superscript with spaces", () => {
    const md = createMd();
    const result = md.render("^not superscript^");
    expect(result).not.toContain("<sup>");
  });

  it("does not render empty superscript", () => {
    const md = createMd();
    const result = md.render("^^");
    expect(result).not.toContain("<sup>");
  });

  it("does not render with no closing marker", () => {
    const md = createMd();
    const result = md.render("^unclosed");
    expect(result).not.toContain("<sup>");
  });

  it("handles multiple superscripts", () => {
    const md = createMd();
    const result = md.render("x^2^ + y^3^");
    expect(result).toContain("<sup>2</sup>");
    expect(result).toContain("<sup>3</sup>");
  });
});

describe("strikethrough (~~text~~)", () => {
  it("renders strikethrough (built-in markdown-it)", () => {
    const md = createMd();
    expect(md.render("~~deleted~~")).toContain("<s>deleted</s>");
  });

  it("renders strikethrough with spaces inside", () => {
    const md = createMd();
    expect(md.render("~~deleted text~~")).toContain("<s>deleted text</s>");
  });
});

describe("mixed formatting", () => {
  it("handles subscript and superscript together", () => {
    const md = createMd();
    const result = md.render("H~2~O and x^2^");
    expect(result).toContain("<sub>2</sub>");
    expect(result).toContain("<sup>2</sup>");
  });

  it("handles all three: sub, sup, strikethrough", () => {
    const md = createMd();
    const result = md.render("H~2~O, x^2^, ~~old~~");
    expect(result).toContain("<sub>2</sub>");
    expect(result).toContain("<sup>2</sup>");
    expect(result).toContain("<s>old</s>");
  });

  it("works alongside standard markdown formatting", () => {
    const md = createMd();
    const result = md.render("**bold** and H~2~O and *italic*");
    expect(result).toContain("<strong>bold</strong>");
    expect(result).toContain("<sub>2</sub>");
    expect(result).toContain("<em>italic</em>");
  });
});

describe("integration with citation plugin", () => {
  it("does not conflict with bracket citations", () => {
    const md = createMdWithCitations();
    const src = `---
references:
  - id: smith2020
    type: article-journal
    author:
      - family: Smith
        given: John
    title: A Test Article
    issued:
      date-parts: [[2020]]
---

H~2~O and [@smith2020].`;
    const result = md.render(src);
    expect(result).toContain("<sub>2</sub>");
    expect(result).toContain("pandoc-citation");
  });

  it("does not conflict with inline citations", () => {
    const md = createMdWithCitations();
    const src = `---
references:
  - id: smith2020
    type: article-journal
    author:
      - family: Smith
        given: John
    title: A Test Article
    issued:
      date-parts: [[2020]]
---

x^2^ as described by @smith2020.`;
    const result = md.render(src);
    expect(result).toContain("<sup>2</sup>");
    expect(result).toContain("pandoc-citation");
  });
});
