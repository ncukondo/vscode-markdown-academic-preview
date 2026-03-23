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

- [ ] Write test: `{#fig:diagram}` in source → completion entry with key `fig:diagram`, label `fig:diagram`
- [ ] Write test: detail shows display name and order (e.g. "Figure 1")
- [ ] Write test: insertText is `@fig:diagram` inside bracket, `[@fig:diagram]` outside bracket
- [ ] Write test: multiple definitions produce multiple entries
- [ ] Write test: empty definitions map → empty array
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: Filter text for crossref entries

Ensure crossref entries are filterable by type prefix and label.

- [ ] Write test: filterText contains both `fig:diagram` and `Figure`
- [ ] Write test: typing `@fig:` filters to only figure entries
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: Integrate into completion provider

Add crossref completion entries to `provideCompletionItems` in `src/completion-provider.ts`.

- [ ] Scan document text with `scanCrossrefDefinitions`
- [ ] Build crossref entries and merge with bibliography entries
- [ ] Use `CompletionItemKind.Reference` for crossref items
- [ ] Lint & type check

### Step 4: Documentation for crossref completion items

Show crossref type and label info in the completion item documentation.

- [ ] Write test: documentation shows the crossref type (e.g. "Figure", "Table")
- [ ] Implement (verify Green)
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
