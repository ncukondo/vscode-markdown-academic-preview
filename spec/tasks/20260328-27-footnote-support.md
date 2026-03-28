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

- [ ] Add `markdown-it-footnote` to `package.json` dependencies
- [ ] Create type declaration `src/types/markdown-it-footnote.d.ts`
- [ ] Verify `npm install` succeeds and `npx tsc --noEmit` passes

### Step 2: Basic reference footnote rendering

- [ ] Write test: `[^1]` with `[^1]: Footnote text` renders footnote section
- [ ] Write test: footnote section contains the footnote text
- [ ] Register `md.use(footnote)` in `pandocCitationPlugin` after `pandocFormattingPlugin(md)` (verify Green)
- [ ] Lint & type check

### Step 3: Inline footnote rendering

- [ ] Write test: `^[Inline footnote text]` renders footnote section
- [ ] Write test: inline footnote text appears in footnote section
- [ ] Verify tests pass with existing implementation (should already work)
- [ ] Lint & type check

### Step 4: Pandoc-compatible renderer overrides

- [ ] Write test: `footnote_ref` renders as `<a role="doc-noteref"><sup>N</sup></a>` (not `<sup><a>[N]</a></sup>`)
- [ ] Write test: footnote section has `role="doc-endnotes"` and `class="footnotes footnotes-end-of-document"`
- [ ] Write test: footnote `<li>` has `id="fn1"` but no `class="footnote-item"`
- [ ] Write test: backref has `class="footnote-back"` and `role="doc-backlink"` (not `class="footnote-backref"`)
- [ ] Override all 6 renderer keys in `plugin.ts` (verify Green)
- [ ] Lint & type check

### Step 5: Non-interference with superscript

- [ ] Write test: `^text^` still renders `<sup>text</sup>` with footnote plugin active
- [ ] Write test: `^[inline footnote]` does NOT produce superscript markup
- [ ] Write test: `x^2^ and ^[a note]` both render correctly in same document
- [ ] Verify tests pass (should already work due to rule ordering)
- [ ] Lint & type check

### Step 6: Non-interference with citations and crossrefs

- [ ] Write test: `[@smith2020]` and `[^1]` in same document both render correctly
- [ ] Write test: `@smith2020` inline citation still works with footnotes present
- [ ] Write test: citation inside footnote resolves: `^[See @smith2020]`
- [ ] Write test: crossref inside footnote resolves: `^[See @fig:a]`
- [ ] Verify tests pass
- [ ] Lint & type check

### Step 7: CSS styling

- [ ] Add footnote styles to `media/citation-popover.css`
- [ ] Verify visual appearance in VS Code preview
- [ ] Lint & type check

### Step 8: Multiple footnotes and edge cases

- [ ] Write test: multiple footnotes numbered sequentially (1, 2, 3)
- [ ] Write test: same footnote referenced twice produces correct backrefs
- [ ] Write test: multi-paragraph footnote definition renders correctly
- [ ] Verify tests pass
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
- [ ] Close GitHub issue: #28
