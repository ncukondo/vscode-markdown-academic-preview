# Task: Crossref Caption Rendering

## Purpose

Render Pandoc's `: Caption {#type:label}` syntax as styled caption elements in the markdown preview. In Pandoc, a line starting with `: ` before/after a table or figure serves as its caption. This task transforms such lines into `<caption>` or styled `<p>` elements instead of rendering them as plain text.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Depends on: Phase 21 (Definition scanner), Phase 23 (Numbered rendering)
- Source: `src/plugin.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Detect caption lines in core rule

Identify paragraph tokens matching `: Caption text {#type:label}` pattern.

- [ ] Write test: `: Caption {#fig:a}` is not rendered as plain text with `: ` prefix
- [ ] Write test: `: Caption {#tbl:data}` is not rendered as plain text with `: ` prefix
- [ ] Write test: regular paragraph starting with `: ` without crossref id is unchanged
- [ ] Implement detection in core rule (verify Green)
- [ ] Lint & type check

### Step 2: Render caption as styled element

Transform detected caption paragraphs into styled caption elements.

- [ ] Write test: `: My Figure {#fig:a}` renders as element with class `pandoc-crossref-caption`
- [ ] Write test: caption text content is preserved (without `: ` prefix and `{#type:label}` suffix)
- [ ] Write test: anchor id is present on the caption element
- [ ] Implement rendering (verify Green)
- [ ] Lint & type check

### Step 3: Caption associated with preceding/following block

Ensure caption visually associates with adjacent table or image.

- [ ] Write test: `: Caption {#tbl:data}` followed by a table renders caption above the table
- [ ] Write test: image followed by `: Caption {#fig:a}` renders caption below the image
- [ ] Write test: standalone caption (no adjacent block) still renders as caption element
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: CSS styling for captions

Add CSS for `.pandoc-crossref-caption` class.

- [ ] Add styles (centered, italic or distinct from body text)
- [ ] Verify visual appearance in preview
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
