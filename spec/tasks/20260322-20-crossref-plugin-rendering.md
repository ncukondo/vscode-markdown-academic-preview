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

- [ ] Write test: `CROSSREF_DISPLAY_NAMES["fig"]` → `"Figure"`
- [ ] Write test: `CROSSREF_DISPLAY_NAMES["tbl"]` → `"Table"`
- [ ] Write test: `CROSSREF_DISPLAY_NAMES["eq"]` → `"Equation"`
- [ ] Write test: `CROSSREF_DISPLAY_NAMES["sec"]` → `"Section"`
- [ ] Write test: `CROSSREF_DISPLAY_NAMES["lst"]` → `"Listing"`
- [ ] Implement in `src/crossref/types.ts` (verify Green)
- [ ] Lint & type check

### Step 2: Crossref rendering function

Create `renderCrossref(type, label, number?)` that returns HTML for a crossref reference.

- [ ] Write test: without number → `<span class="pandoc-crossref">Figure: label</span>`
- [ ] Write test: with number → `<span class="pandoc-crossref">Figure 1</span>`
- [ ] Write test: unknown type falls back gracefully
- [ ] Create `src/crossref/crossref-renderer.ts` (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: Plugin integration — skip bibliography for crossref keys

Modify the core rule in `plugin.ts` to exclude crossref keys from bibliography lookup.

- [ ] Write test: `@fig:diagram` does not trigger "unknown citation" warning
- [ ] Write test: `@smith2020` still resolves from bibliography as before
- [ ] Implement in `plugin.ts` (verify Green)
- [ ] Lint & type check

### Step 4: Plugin integration — render crossref tokens

Modify token renderers to output crossref HTML for crossref keys.

- [ ] Write test: inline `@fig:diagram` renders as crossref styled span
- [ ] Write test: bracket `[@fig:diagram]` renders as crossref styled span
- [ ] Write test: mixed `[@smith2020; @fig:diagram]` renders citation + crossref correctly
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 5: CSS styling

Add CSS for `.pandoc-crossref` class to distinguish from bibliography citations.

- [ ] Add styles to the extension's CSS
- [ ] Verify visual distinction in preview
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
