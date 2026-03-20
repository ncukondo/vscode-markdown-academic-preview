# Roadmap

## Progress Tracking

| Phase | Task | Status | ADR |
|-------|------|--------|-----|
| 0 | [Test infrastructure setup](completed/20260320-01-test-infrastructure.md) | Done | — |
| 1 | [Citation key parser](completed/20260320-02-citation-key-parser.md) | Done | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 2 | [Locator term matcher](completed/20260320-03-locator-matcher.md) | Done | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 3 | [Single citation parser](20260320-04-single-citation-parser.md) | Todo | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 4 | [Bracket citation parser](20260320-05-bracket-citation-parser.md) | Todo | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 5 | [Inline citation parser](20260320-06-inline-citation-parser.md) | Todo | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 6 | [YAML metadata extractor](completed/20260320-07-yaml-metadata-extractor.md) | Done | [ADR-002](../decisions/ADR-002-yaml-full-document-scan.md) |
| 7 | [File path resolver](20260320-08-file-path-resolver.md) | Todo | [ADR-003](../decisions/ADR-003-file-path-resolution.md) |
| 8 | [Bibliography loader](20260320-09-bibliography-loader.md) | Todo | [ADR-001](../decisions/ADR-001-citation-js-for-rendering.md) |
| 9 | [Citation renderer](20260320-10-citation-renderer.md) | Todo | [ADR-001](../decisions/ADR-001-citation-js-for-rendering.md) |
| 10 | [Bibliography renderer](20260320-11-bibliography-renderer.md) | Todo | [ADR-001](../decisions/ADR-001-citation-js-for-rendering.md) |
| 11 | [markdown-it plugin integration](20260320-12-markdownit-plugin.md) | Todo | — |

## Dependency Graph

```
Phase 1 (key) ──→ Phase 3 (single) ──→ Phase 4 (bracket)
                        ↑                      ↓
Phase 2 (locator) ──────┘               Phase 11 (plugin) ←── Phase 5 (inline)
                                               ↑
Phase 6 (yaml) ──→ Phase 7 (resolver) ──→ Phase 8 (bib loader)
                                               ↓
                                         Phase 9 (citation fmt)
                                               ↓
                                         Phase 10 (bibliography fmt)
```

Phases 1, 2, 6 can be started independently.
