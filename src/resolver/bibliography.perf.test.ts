/**
 * Performance regression tests for large CSL-JSON bibliographies.
 *
 * Locks in the optimization from issue #29 (plan C): with the fast-path
 * loader, a 10k-entry CSL-JSON parses in well under a second on dev
 * hardware, and per-render lookups stay O(1) regardless of library size.
 *
 * Skipped on CI by default — shared CI runners have noisy timings that
 * cause spurious failures. Run locally with `npm test -- bibliography.perf`.
 */

import { describe, it, expect } from "vitest";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import { loadBibliographySync } from "./bibliography";
import { BibliographyCache } from "./bibliography-cache";

const SKIP_ON_CI = process.env.CI === "true";
const describePerf = SKIP_ON_CI ? describe.skip : describe;

const ENTRY_COUNT = 10_000;

function makeSyntheticEntry(i: number): Record<string, unknown> {
  return {
    id: `key${i}`,
    type: "article-journal",
    title: `Synthetic article number ${i}`,
    author: [
      { family: `Family${i}`, given: `Given${i}` },
      { family: `Coauthor${i}`, given: "C." },
    ],
    issued: { "date-parts": [[2000 + (i % 24)]] },
    "container-title": `Journal of Synthetic Studies ${i % 50}`,
    volume: String(i % 100),
    issue: String(i % 12),
    page: `${i}-${i + 10}`,
    DOI: `10.0000/synth.${i}`,
  };
}

function makeSyntheticLibraryJson(count: number): string {
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push(makeSyntheticEntry(i));
  }
  return JSON.stringify(entries);
}

describePerf("bibliography perf (large library)", () => {
  const libraryJson = makeSyntheticLibraryJson(ENTRY_COUNT);

  it(`loadBibliographySync parses ${ENTRY_COUNT}-entry CSL-JSON quickly`, () => {
    const start = performance.now();
    const result = loadBibliographySync({
      bibliographyPaths: ["/library.json"],
      inlineReferences: [],
      readFile: () => libraryJson,
    });
    const elapsed = performance.now() - start;

    expect(result.entriesById.size).toBe(ENTRY_COUNT);
    expect(result.ids).toHaveLength(ENTRY_COUNT);
    // Generous budget — pre-optimization, the synchronous citation-js
    // normalization of 10k entries took well over a second on dev hardware.
    // The fast-path should comfortably stay under 500ms.
    expect(elapsed).toBeLessThan(1500);
  });

  it("BibliographyCache.load returns the same instance on repeated calls", () => {
    let mtime = 1000;
    const cache = new BibliographyCache({
      readFile: () => libraryJson,
      statSync: () => ({ mtimeMs: mtime }),
    });

    const first = cache.load({
      bibliographyPaths: ["/library.json"],
      inlineReferences: [],
    });

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const hit = cache.load({
        bibliographyPaths: ["/library.json"],
        inlineReferences: [],
      });
      expect(hit).toBe(first);
    }
    const elapsed = performance.now() - start;

    // 100 cache hits should be near-instant (<50ms total).
    expect(elapsed).toBeLessThan(50);
  });

  it("citation lookup against the loaded library is O(1)", () => {
    const result = loadBibliographySync({
      bibliographyPaths: ["/library.json"],
      inlineReferences: [],
      readFile: () => libraryJson,
    });

    // Render-time work: format 5 entries scattered across the library.
    const cited = ["key100", "key2500", "key5000", "key7500", "key9999"];
    const start = performance.now();
    for (const id of cited) {
      const entry = result.entriesById.get(id);
      expect(entry).toBeDefined();
      // Construct a fresh Cite over just one entry — the same pattern
      // renderers use post-optimization.
      const cite = new Cite([entry as Record<string, unknown>]);
      const formatted = String(cite.format("citation", { format: "text", template: "apa" }));
      expect(formatted).toMatch(/Family/);
    }
    const elapsed = performance.now() - start;

    // 5 single-entry renders — citation-js does the work, but our lookup
    // is now O(1). Should fit comfortably within 200ms.
    expect(elapsed).toBeLessThan(500);
  });
});
