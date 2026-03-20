import { describe, it, expect } from "vitest";
import { resolvePath, resolveDefaultBibliography } from "./file-resolver";
import type { ResolveContext } from "./file-resolver";

// Helper to create a context with a set of existing files
function makeContext(
  existingFiles: string[],
  overrides: Partial<ResolveContext> = {},
): ResolveContext {
  return {
    mdFileDir: "/project/docs",
    searchDirectories: [],
    workspaceRoot: "/workspace",
    exists: (p: string) => existingFiles.includes(p),
    ...overrides,
  };
}

describe("resolvePath", () => {
  // ─── Step 1: Absolute paths ──────────────────────────────────────────

  describe("Step 1: Absolute paths", () => {
    it("returns absolute path as-is when file exists", () => {
      const ctx = makeContext(["/absolute/path/refs.bib"]);
      expect(resolvePath("/absolute/path/refs.bib", ctx)).toBe(
        "/absolute/path/refs.bib",
      );
    });

    it("returns null for absolute path that does not exist", () => {
      const ctx = makeContext([]);
      expect(resolvePath("/absolute/path/refs.bib", ctx)).toBeNull();
    });
  });

  // ─── Step 2: Relative path from markdown file directory ────────────────

  describe("Step 2: Relative path from markdown file directory", () => {
    it("resolves simple relative path from mdFileDir", () => {
      const ctx = makeContext(["/project/docs/refs.bib"], {
        mdFileDir: "/project/docs",
      });
      expect(resolvePath("refs.bib", ctx)).toBe("/project/docs/refs.bib");
    });

    it("resolves ../ relative path from mdFileDir", () => {
      const ctx = makeContext(["/project/bib/refs.bib"], {
        mdFileDir: "/project/docs",
      });
      expect(resolvePath("../bib/refs.bib", ctx)).toBe(
        "/project/bib/refs.bib",
      );
    });
  });

  // ─── Step 3: Fallback to search directories ─────────────────────────────

  describe("Step 3: Fallback to search directories", () => {
    it("resolves from first search directory when not in mdFileDir", () => {
      const ctx = makeContext(["/shared/bib/refs.bib"], {
        mdFileDir: "/project/docs",
        searchDirectories: ["/shared/bib", "/other/bib"],
      });
      expect(resolvePath("refs.bib", ctx)).toBe("/shared/bib/refs.bib");
    });

    it("resolves from second search directory when not in first", () => {
      const ctx = makeContext(["/other/bib/refs.bib"], {
        mdFileDir: "/project/docs",
        searchDirectories: ["/shared/bib", "/other/bib"],
      });
      expect(resolvePath("refs.bib", ctx)).toBe("/other/bib/refs.bib");
    });

    it("falls through when not in any search directory", () => {
      const ctx = makeContext([], {
        mdFileDir: "/project/docs",
        searchDirectories: ["/shared/bib", "/other/bib"],
        workspaceRoot: "/workspace",
      });
      expect(resolvePath("refs.bib", ctx)).toBeNull();
    });
  });

  // ─── Step 4: Fallback to workspace root ──────────────────────────────────

  describe("Step 4: Fallback to workspace root", () => {
    it("resolves from workspace root when not found elsewhere", () => {
      const ctx = makeContext(["/workspace/refs.bib"], {
        mdFileDir: "/project/docs",
        searchDirectories: [],
        workspaceRoot: "/workspace",
      });
      expect(resolvePath("refs.bib", ctx)).toBe("/workspace/refs.bib");
    });

    it("returns null when not found anywhere", () => {
      const ctx = makeContext([], {
        mdFileDir: "/project/docs",
        searchDirectories: ["/shared/bib"],
        workspaceRoot: "/workspace",
      });
      expect(resolvePath("refs.bib", ctx)).toBeNull();
    });
  });
});

// ─── Step 5: Default bibliography ────────────────────────────────────────

describe("resolveDefaultBibliography", () => {
  it("resolves each default bibliography path using the priority chain", () => {
    const ctx = makeContext(["/project/docs/a.bib", "/workspace/b.bib"], {
      mdFileDir: "/project/docs",
      workspaceRoot: "/workspace",
    });
    const result = resolveDefaultBibliography(["a.bib", "b.bib"], ctx);
    expect(result).toEqual(["/project/docs/a.bib", "/workspace/b.bib"]);
  });

  it("skips default bibliography paths that cannot be resolved", () => {
    const ctx = makeContext(["/project/docs/a.bib"], {
      mdFileDir: "/project/docs",
    });
    const result = resolveDefaultBibliography(["a.bib", "missing.bib"], ctx);
    expect(result).toEqual(["/project/docs/a.bib"]);
  });

  it("returns empty array when no defaults are provided", () => {
    const ctx = makeContext([]);
    const result = resolveDefaultBibliography([], ctx);
    expect(result).toEqual([]);
  });
});
