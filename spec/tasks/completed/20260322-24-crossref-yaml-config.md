# Task: Crossref YAML Configuration

## Purpose

Support pandoc-crossref YAML metadata fields (`figPrefix`, `tblPrefix`, `eqnPrefix`, `secPrefix`, `lstPrefix`) to customize the display text of crossref references.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Depends on: Phase 23 (Numbered rendering)
- Source: `src/crossref/types.ts`, `src/metadata/yaml-extractor.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Extract crossref YAML fields

Extend YAML metadata extraction to recognize crossref prefix fields.

- [x] Write test: `figPrefix: "Fig."` → extracted as `{ figPrefix: "Fig." }`
- [x] Write test: `tblPrefix: "Table"` → extracted
- [x] Write test: `eqnPrefix: "Eq."` → extracted (note: `eqn` not `eq` per pandoc-crossref convention)
- [x] Write test: `secPrefix: "Section"` → extracted
- [x] Write test: `lstPrefix: "Listing"` → extracted
- [x] Write test: missing fields → use defaults
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Apply custom prefixes in rendering

Pass extracted prefix configuration to the crossref renderer.

- [x] Write test: `figPrefix: "Fig."` + `@fig:a` → renders "Fig. 1" instead of "Figure 1"
- [x] Write test: unset prefix → uses default ("Figure", "Table", etc.)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Plugin integration

Wire YAML extraction and prefix config through the plugin core rule to renderers.

- [x] Write test: full round-trip with custom prefix in frontmatter
- [x] Write test: full round-trip with default prefixes (no YAML config)
- [x] Implement (verify Green)
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
