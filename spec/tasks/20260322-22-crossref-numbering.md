# Task: Crossref Numbering

## Purpose

Given a `CrossrefDefinitionMap` from the definition scanner, resolve crossref references to their assigned numbers. Provides the lookup layer between scanning and rendering.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Depends on: Phase 21 (Definition scanner)
- Source: `src/crossref/numbering.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Resolve crossref number

Implement `resolveCrossrefNumber(id: string, definitions: CrossrefDefinitionMap): number | null`.

- [ ] Write test: `resolveCrossrefNumber("fig:a", defs)` → `1` when `fig:a` is defined with order 1
- [ ] Write test: `resolveCrossrefNumber("fig:missing", defs)` → `null` when not defined
- [ ] Write test: `resolveCrossrefNumber("tbl:x", defs)` → `1` (independent numbering per type)
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: Resolve all crossref references in a document

Implement `resolveAllCrossrefs(ids: string[], definitions: CrossrefDefinitionMap)` that returns a map of id → number for all resolvable references.

- [ ] Write test: returns numbers for defined ids, omits undefined ids
- [ ] Write test: empty input returns empty map
- [ ] Implement (verify Green)
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
