# Task: Crossref Numbered Rendering in Plugin

## Purpose

Integrate the definition scanner and numbering into the markdown-it plugin so that crossref references are rendered with their assigned numbers (e.g., "Figure 1", "Table 2"). References without definitions fall back to label-only display.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Depends on: Phase 20 (Plugin rendering), Phase 22 (Numbering)
- Source: `src/plugin.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Scan definitions in core rule

Extend the `pandoc_citation_resolve` core rule to scan the document source for crossref definitions and store the definition map in `md` state.

- [x] Write test: document with `{#fig:a}` produces a definition map accessible during rendering
- [x] Write test: document without definitions produces an empty map
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Numbered rendering for inline crossref

Update the inline crossref renderer to use the definition map for numbered output.

- [x] Write test: `@fig:a` with `{#fig:a}` defined → renders "Figure 1"
- [x] Write test: `@fig:a` without definition → renders "Figure: a" (fallback)
- [x] Write test: `@tbl:x` as second table → renders "Table 2"
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Numbered rendering for bracket crossref

Update the bracket crossref renderer similarly.

- [x] Write test: `[@fig:a]` with definition → renders "Figure 1"
- [x] Write test: `[@fig:a]` without definition → renders "Figure: a" (fallback)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 4: Warning style for undefined references

Add a warning style for crossref references that have no matching definition.

- [x] Write test: undefined crossref gets `pandoc-crossref-warning` class
- [x] Write test: defined crossref does not get warning class
- [x] Implement (verify Green)
- [x] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
