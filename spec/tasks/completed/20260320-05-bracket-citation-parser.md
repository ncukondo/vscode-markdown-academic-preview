# Task: Bracket Citation Parser

## Purpose

Parse bracketed Pandoc citations (`[...]`) containing one or more semicolon-separated citation entries into an array of structured citations.

## References

- ADR: `spec/decisions/ADR-004-citation-syntax-scope.md`
- Depends on: `src/parser/single-citation.ts` (Phase 3)
- Source: `src/parser/bracket-citation.ts`

## TDD Workflow

Each step follows Red-Green-Refactor.

## API Design

```typescript
interface BracketCitation {
  type: "bracket";
  citations: SingleCitation[];
  raw: string;        // original text including brackets
  startPos: number;
  endPos: number;
}

// Attempt to parse a bracket citation at the given position
function parseBracketCitation(src: string, pos: number): BracketCitation | null;
```

## Steps

### Step 1: Single citation in brackets

- [x] Write test: `"[@smith2020]"` at pos 0 → 1 citation
- [x] Write test: `"text [@smith2020] more"` at pos 5 → 1 citation, correct startPos/endPos
- [x] Write test: `"[no citation]"` at pos 0 → `null` (no `@`)
- [x] Write test: not starting with `[` → `null`
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Multiple semicolon-separated citations

- [x] Write test: `"[@k1; @k2]"` → 2 citations
- [x] Write test: `"[@k1; @k2; @k3]"` → 3 citations
- [x] Write test: `"[see @k1, p. 10; also -@k2, chap. 3]"` → 2 citations with full structure
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Unmatched brackets

- [x] Write test: `"[@smith2020"` (no closing `]`) → `null`
- [x] Write test: `"[@smith[nested]2020]"` → handles nested brackets correctly
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 4: Edge cases

- [x] Write test: `"[@smith2020, p. 10]"` → locator parsed correctly
- [x] Write test: `"[-@smith2020]"` → suppressAuthor
- [x] Write test: `"[]"` → `null` (empty brackets)
- [x] Write test: `"[@]"` → `null` (no valid key after @)
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
