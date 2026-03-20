# Task: Single Citation Parser

## Purpose

Parse a single citation entry (one item between semicolons inside brackets) into its structured components: id, prefix, suffix, locator, and suppress-author flag.

## References

- ADR: `spec/decisions/ADR-004-citation-syntax-scope.md`
- Depends on: `src/parser/citation-key.ts` (Phase 1), `src/parser/locator.ts` (Phase 2)
- Source: `src/parser/single-citation.ts`

## TDD Workflow

Each step follows Red-Green-Refactor.

## API Design

```typescript
interface Locator {
  label: string;
  value: string;
}

interface SingleCitation {
  id: string;
  prefix: string;
  suffix: string;
  locator: Locator | null;
  suppressAuthor: boolean;
}

function parseSingleCitation(text: string): SingleCitation | null;
```

- `text`: the text of one citation item (between `;` separators, without surrounding brackets)
- Returns parsed citation or `null` if no valid `@key` found

## Steps

### Step 1: Basic citation (key only)

- [x] Write test: `"@smith2020"` → `{ id: "smith2020", prefix: "", suffix: "", locator: null, suppressAuthor: false }`
- [x] Write test: `""` → `null`
- [x] Write test: `"no citation here"` → `null`
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Suppress author

- [x] Write test: `"-@smith2020"` → `{ ..., suppressAuthor: true }`
- [x] Write test: `" -@smith2020"` → `{ ..., suppressAuthor: true }` (with leading space)
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Prefix text

- [x] Write test: `"see @smith2020"` → `{ ..., prefix: "see ", ... }`
- [x] Write test: `"e.g., @smith2020"` → `{ ..., prefix: "e.g., ", ... }`
- [x] Write test: `"see -@smith2020"` → `{ ..., prefix: "see ", suppressAuthor: true }`
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 4: Locator

- [x] Write test: `"@smith2020, p. 10"` → `{ ..., locator: { label: "page", value: "10" }, ... }`
- [x] Write test: `"@smith2020, chap. 3"` → `{ ..., locator: { label: "chapter", value: "3" }, ... }`
- [x] Write test: `"@smith2020, 15"` → `{ ..., locator: { label: "page", value: "15" }, ... }`
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 5: Suffix text

- [x] Write test: `"@smith2020, p. 10, and *passim*"` → `{ ..., locator: { label: "page", value: "10" }, suffix: ", and *passim*" }`
- [x] Write test: `"@smith2020, see also"` → `{ ..., locator: null, suffix: ", see also" }` (no recognized locator → all is suffix)
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 6: Full combination

- [x] Write test: `"see @smith2020, pp. 10-15, and *passim*"` → all fields populated
- [x] Write test: `"e.g., -@doe2019, chap. 3"` → prefix + suppressAuthor + locator
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
