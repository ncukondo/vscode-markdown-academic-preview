# Task: Locator Term Matcher

## Purpose

Implement a function that identifies CSL locator terms (page, chapter, etc.) from text following a comma in a citation. This is needed to separate the locator from suffix text within a single citation.

## References

- ADR: `spec/decisions/ADR-004-citation-syntax-scope.md`
- Source: `src/parser/locator.ts`

## TDD Workflow

Each step follows Red-Green-Refactor.

## API Design

```typescript
type Locator = { label: string; value: string };
type LocatorResult = { locator: Locator; suffixStart: number } | null;

// Parse locator from text that follows the comma after a citation key
// e.g., input " p. 10, and passim" → { locator: { label: "page", value: "10" }, suffixStart: 5 }
function matchLocator(text: string): LocatorResult;
```

## Locator Terms (English)

| CSL label | Match terms |
|-----------|-------------|
| page | page, pages, p., pp. |
| chapter | chapter, chapters, chap., chaps. |
| section | section, sections, sec., secs. |
| volume | volume, volumes, vol., vols. |
| number | number, numbers, no., nos. |
| part | part, parts, pt., pts. |
| book | book, books, bk., bks. |
| figure | figure, figures, fig., figs. |
| line | line, lines, l., ll. |
| note | note, notes, n., nn. |
| column | column, columns, col., cols. |
| paragraph | paragraph, paragraphs, para., paras., ¶, ¶¶ |
| verse | verse, verses, v., vv. |
| folio | folio, folios, fol., fols. |
| opus | opus, opera, op., opp. |
| sub verbo | sub verbo, sub verbis, s.v., s.vv. |
| section (symbol) | §, §§ |

## Steps

### Step 1: Abbreviated locator terms

- [ ] Write test: `" p. 10"` → `{ locator: { label: "page", value: "10" }, ... }`
- [ ] Write test: `" pp. 10-15"` → `{ locator: { label: "page", value: "10-15" }, ... }`
- [ ] Write test: `" chap. 3"` → `{ locator: { label: "chapter", value: "3" }, ... }`
- [ ] Write test: `" vol. 2"` → `{ locator: { label: "volume", value: "2" }, ... }`
- [ ] Write test: `" sec. 4.1"` → `{ locator: { label: "section", value: "4.1" }, ... }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: Full-name locator terms

- [ ] Write test: `" page 10"` → `{ locator: { label: "page", value: "10" }, ... }`
- [ ] Write test: `" chapter 3"` → `{ locator: { label: "chapter", value: "3" }, ... }`
- [ ] Write test: `" section 1"` → `{ locator: { label: "section", value: "1" }, ... }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: Symbol locator terms

- [ ] Write test: `" § 5"` → `{ locator: { label: "section", value: "5" }, ... }`
- [ ] Write test: `" ¶ 3"` → `{ locator: { label: "paragraph", value: "3" }, ... }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: Bare numbers (implicit page)

When no locator term is present, a bare number is treated as a page locator.

- [ ] Write test: `" 10"` → `{ locator: { label: "page", value: "10" }, ... }`
- [ ] Write test: `" 10-15"` → `{ locator: { label: "page", value: "10-15" }, ... }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 5: No locator (returns null)

- [ ] Write test: `" and passim"` → `null`
- [ ] Write test: `" see also"` → `null`
- [ ] Write test: `""` → `null`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 6: Locator with trailing suffix

The locator value ends where the suffix begins (at the next comma or end of string).

- [ ] Write test: `" p. 10, and passim"` → locator value `"10"`, suffixStart points to `", and passim"`
- [ ] Write test: `" chap. 3, emphasis added"` → locator value `"3"`, suffixStart correct
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
