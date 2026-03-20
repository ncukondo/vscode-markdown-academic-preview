import { describe, it, expect } from "vitest";
import { parseBracketCitation } from "./bracket-citation";

describe("parseBracketCitation", () => {
  // Step 1: Single citation in brackets
  describe("single citation in brackets", () => {
    it('parses "[@smith2020]" at pos 0 → 1 citation', () => {
      const result = parseBracketCitation("[@smith2020]", 0);
      expect(result).not.toBeNull();
      expect(result!.type).toBe("bracket");
      expect(result!.citations).toHaveLength(1);
      expect(result!.citations[0].id).toBe("smith2020");
      expect(result!.raw).toBe("[@smith2020]");
      expect(result!.startPos).toBe(0);
      expect(result!.endPos).toBe(12);
    });

    it('parses "text [@smith2020] more" at pos 5 → correct positions', () => {
      const result = parseBracketCitation("text [@smith2020] more", 5);
      expect(result).not.toBeNull();
      expect(result!.citations).toHaveLength(1);
      expect(result!.citations[0].id).toBe("smith2020");
      expect(result!.startPos).toBe(5);
      expect(result!.endPos).toBe(17);
      expect(result!.raw).toBe("[@smith2020]");
    });

    it('returns null for "[no citation]" at pos 0 (no @)', () => {
      expect(parseBracketCitation("[no citation]", 0)).toBeNull();
    });

    it("returns null when not starting with [", () => {
      expect(parseBracketCitation("@smith2020", 0)).toBeNull();
      expect(parseBracketCitation("text", 0)).toBeNull();
    });
  });

  // Step 2: Multiple semicolon-separated citations
  describe("multiple semicolon-separated citations", () => {
    it('parses "[@k1; @k2]" → 2 citations', () => {
      const result = parseBracketCitation("[@k1; @k2]", 0);
      expect(result).not.toBeNull();
      expect(result!.citations).toHaveLength(2);
      expect(result!.citations[0].id).toBe("k1");
      expect(result!.citations[1].id).toBe("k2");
    });

    it('parses "[@k1; @k2; @k3]" → 3 citations', () => {
      const result = parseBracketCitation("[@k1; @k2; @k3]", 0);
      expect(result).not.toBeNull();
      expect(result!.citations).toHaveLength(3);
      expect(result!.citations[0].id).toBe("k1");
      expect(result!.citations[1].id).toBe("k2");
      expect(result!.citations[2].id).toBe("k3");
    });

    it('parses "[see @k1, p. 10; also -@k2, chap. 3]" → 2 citations with full structure', () => {
      const result = parseBracketCitation(
        "[see @k1, p. 10; also -@k2, chap. 3]",
        0,
      );
      expect(result).not.toBeNull();
      expect(result!.citations).toHaveLength(2);
      expect(result!.citations[0]).toEqual({
        id: "k1",
        prefix: "see ",
        suffix: "",
        locator: { label: "page", value: "10" },
        suppressAuthor: false,
      });
      expect(result!.citations[1]).toEqual({
        id: "k2",
        prefix: " also ",
        suffix: "",
        locator: { label: "chapter", value: "3" },
        suppressAuthor: true,
      });
    });
  });

  // Step 3: Unmatched brackets
  describe("unmatched brackets", () => {
    it('returns null for "[@smith2020" (no closing ])', () => {
      expect(parseBracketCitation("[@smith2020", 0)).toBeNull();
    });

    it('handles "[@smith[nested]2020]" — uses first ] as close', () => {
      const result = parseBracketCitation("[@smith[nested]2020]", 0);
      // The nested brackets create depth tracking: [... [nested] ...]
      // With depth tracking, the outer ] at pos 19 is the match
      expect(result).not.toBeNull();
      expect(result!.raw).toBe("[@smith[nested]2020]");
    });
  });
});
