# Task: Crossref Completion Provider

## Purpose

Provide autocomplete suggestions for crossref references (`@fig:`, `@tbl:`, `@eq:`, `@sec:`, `@lst:`) based on definitions found in the current document. When the user types `@fig:`, show all `{#fig:label}` definitions as candidates.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Depends on: Phase 21 (Definition scanner)
- Source: `src/completion.ts`, `src/completion-provider.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Build crossref completion entries

Create `buildCrossrefCompletionEntries(definitions, context)` in `src/completion.ts` using `CrossrefDefinitionMap` from the definition scanner.

- [x] Write test: `{#fig:diagram}` in source → completion entry with key `fig:diagram`, label `fig:diagram`
- [x] Write test: detail shows display name and order (e.g. "Figure 1")
- [x] Write test: insertText is `@fig:diagram` inside bracket, `[@fig:diagram]` outside bracket
- [x] Write test: multiple definitions produce multiple entries
- [x] Write test: empty definitions map → empty array
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Filter text for crossref entries

Ensure crossref entries are filterable by type prefix and label.

- [x] Write test: filterText contains both `fig:diagram` and `Figure`
- [x] Write test: typing `@fig:` filters to only figure entries
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Integrate into completion provider

Add crossref completion entries to `provideCompletionItems` in `src/completion-provider.ts`.

- [x] Scan document text with `scanCrossrefDefinitions`
- [x] Build crossref entries and merge with bibliography entries
- [x] Use `CompletionItemKind.Reference` for crossref items
- [x] Lint & type check

### Step 4: Documentation for crossref completion items

Show crossref type and label info in the completion item documentation.

- [x] Write test: documentation shows the crossref type (e.g. "Figure", "Table")
- [x] Implement (verify Green)
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
