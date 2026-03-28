import { describe, it, expect } from "vitest";
import {
  findInlineFootnoteAtPosition,
  findFootnoteRefAtPosition,
  findFootnoteDefinitionInText,
} from "./footnote-parser";

describe("findInlineFootnoteAtPosition", () => {
  it("returns content when cursor is inside ^[...]", () => {
    const line = "Text^[an inline note].";
    // cursor on ^
    expect(findInlineFootnoteAtPosition(line, 4)).toBe("an inline note");
    // cursor on [
    expect(findInlineFootnoteAtPosition(line, 5)).toBe("an inline note");
    // cursor on content
    expect(findInlineFootnoteAtPosition(line, 10)).toBe("an inline note");
    // cursor on ]
    expect(findInlineFootnoteAtPosition(line, 20)).toBe("an inline note");
  });

  it("returns null when cursor is outside ^[...]", () => {
    const line = "Text^[an inline note].";
    expect(findInlineFootnoteAtPosition(line, 0)).toBeNull();
    expect(findInlineFootnoteAtPosition(line, 3)).toBeNull();
    expect(findInlineFootnoteAtPosition(line, 21)).toBeNull();
  });

  it("handles nested brackets", () => {
    const line = "Text^[note with [link]].";
    expect(findInlineFootnoteAtPosition(line, 10)).toBe("note with [link]");
  });

  it("returns null when no inline footnote exists", () => {
    expect(findInlineFootnoteAtPosition("plain text", 5)).toBeNull();
  });
});

describe("findFootnoteRefAtPosition", () => {
  it("returns label when cursor is inside [^id]", () => {
    const line = "Text[^note1] more.";
    expect(findFootnoteRefAtPosition(line, 4)).toBe("note1");
    expect(findFootnoteRefAtPosition(line, 6)).toBe("note1");
    expect(findFootnoteRefAtPosition(line, 11)).toBe("note1");
  });

  it("returns null when cursor is outside [^id]", () => {
    const line = "Text[^note1] more.";
    expect(findFootnoteRefAtPosition(line, 3)).toBeNull();
    expect(findFootnoteRefAtPosition(line, 12)).toBeNull();
  });

  it("excludes footnote definitions [^id]:", () => {
    const line = "[^note1]: This is a definition.";
    expect(findFootnoteRefAtPosition(line, 0)).toBeNull();
    expect(findFootnoteRefAtPosition(line, 5)).toBeNull();
  });

  it("returns null when no footnote ref exists", () => {
    expect(findFootnoteRefAtPosition("plain text", 5)).toBeNull();
  });

  it("handles multiple refs on same line", () => {
    const line = "A[^1] and B[^2].";
    expect(findFootnoteRefAtPosition(line, 2)).toBe("1");
    expect(findFootnoteRefAtPosition(line, 12)).toBe("2");
  });
});

describe("findFootnoteDefinitionInText", () => {
  it("finds a simple definition", () => {
    const lines = ["Text[^1].", "", "[^1]: Footnote content."];
    expect(findFootnoteDefinitionInText(lines, "1")).toBe("Footnote content.");
  });

  it("finds a multi-paragraph definition", () => {
    const lines = [
      "[^long]: First paragraph.",
      "",
      "    Second paragraph.",
      "    Still second.",
    ];
    expect(findFootnoteDefinitionInText(lines, "long")).toBe(
      "First paragraph.\n\nSecond paragraph.\nStill second.",
    );
  });

  it("returns null for undefined label", () => {
    const lines = ["[^1]: Note."];
    expect(findFootnoteDefinitionInText(lines, "2")).toBeNull();
  });

  it("handles label with special regex characters", () => {
    const lines = ["[^a.b]: Note."];
    expect(findFootnoteDefinitionInText(lines, "a.b")).toBe("Note.");
  });
});
