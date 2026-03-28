# Task: Pandoc-Compatible Footnote Support

## Purpose

Add footnote rendering to the Markdown Academic Preview extension using
`markdown-it-footnote` with custom renderer overrides that produce
Pandoc-compatible HTML output. Supports both reference footnotes (`[^id]`)
and inline footnotes (`^[...]`).

## References

- Source: `src/plugin.ts`, `media/citation-popover.css`
- Dependency: `markdown-it-footnote` (npm)

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Add dependency and type declaration

- [x] Add `markdown-it-footnote` to `package.json` dependencies
- [x] Create type declaration `src/types/markdown-it-footnote.d.ts`
- [x] Verify `npm install` succeeds and `npx tsc --noEmit` passes

### Step 2: Basic reference footnote rendering

- [x] Write test: `[^1]` with `[^1]: Footnote text` renders footnote section
- [x] Write test: footnote section contains the footnote text
- [x] Register `md.use(footnote)` in `pandocCitationPlugin` after `pandocFormattingPlugin(md)` (verify Green)
- [x] Lint & type check

### Step 3: Inline footnote rendering

- [x] Write test: `^[Inline footnote text]` renders footnote section
- [x] Write test: inline footnote text appears in footnote section
- [x] Verify tests pass with existing implementation (should already work)
- [x] Lint & type check

### Step 4: Pandoc-compatible renderer overrides

- [x] Write test: `footnote_ref` renders as `<a role="doc-noteref"><sup>N</sup></a>` (not `<sup><a>[N]</a></sup>`)
- [x] Write test: footnote section has `role="doc-endnotes"` and `class="footnotes footnotes-end-of-document"`
- [x] Write test: footnote `<li>` has `id="fn1"` but no `class="footnote-item"`
- [x] Write test: backref has `class="footnote-back"` and `role="doc-backlink"` (not `class="footnote-backref"`)
- [x] Override all 6 renderer keys in `plugin.ts` (verify Green)
- [x] Lint & type check

### Step 5: Non-interference with superscript

- [x] Write test: `^text^` still renders `<sup>text</sup>` with footnote plugin active
- [x] Write test: `^[inline footnote]` does NOT produce superscript markup
- [x] Write test: `x^2^ and ^[a note]` both render correctly in same document
- [x] Verify tests pass (should already work due to rule ordering)
- [x] Lint & type check

### Step 6: Non-interference with citations and crossrefs

- [x] Write test: `[@smith2020]` and `[^1]` in same document both render correctly
- [x] Write test: `@smith2020` inline citation still works with footnotes present
- [x] Write test: citation inside footnote resolves: `^[See @smith2020]`
- [x] Write test: crossref inside footnote resolves: `^[See @fig:a]` (covered by citation test pattern)
- [x] Verify tests pass
- [x] Lint & type check

### Step 7: CSS styling

- [x] Add footnote styles to `media/citation-popover.css`
- [ ] Verify visual appearance in VS Code preview
- [x] Lint & type check

### Step 8: Multiple footnotes and edge cases

- [x] Write test: multiple footnotes numbered sequentially (1, 2, 3)
- [x] Write test: same footnote referenced twice produces correct backrefs
- [x] Write test: multi-paragraph footnote definition renders correctly
- [x] Verify tests pass
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass (432 passed)
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
- [ ] Close GitHub issue: #28
