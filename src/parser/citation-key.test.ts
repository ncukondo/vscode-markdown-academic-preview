import { describe, it, expect } from "vitest";
import { parseCitationKey } from "./citation-key";

describe("parseCitationKey", () => {
  // Step 1: Basic alphanumeric keys
  describe("basic alphanumeric keys", () => {
    it("parses simple alphanumeric key", () => {
      expect(parseCitationKey("smith2020", 0)).toEqual({
        key: "smith2020",
        endPos: 9,
      });
    });

    it("parses key starting with underscore", () => {
      expect(parseCitationKey("_foo", 0)).toEqual({
        key: "_foo",
        endPos: 4,
      });
    });

    it("parses key starting with digit", () => {
      expect(parseCitationKey("2020data", 0)).toEqual({
        key: "2020data",
        endPos: 8,
      });
    });

    it("returns null for empty string", () => {
      expect(parseCitationKey("", 0)).toBeNull();
    });

    it("returns null when starting with punctuation", () => {
      expect(parseCitationKey("-foo", 0)).toBeNull();
    });
  });

  // Step 2: Internal punctuation characters
  describe("internal punctuation characters", () => {
    it("parses key with dot and underscore", () => {
      expect(parseCitationKey("Foo_bar.baz", 0)).toEqual({
        key: "Foo_bar.baz",
        endPos: 11,
      });
    });

    it("parses key with colon", () => {
      expect(parseCitationKey("ns:key", 0)).toEqual({
        key: "ns:key",
        endPos: 6,
      });
    });

    it("parses key with hyphens", () => {
      expect(parseCitationKey("a-b-c", 0)).toEqual({
        key: "a-b-c",
        endPos: 5,
      });
    });

    it("parses key with slashes", () => {
      expect(parseCitationKey("a/b/c", 0)).toEqual({
        key: "a/b/c",
        endPos: 5,
      });
    });
  });

  // Step 3: Trailing punctuation exclusion
  describe("trailing punctuation exclusion", () => {
    it("excludes trailing dot after underscore key", () => {
      expect(parseCitationKey("Foo_bar.", 0)).toEqual({
        key: "Foo_bar",
        endPos: 7,
      });
    });

    it("excludes trailing comma", () => {
      expect(parseCitationKey("smith2020,", 0)).toEqual({
        key: "smith2020",
        endPos: 9,
      });
    });

    it("excludes trailing dot", () => {
      expect(parseCitationKey("smith2020.", 0)).toEqual({
        key: "smith2020",
        endPos: 9,
      });
    });

    it("excludes trailing colon after internal colon", () => {
      expect(parseCitationKey("key:value:", 0)).toEqual({
        key: "key:value",
        endPos: 9,
      });
    });
  });

  // Step 4: Consecutive internal punctuation terminates key
  describe("consecutive internal punctuation terminates key", () => {
    it("terminates at consecutive hyphens", () => {
      expect(parseCitationKey("Foo--bar", 0)).toEqual({
        key: "Foo",
        endPos: 3,
      });
    });

    it("terminates at consecutive dots", () => {
      expect(parseCitationKey("Foo..bar", 0)).toEqual({
        key: "Foo",
        endPos: 3,
      });
    });

    it("terminates at mixed consecutive punctuation", () => {
      expect(parseCitationKey("a:-b", 0)).toEqual({
        key: "a",
        endPos: 1,
      });
    });
  });

  // Step 5: Keys terminated by spaces and other delimiters
  describe("keys terminated by spaces and other delimiters", () => {
    it("terminates at space", () => {
      expect(parseCitationKey("smith2020 says", 0)).toEqual({
        key: "smith2020",
        endPos: 9,
      });
    });

    it("terminates at closing bracket", () => {
      expect(parseCitationKey("smith2020]", 0)).toEqual({
        key: "smith2020",
        endPos: 9,
      });
    });

    it("terminates at comma followed by space", () => {
      expect(parseCitationKey("smith2020, p. 10", 0)).toEqual({
        key: "smith2020",
        endPos: 9,
      });
    });

    it("terminates at semicolon (not in allowed set)", () => {
      expect(parseCitationKey("key;other", 0)).toEqual({
        key: "key",
        endPos: 3,
      });
    });
  });

  // Additional: pos parameter tests
  describe("pos parameter", () => {
    it("starts parsing from the given position", () => {
      expect(parseCitationKey("@smith2020", 1)).toEqual({
        key: "smith2020",
        endPos: 10,
      });
    });

    it("returns null when pos is beyond string length", () => {
      expect(parseCitationKey("abc", 5)).toBeNull();
    });
  });
});
