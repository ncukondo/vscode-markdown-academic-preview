# Task: Crossref Definition Scanner

## Purpose

Scan a Markdown document for crossref definition targets (`{#fig:label}`, `{#tbl:label}`, etc.) and collect them with their document order. This provides the data needed for sequential numbering.

## References

- ADR: `spec/decisions/ADR-005-crossref-support.md`
- Source: `src/crossref/definition-scanner.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Define CrossrefDefinition type

Define the data structure for a scanned definition.

- [ ] Define `CrossrefDefinition`: `{ type: CrossrefType, label: string, order: number }`
- [ ] Define `CrossrefDefinitionMap`: `Map<string, CrossrefDefinition>` (keyed by full id like `fig:diagram`)
- [ ] Lint & type check

### Step 2: Scan for attribute-style definitions

Implement `scanCrossrefDefinitions(source: string)` to find `{#type:label}` patterns.

- [ ] Write test: `![Caption](img.png){#fig:diagram}` → finds `fig:diagram`
- [ ] Write test: `# Introduction {#sec:intro}` → finds `sec:intro`
- [ ] Write test: `$$ E=mc^2 $$ {#eq:einstein}` → finds `eq:einstein`
- [ ] Write test: `: Caption {#tbl:results}` → finds `tbl:results`
- [ ] Write test: `{#lst:code1}` → finds `lst:code1`
- [ ] Write test: `{#not-crossref}` → ignored (no known prefix)
- [ ] Write test: `{#fig:}` → ignored (empty label)
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: Order assignment

Definitions are numbered in document order, per type.

- [ ] Write test: two figures → `fig:a` gets order 1, `fig:b` gets order 2
- [ ] Write test: mixed types → each type has independent numbering (`fig:a`=1, `tbl:x`=1, `fig:b`=2)
- [ ] Write test: duplicate definition → first occurrence wins
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: Skip definitions inside code blocks

Definitions inside fenced code blocks should be ignored.

- [ ] Write test: `{#fig:inside}` within ``` ``` ``` fenced block → not found
- [ ] Write test: `{#fig:outside}` outside code block → found
- [ ] Implement (verify Green)
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
