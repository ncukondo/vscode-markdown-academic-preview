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
});
