import { describe, it, expect } from "vitest";
import { scanCrossrefDefinitions } from "./definition-scanner";

describe("scanCrossrefDefinitions", () => {
  describe("attribute-style definitions", () => {
    it("finds figure definition", () => {
      const result = scanCrossrefDefinitions(
        "![Caption](img.png){#fig:diagram}",
      );
      expect(result.has("fig:diagram")).toBe(true);
      expect(result.get("fig:diagram")).toMatchObject({
        type: "fig",
        label: "diagram",
      });
    });

    it("finds section definition", () => {
      const result = scanCrossrefDefinitions("# Introduction {#sec:intro}");
      expect(result.has("sec:intro")).toBe(true);
      expect(result.get("sec:intro")).toMatchObject({
        type: "sec",
        label: "intro",
      });
    });

    it("finds equation definition", () => {
      const result = scanCrossrefDefinitions("$$ E=mc^2 $$ {#eq:einstein}");
      expect(result.has("eq:einstein")).toBe(true);
      expect(result.get("eq:einstein")).toMatchObject({
        type: "eq",
        label: "einstein",
      });
    });

    it("finds table definition", () => {
      const result = scanCrossrefDefinitions(": Caption {#tbl:results}");
      expect(result.has("tbl:results")).toBe(true);
      expect(result.get("tbl:results")).toMatchObject({
        type: "tbl",
        label: "results",
      });
    });

    it("finds listing definition", () => {
      const result = scanCrossrefDefinitions("{#lst:code1}");
      expect(result.has("lst:code1")).toBe(true);
      expect(result.get("lst:code1")).toMatchObject({
        type: "lst",
        label: "code1",
      });
    });

    it("ignores non-crossref attributes", () => {
      const result = scanCrossrefDefinitions("{#not-crossref}");
      expect(result.size).toBe(0);
    });

    it("ignores empty label", () => {
      const result = scanCrossrefDefinitions("{#fig:}");
      expect(result.size).toBe(0);
    });
  });

  describe("order assignment", () => {
    it("assigns sequential order to same-type definitions", () => {
      const source = [
        "![A](a.png){#fig:a}",
        "![B](b.png){#fig:b}",
      ].join("\n");
      const result = scanCrossrefDefinitions(source);
      expect(result.get("fig:a")?.order).toBe(1);
      expect(result.get("fig:b")?.order).toBe(2);
    });

    it("assigns independent numbering per type", () => {
      const source = [
        "![Fig](a.png){#fig:a}",
        ": Table {#tbl:x}",
        "![Fig2](b.png){#fig:b}",
      ].join("\n");
      const result = scanCrossrefDefinitions(source);
      expect(result.get("fig:a")?.order).toBe(1);
      expect(result.get("tbl:x")?.order).toBe(1);
      expect(result.get("fig:b")?.order).toBe(2);
    });

    it("keeps first occurrence for duplicate definitions", () => {
      const source = [
        "![First](a.png){#fig:dup}",
        "![Second](b.png){#fig:dup}",
        "![Third](c.png){#fig:other}",
      ].join("\n");
      const result = scanCrossrefDefinitions(source);
      expect(result.get("fig:dup")?.order).toBe(1);
      expect(result.get("fig:other")?.order).toBe(2);
    });
  });

  describe("code block skipping", () => {
    it("ignores definitions inside fenced code blocks", () => {
      const source = [
        "```",
        "![Caption](img.png){#fig:inside}",
        "```",
      ].join("\n");
      const result = scanCrossrefDefinitions(source);
      expect(result.has("fig:inside")).toBe(false);
    });

    it("finds definitions outside code blocks", () => {
      const source = [
        "```",
        "{#fig:inside}",
        "```",
        "",
        "![Caption](img.png){#fig:outside}",
      ].join("\n");
      const result = scanCrossrefDefinitions(source);
      expect(result.has("fig:inside")).toBe(false);
      expect(result.has("fig:outside")).toBe(true);
    });

    it("handles tilde-style fenced code blocks", () => {
      const source = [
        "~~~",
        "{#fig:inside}",
        "~~~",
        "",
        "{#fig:outside}",
      ].join("\n");
      const result = scanCrossrefDefinitions(source);
      expect(result.has("fig:inside")).toBe(false);
      expect(result.has("fig:outside")).toBe(true);
    });

    it("handles code blocks with language specifier", () => {
      const source = [
        "```python",
        "{#fig:inside}",
        "```",
        "",
        "{#fig:outside}",
      ].join("\n");
      const result = scanCrossrefDefinitions(source);
      expect(result.has("fig:inside")).toBe(false);
      expect(result.has("fig:outside")).toBe(true);
    });
  });
});
