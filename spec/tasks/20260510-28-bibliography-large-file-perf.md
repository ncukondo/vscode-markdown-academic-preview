# Task: Bibliography large-file performance (Plan C)

## Purpose

Large CSL-JSON bibliographies (observed: 19MB `library.json`, ~tens of thousands of entries) cause the Markdown preview to freeze on open and stutter on every edit. The root cause is that the entire library is normalized through `citation-js` synchronously on load, and every citation render performs O(n) linear searches against the full entry array.

This task implements **Plan C** from issue #29: revise the parse and lookup strategy so that:

1. The full library is no longer normalized upfront — only entries that are actually cited are passed to citation-js at render time.
2. All citation-id lookups become O(1) via a `Map<id, CslEntry>` index built once per load.
3. `BibliographyCache` invalidation no longer pays the cost of `JSON.stringify(inlineReferences)` on every render.

Goal: opening a preview against a 19MB library.json no longer blocks the UI for more than ~1 second after the first load, and edits do not visibly stutter.

## References

- Issue: [#29 Performance: heavy bibliography files freeze the preview](https://github.com/ncukondo/vscode-markdown-academic-preview/issues/29)
- ADR: [ADR-001 citation-js for rendering](../decisions/ADR-001-citation-js-for-rendering.md)
- Source:
  - `src/resolver/bibliography.ts` — `loadBibliography`, `loadBibliographySync`
  - `src/resolver/bibliography-cache.ts` — `BibliographyCache`
  - `src/plugin.ts` — `pandoc_citation_resolve` core rule, `renderBracketCitation`, `renderInlineCitation`, `bibliographyTooltipHtml`, `renderBibliographyHtml`
  - `src/renderer/citation-renderer.ts` — citation formatting helpers

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Extend `BibliographyData` with an O(1) `entriesById` index

Goal: produce the index from `loadBibliography` / `loadBibliographySync` without changing rendering yet.

- [ ] Write test: `loadBibliographySync` returns `{ entriesById: Map<string, CslEntry> }` with the same entries as `cite.data`, deduplicated by id (first wins) and with inline references overriding file entries.
- [ ] Create stub: extend `BibliographyData` interface with `entriesById`, return an empty Map (verify Red).
- [ ] Implement: build the Map after dedup + inline-merge, sharing the existing entry objects.
- [ ] Lint & type check.

### Step 2: Replace `bibData.ids.includes(id)` with O(1) membership

Goal: keep API compatibility (`ids` array still available) but route all known-id checks through the index.

- [ ] Write test: a citation render against a bibliography with 10k entries does not call `Array.prototype.includes` (assert via spy or by perf threshold).
- [ ] Create stub: introduce a `bibData.has(id)` helper backed by `entriesById` (verify Red — current call sites still use `.includes`).
- [ ] Implement: replace `bibData.ids.includes(id)` in `src/plugin.ts:444` and any other call sites with `bibData.entriesById.has(id)` (or `bibData.has(id)`).
- [ ] Lint & type check.

### Step 3: Replace per-citation `cite.data.filter` / `find` with index lookups

Goal: render single inline/bracket citations without scanning the full entry array.

- [ ] Write test: rendering an inline citation against a 10k-entry library completes in `<10ms` per call after warmup.
- [ ] Create stub: introduce `getEntry(id)` helper on `BibliographyData` (verify Red).
- [ ] Implement: in `src/plugin.ts` (`renderInlineCitation`, `renderSingleCitationText`, `bibliographyTooltipHtml`, `renderBibliographyHtml`) and any matching call sites in `src/renderer/citation-renderer.ts`, replace `bibData.cite.data.filter((e) => e.id === id)` / `.find(...)` / `.filter((e) => ids.includes(e.id))` with Map lookups producing only the cited entries.
- [ ] Each `new Cite([...])` is constructed from at most the cited entries, never from the full data.
- [ ] Lint & type check.

### Step 4: Defer citation-js normalization to render time (don't `cite.add` the full library)

Goal: stop paying the citation-js normalization cost for entries that are never cited.

- [ ] Write test: `loadBibliographySync` against a 10k-entry library does not invoke heavy citation-js normalization on every entry — measured either by a perf threshold (<200ms for parse-only path on a synthetic 10k library) or by replacing `Cite` with a spy in unit tests.
- [ ] Create stub: introduce a "lazy" mode where `BibliographyData` stores raw CSL entries in `entriesById` and exposes a method to materialize a `Cite` from a subset of ids (verify Red — old code still feeds everything to `Cite`).
- [ ] Implement:
  - In `loadBibliographySync` / `loadBibliography`, parse the source file but **do not** `cite.add` the full library. Build `entriesById` directly from the parsed CSL-JSON / YAML, using a thin BibTeX adapter (still via citation-js, since BibTeX needs parsing) only when the source is BibTeX.
  - Add `bibData.materializeCite(ids: Iterable<string>): Cite` that constructs a fresh `Cite` from the requested entries.
  - Update all renderers to call `materializeCite` with exactly the ids they need.
- [ ] Lint & type check.

### Step 5: Lighten `BibliographyCache` invalidation

Goal: remove the per-render `JSON.stringify(inlineReferences)` cost.

- [ ] Write test: `BibliographyCache.load` called twice with the same `inlineReferences` array reference (and unchanged mtimes) returns the cached instance without recomputing the inline-refs key beyond a cheap check.
- [ ] Create stub: introduce a faster invalidation key (verify Red against the current `JSON.stringify` implementation).
- [ ] Implement options:
  - Skip the inline-refs check entirely when both cached and incoming arrays are empty.
  - Otherwise compare by reference identity first, then fall back to a length + per-entry id+revision hash.
- [ ] Lint & type check.

### Step 6: Add a perf regression test for a synthetic large library

Goal: lock in the improvement and detect future regressions.

- [ ] Write test: a vitest perf test that generates a synthetic ~10k-entry CSL-JSON in memory, runs `BibliographyCache.load` once + a representative render of 5 cited keys, and asserts a wall-clock budget (e.g. `<1.5s` first load, `<30ms` per subsequent render). Mark as `test.skipIf(process.env.CI === 'true')` if CI hardware is too noisy, but keep it runnable locally.
- [ ] Create stub (verify Red against current `main`).
- [ ] Implement: place under `src/resolver/__perf__/` or similar; document how to run.
- [ ] Lint & type check.

### Step 7: Manual verification with the real 19MB library

Goal: confirm the user-visible improvement.

- [ ] Open a Markdown document referencing a 19MB CSL-JSON `bibliography:` in the actual VS Code extension host.
- [ ] Confirm preview opens within ~1s after first cold load (subsequent loads should be near-instant due to the cache).
- [ ] Confirm typing in the document does not visibly stutter.
- [ ] Capture before/after timings (rough is fine) in the PR description.

## Completion Checklist

- [ ] All tests pass (`npm test`)
- [ ] Lint passes
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Issue #29 acceptance criteria met (1s open, no stutter, perf test added)
- [ ] PR opened and linked to issue #29
- [ ] Move file to `spec/tasks/completed/` after merge
