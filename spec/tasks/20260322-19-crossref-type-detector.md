# Task: Crossref Type Detector

## Purpose

Detect whether a citation key is a pandoc-crossref reference by checking for known prefixes (`fig:`, `tbl:`, `eq:`, `sec:`, `lst:`). Returns the reference type and the label portion of the key.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Source: `src/crossref/types.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Define crossref types and constants

Define the `CrossrefType` union type and the `CROSSREF_PREFIXES` constant.

- [ ] Write test: `CROSSREF_PREFIXES` contains exactly `["fig:", "tbl:", "eq:", "sec:", "lst:"]`
- [ ] Create stub `src/crossref/types.ts` (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: Parse crossref key

Implement `parseCrossrefKey(key: string)` that returns `{ type, label }` or `null`.

- [ ] Write test: `parseCrossrefKey("fig:diagram1")` → `{ type: "fig", label: "diagram1" }`
- [ ] Write test: `parseCrossrefKey("tbl:results")` → `{ type: "tbl", label: "results" }`
- [ ] Write test: `parseCrossrefKey("eq:euler")` → `{ type: "eq", label: "euler" }`
- [ ] Write test: `parseCrossrefKey("sec:intro")` → `{ type: "sec", label: "intro" }`
- [ ] Write test: `parseCrossrefKey("lst:code1")` → `{ type: "lst", label: "lst1" }`
- [ ] Write test: `parseCrossrefKey("smith2020")` → `null` (regular citation key)
- [ ] Write test: `parseCrossrefKey("configure:")` → `null` (not a known prefix)
- [ ] Write test: `parseCrossrefKey("fig:")` → `null` (empty label)
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: isCrossrefKey utility

Implement `isCrossrefKey(key: string): boolean` as a convenience wrapper.

- [ ] Write test: `isCrossrefKey("fig:x")` → `true`
- [ ] Write test: `isCrossrefKey("smith2020")` → `false`
- [ ] Implement (verify Green)
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
