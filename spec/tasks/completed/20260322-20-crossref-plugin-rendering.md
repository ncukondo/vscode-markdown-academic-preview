# Task: Crossref Plugin Rendering (Without Numbering)

## Purpose

Integrate crossref type detection into the markdown-it plugin. Crossref references (`@fig:label`, etc.) are rendered as styled labels (e.g., "Figure: label") instead of being looked up in the bibliography. This provides immediate value before definition scanning is implemented.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Depends on: Phase 19 (Crossref type detector)
- Source: `src/plugin.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Crossref default display names

Create a mapping from crossref type to default English display name.

- [x] Write test: `CROSSREF_DISPLAY_NAMES["fig"]` → `"Figure"`
- [x] Write test: `CROSSREF_DISPLAY_NAMES["tbl"]` → `"Table"`
- [x] Write test: `CROSSREF_DISPLAY_NAMES["eq"]` → `"Equation"`
- [x] Write test: `CROSSREF_DISPLAY_NAMES["sec"]` → `"Section"`
- [x] Write test: `CROSSREF_DISPLAY_NAMES["lst"]` → `"Listing"`
- [x] Implement in `src/crossref/types.ts` (verify Green)
- [x] Lint & type check

### Step 2: Crossref rendering function

Create `renderCrossref(type, label, number?)` that returns HTML for a crossref reference.

- [x] Write test: without number → `<span class="pandoc-crossref">Figure: label</span>`
- [x] Write test: with number → `<span class="pandoc-crossref">Figure 1</span>`
- [x] Write test: unknown type falls back gracefully
- [x] Create `src/crossref/crossref-renderer.ts` (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Plugin integration — skip bibliography for crossref keys

Modify the core rule in `plugin.ts` to exclude crossref keys from bibliography lookup.

- [x] Write test: `@fig:diagram` does not trigger "unknown citation" warning
- [x] Write test: `@smith2020` still resolves from bibliography as before
- [x] Implement in `plugin.ts` (verify Green)
- [x] Lint & type check

### Step 4: Plugin integration — render crossref tokens

Modify token renderers to output crossref HTML for crossref keys.

- [x] Write test: inline `@fig:diagram` renders as crossref styled span
- [x] Write test: bracket `[@fig:diagram]` renders as crossref styled span
- [x] Write test: mixed `[@smith2020; @fig:diagram]` renders citation + crossref correctly
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 5: CSS styling

Add CSS for `.pandoc-crossref` class to distinguish from bibliography citations.

- [x] Add styles to the extension's CSS
- [x] Verify visual distinction in preview
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [x] Move file to `spec/tasks/completed/`
