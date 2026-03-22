# ADR-005: Pandoc-Crossref Reference Support

- **Date**: 2026-03-22
- **Status**: Accepted

## Context

pandoc-crossref is a Pandoc filter that provides cross-referencing for figures, tables, equations, sections, and code listings. While it shares the `@key` syntax with bibliography citations, it requires a fundamentally different data flow — definitions are extracted from the document itself rather than from external bibliography files.

### pandoc-crossref Reference Syntax

| Type | Prefix | Definition example | Reference example |
|------|--------|--------------------|-------------------|
| Figure | `fig:` | `![Caption](img.png){#fig:label}` | `@fig:label` |
| Table | `tbl:` | `: Caption {#tbl:label}` | `@tbl:label` |
| Equation | `eq:` | `$$ ... $$ {#eq:label}` | `@eq:label` |
| Section | `sec:` | `# Heading {#sec:label}` | `@sec:label` |
| Listing | `lst:` | `` Listing: Caption {#lst:label} `` | `@lst:label` |

## Decision

Support basic pandoc-crossref reference syntax incrementally.

### In Scope

1. **Reference type detection**: Recognize the 5 fixed prefixes (`fig:`, `tbl:`, `eq:`, `sec:`, `lst:`)
2. **Definition scanning**: Collect `{#type:label}` patterns from the document and assign sequential numbers by type
3. **Rendering**: Generate numbered reference text (e.g., "Figure 1", "Table 2")
4. **YAML configuration**: Support `figPrefix`, `tblPrefix`, etc. for display text customization

### Out of Scope (MVP)

- Combined multiple references: `[@fig:a; @fig:b]` → "Figures 1, 2"
- Range references: `[@fig:a-@fig:c]` → "Figures 1-3"
- Subfigures
- Chapter-based numbering ("Figure 1.1")

### Distinguishing Crossref from Bibliography

When a citation key starts with `fig:`, `tbl:`, `eq:`, `sec:`, or `lst:`, it is treated as a crossref reference and bibliography lookup is skipped. These 5 prefixes are hardcoded in pandoc-crossref, so collision risk is minimal.

## Rationale

1. **Fixed prefixes**: pandoc-crossref prefixes are hardcoded and not user-configurable, enabling deterministic detection
2. **Incremental delivery**: Recognition (without numbering) → definition scanning → numbering allows partial value at each stage
3. **Separation from existing architecture**: A dedicated `src/crossref/` module minimizes impact on existing citation functionality

## Consequences

### Positive
- Significantly improved preview experience for pandoc-crossref users
- Can be added without major changes to the existing citation parser

### Negative
- Full-document scanning required for definition collection; potential performance impact
- Does not cover all pandoc-crossref features (subfigures, range references, etc.)

### Neutral
- Out-of-scope features can be added later in a backward-compatible manner

## References

- [pandoc-crossref GitHub](https://github.com/lierdakil/pandoc-crossref)
- [pandoc-crossref manual](https://lierdakil.github.io/pandoc-crossref/)
