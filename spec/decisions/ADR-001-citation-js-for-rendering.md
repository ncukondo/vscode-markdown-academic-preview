# ADR-001: citation-js for Citation Rendering

- **Date**: 2026-03-20
- **Status**: Accepted

## Context

This VS Code extension needs to:

- Parse bibliography files (BibTeX, CSL JSON, CSL YAML)
- Format in-text citations (e.g., "(Smith, 2020)")
- Generate bibliography lists with configurable citation styles (CSL)

A library is needed that handles these tasks without requiring external tools like Pandoc itself.

## Decision

Use **citation-js** (`@citation-js/core` + plugins) as the citation and bibliography engine.

- `.bib` → `@citation-js/plugin-bibtex`
- `.json` (CSL JSON) → `@citation-js/core` (native format)
- `.yaml` (CSL YAML) → parse with `js-yaml`, then feed as CSL JSON to core
- Inline `references` from YAML metadata → same as CSL YAML path
- CSL style application via `@citation-js/plugin-csl` (uses citeproc-js internally)
- Default style: APA (citation-js built-in; Chicago author-date is not available as a built-in style, and APA produces similar author-date output)

## Rationale

1. Supports BibTeX and CSL JSON natively, the two most common bibliography formats
2. CSL style support via citeproc-js gives access to thousands of citation styles
3. Pure JavaScript — no external binary dependencies, runs in VS Code extension host
4. Modular plugin architecture keeps bundle size manageable
5. Active maintenance and established community

## Consequences

### Positive
- No dependency on Pandoc binary
- Can format both in-text citations and full bibliographies
- Custom CSL styles can be registered at runtime

### Negative
- CSL YAML requires an extra YAML parsing step (not natively supported)
- Bundle size increases due to citeproc-js
- Some edge cases in BibTeX parsing may differ from Pandoc's behavior

### Neutral
- APA as default produces author-date output similar to Pandoc's Chicago author-date default; users can supply a custom Chicago CSL XML via cslStyle option

## Alternatives Considered

### citeproc-js directly
- **Description**: Use citeproc-js without the citation-js wrapper
- **Pros**: More control, smaller dependency
- **Cons**: No built-in BibTeX parser; requires manual CSL JSON construction
- **Why rejected**: citation-js provides the BibTeX parsing and convenient API on top of citeproc-js

### Calling Pandoc as subprocess
- **Description**: Shell out to `pandoc --citeproc` for rendering
- **Pros**: 100% compatible output
- **Cons**: Requires Pandoc installation; slow for preview; hard to integrate with markdown-it pipeline
- **Why rejected**: External dependency makes extension less portable

## References

- [citation-js documentation](https://citation.js.org/)
- [@citation-js/core](https://www.npmjs.com/package/@citation-js/core)
