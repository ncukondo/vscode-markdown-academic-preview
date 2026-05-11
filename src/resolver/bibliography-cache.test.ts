import { describe, it, expect, vi } from "vitest";
import { BibliographyCache } from "./bibliography-cache";

const TEST_BIB = `@article{smith2020,
  author = {Smith, John},
  title = {A Test Article},
  journal = {Test Journal},
  year = {2020}
}`;

const TEST_JSON = JSON.stringify([
  {
    id: "doe2022",
    type: "article-journal",
    title: "JSON Article",
    author: [{ family: "Doe", given: "Jane" }],
    issued: { "date-parts": [[2022]] },
  },
]);

function createCache(options?: {
  files?: Record<string, { content: string; mtimeMs: number }>;
}) {
  const files = options?.files ?? {
    "/refs.bib": { content: TEST_BIB, mtimeMs: 1000 },
  };

  const readFile = vi.fn((path: string) => {
    const f = files[path];
    if (!f) throw new Error("ENOENT: " + path);
    return f.content;
  });

  const statSync = vi.fn((path: string) => {
    const f = files[path];
    if (!f) throw new Error("ENOENT: " + path);
    return { mtimeMs: f.mtimeMs };
  });

  const cache = new BibliographyCache({ statSync, readFile });
  return { cache, readFile, statSync, files };
}

describe("BibliographyCache", () => {
  it("returns cached data when mtime unchanged", () => {
    const { cache, readFile } = createCache();

    const result1 = cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });
    const result2 = cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });

    expect(result1).toBe(result2);
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("reloads when mtime changes", () => {
    const { cache, readFile, files } = createCache();

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });

    files["/refs.bib"].mtimeMs = 2000;

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });

    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it("reloads when file paths change", () => {
    const { cache, readFile } = createCache({
      files: {
        "/refs.bib": { content: TEST_BIB, mtimeMs: 1000 },
        "/refs.json": { content: TEST_JSON, mtimeMs: 1000 },
      },
    });

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });
    cache.load({
      bibliographyPaths: ["/refs.json"],
      inlineReferences: [],
    });

    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it("reloads when inline references change", () => {
    const { cache, readFile } = createCache();

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });
    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [
        { id: "inline1", type: "article-journal", title: "Inline" },
      ],
    });

    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it("handles statSync failure gracefully", () => {
    const { cache, readFile, files } = createCache();

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });

    // Delete the file — statSync will throw
    delete files["/refs.bib"];

    // Should not throw, just reload (which will also fail, but gracefully)
    const result = cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });

    expect(readFile).toHaveBeenCalledTimes(2);
    expect(result.ids).toHaveLength(0);
  });

  it("invalidate() forces reload", () => {
    const { cache, readFile } = createCache();

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });

    cache.invalidate();

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [],
    });

    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it("hits cache when inlineReferences is the same array reference (no stringify)", () => {
    const { cache, readFile } = createCache();
    const refs = [
      { id: "inline1", type: "article-journal", title: "Inline" },
    ];

    cache.load({ bibliographyPaths: ["/refs.bib"], inlineReferences: refs });
    cache.load({ bibliographyPaths: ["/refs.bib"], inlineReferences: refs });

    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("hits cache when both inlineReferences arrays are empty distinct refs", () => {
    const { cache, readFile } = createCache();

    cache.load({ bibliographyPaths: ["/refs.bib"], inlineReferences: [] });
    cache.load({ bibliographyPaths: ["/refs.bib"], inlineReferences: [] });

    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it("invalidates when only an inline reference id changes", () => {
    const { cache, readFile } = createCache();

    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [{ id: "a", type: "article-journal", title: "A" }],
    });
    cache.load({
      bibliographyPaths: ["/refs.bib"],
      inlineReferences: [{ id: "b", type: "article-journal", title: "A" }],
    });

    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it("tracks mtimes for multiple bib files", () => {
    const { cache, readFile, files } = createCache({
      files: {
        "/refs1.bib": { content: TEST_BIB, mtimeMs: 1000 },
        "/refs2.json": { content: TEST_JSON, mtimeMs: 1000 },
      },
    });

    const paths = ["/refs1.bib", "/refs2.json"];

    cache.load({ bibliographyPaths: paths, inlineReferences: [] });
    cache.load({ bibliographyPaths: paths, inlineReferences: [] });

    expect(readFile).toHaveBeenCalledTimes(2); // once per file

    // Change only one file
    files["/refs2.json"].mtimeMs = 2000;
    cache.load({ bibliographyPaths: paths, inlineReferences: [] });

    expect(readFile).toHaveBeenCalledTimes(4); // both re-read
  });
});
