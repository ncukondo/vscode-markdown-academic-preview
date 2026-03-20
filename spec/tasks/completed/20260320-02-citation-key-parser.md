# Task: Citation Key Parser

## Purpose

Implement a function that extracts a Pandoc citation key from a string at a given position. This is the foundational building block for all citation parsing.

## References

- ADR: `spec/decisions/ADR-004-citation-syntax-scope.md`
- Source: `src/parser/citation-key.ts`

## TDD Workflow

Each step follows Red-Green-Refactor.

## API Design

```typescript
type ParseResult = { key: string; endPos: number } | null;
function parseCitationKey(src: string, pos: number): ParseResult;
```

- `src`: input string (the text after `@`)
- `pos`: offset in `src` to start parsing
- Returns the extracted key and the position after the key, or `null` if no valid key

## Steps

### Step 1: Basic alphanumeric keys

Keys consisting only of letters, digits, and underscores.

- [ ] Write test: `"smith2020"` → `{ key: "smith2020", endPos: 9 }`
- [ ] Write test: `"_foo"` → `{ key: "_foo", endPos: 4 }`
- [ ] Write test: `"2020data"` → `{ key: "2020data", endPos: 8 }`
- [ ] Write test: `""` → `null`
- [ ] Write test: `"-foo"` → `null` (starts with punctuation)
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: Internal punctuation characters

Keys with single internal punctuation from `[:.#$%&\-+?<>~/]`.

- [ ] Write test: `"Foo_bar.baz"` → `{ key: "Foo_bar.baz", endPos: 11 }`
- [ ] Write test: `"ns:key"` → `{ key: "ns:key", endPos: 6 }`
- [ ] Write test: `"a-b-c"` → `{ key: "a-b-c", endPos: 5 }`
- [ ] Write test: `"a/b/c"` → `{ key: "a/b/c", endPos: 5 }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: Trailing punctuation exclusion

Trailing punctuation characters should not be part of the key.

- [ ] Write test: `"Foo_bar."` → `{ key: "Foo_bar", endPos: 7 }`
- [ ] Write test: `"smith2020,"` → `{ key: "smith2020", endPos: 9 }`
- [ ] Write test: `"smith2020."` → `{ key: "smith2020", endPos: 9 }`
- [ ] Write test: `"key:value:"` → `{ key: "key:value", endPos: 9 }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: Consecutive internal punctuation terminates key

When two or more internal punctuation characters appear in a row, the key ends before them.

- [ ] Write test: `"Foo--bar"` → `{ key: "Foo", endPos: 3 }`
- [ ] Write test: `"Foo..bar"` → `{ key: "Foo", endPos: 3 }`
- [ ] Write test: `"a:-b"` → `{ key: "a", endPos: 1 }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 5: Keys terminated by spaces and other delimiters

- [ ] Write test: `"smith2020 says"` → `{ key: "smith2020", endPos: 9 }`
- [ ] Write test: `"smith2020]"` → `{ key: "smith2020", endPos: 9 }`
- [ ] Write test: `"smith2020, p. 10"` → `{ key: "smith2020", endPos: 9 }`
- [ ] Write test: `"key;other"` → `{ key: "key", endPos: 3 }` (`;` is not in allowed set)
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
