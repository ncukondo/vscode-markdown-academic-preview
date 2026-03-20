# Task: Bibliography Loader

## Purpose

Load and parse bibliography data from files (BibTeX, CSL JSON, CSL YAML) and inline references using citation-js. Merge all sources into a unified citation database.

## References

- ADR: `spec/decisions/ADR-001-citation-js-for-rendering.md`
- Depends on: `src/resolver/file-resolver.ts` (Phase 7)
- Source: `src/resolver/bibliography.ts`

## TDD Workflow

Each step follows Red-Green-Refactor.

## API Design

```typescript
interface BibliographyData {
  cite: Cite;                    // citation-js Cite instance
  ids: string[];                 // available citation keys
}

interface LoadOptions {
  bibliographyPaths: string[];   // resolved absolute paths
  inlineReferences: CslReference[];  // from YAML metadata
  readFile: (path: string) => string | Promise<string>;  // injectable file reader
}

function loadBibliography(options: LoadOptions): BibliographyData;
```

## Steps

### Step 1: Load BibTeX (.bib) file

- [x] Write test: parse a simple .bib string with one entry → correct id extracted
- [x] Write test: parse .bib with multiple entries → all ids available
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Load CSL JSON (.json) file

- [x] Write test: parse CSL JSON array with one entry → correct id
- [x] Write test: parse CSL JSON with multiple entries → all ids
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Load CSL YAML (.yaml) file

- [x] Write test: parse CSL YAML → convert to JSON → correct ids
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 4: Merge inline references

- [x] Write test: inline references added to cite instance → ids available
- [x] Write test: inline reference with same id as .bib entry → inline wins
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 5: Multiple bibliography files

- [x] Write test: two .bib files → all ids merged
- [x] Write test: mixed formats (.bib + .json) → all ids merged
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 6: Error handling

- [x] Write test: invalid BibTeX → graceful error (empty or partial result)
- [x] Write test: file read failure → graceful error
- [x] Write test: empty bibliography list + no inline refs → empty BibliographyData
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
