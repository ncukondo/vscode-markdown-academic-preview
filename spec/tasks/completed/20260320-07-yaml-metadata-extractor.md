# Task: YAML Metadata Extractor

## Purpose

Extract citation-related metadata (`bibliography`, `csl`, `references`, `nocite`) from YAML blocks throughout a Pandoc markdown document. Supports multiple YAML blocks with merge semantics.

## References

- ADR: `spec/decisions/ADR-002-yaml-full-document-scan.md`
- Source: `src/metadata/yaml-extractor.ts`

## TDD Workflow

Each step follows Red-Green-Refactor.

## API Design

```typescript
interface CitationMetadata {
  bibliography: string[];        // list of file paths
  csl: string | null;            // CSL style file path
  references: CslReference[];    // inline bibliography entries
  nocite: string[];              // list of citation keys (or ["*"] for all)
}

function extractCitationMetadata(document: string): CitationMetadata;
```

## Steps

### Step 1: Single frontmatter block

- [ ] Write test: `---\nbibliography: refs.bib\n---\ntext` → `{ bibliography: ["refs.bib"], ... }`
- [ ] Write test: `---\nbibliography:\n  - a.bib\n  - b.bib\n---` → `{ bibliography: ["a.bib", "b.bib"], ... }`
- [ ] Write test: `---\ncsl: ieee.csl\n---` → `{ csl: "ieee.csl", ... }`
- [ ] Write test: no YAML block → default empty result
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: YAML block with `...` terminator

- [ ] Write test: `---\nbibliography: refs.bib\n...\ntext` → parsed correctly
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: Multiple YAML blocks (merge, later wins)

- [ ] Write test: `---\nbibliography: a.bib\n---\ntext\n\n---\nbibliography: b.bib\n---` → `{ bibliography: ["b.bib"] }`
- [ ] Write test: `---\nbibliography: a.bib\n---\ntext\n\n---\ncsl: ieee.csl\n---` → both fields populated
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: Non-frontmatter YAML block requires preceding blank line

- [ ] Write test: YAML block in middle with blank line before → parsed
- [ ] Write test: YAML block in middle without blank line before → skipped
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 5: Skip YAML-like content inside fenced code blocks

- [ ] Write test: `` ```\n---\nbibliography: fake.bib\n---\n``` `` → not extracted
- [ ] Write test: `~~~\n---\nbibliography: fake.bib\n---\n~~~` → not extracted
- [ ] Write test: fenced code block followed by real YAML block → only real block extracted
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 6: Inline references field

- [ ] Write test: YAML with `references` containing one CSL entry → parsed into `references` array
- [ ] Write test: YAML with `references` containing multiple entries → all parsed
- [ ] Write test: `references` merged from multiple blocks → later wins
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 7: nocite field

- [ ] Write test: `nocite: |\n  @item1, @item2` → `{ nocite: ["item1", "item2"] }`
- [ ] Write test: `nocite: |\n  @*` → `{ nocite: ["*"] }`
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 8: Unrelated YAML fields are ignored

- [ ] Write test: `---\ntitle: Hello\nauthor: Me\nbibliography: refs.bib\n---` → only `bibliography` extracted
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
