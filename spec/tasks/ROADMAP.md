# Roadmap

## Progress Tracking

| Phase | Task | Status | ADR |
|-------|------|--------|-----|
| 0 | [Test infrastructure setup](completed/20260320-01-test-infrastructure.md) | Done | — |
| 1 | [Citation key parser](completed/20260320-02-citation-key-parser.md) | Done | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 2 | [Locator term matcher](completed/20260320-03-locator-matcher.md) | Done | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 3 | [Single citation parser](completed/20260320-04-single-citation-parser.md) | Done | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 4 | [Bracket citation parser](completed/20260320-05-bracket-citation-parser.md) | Done | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 5 | [Inline citation parser](completed/20260320-06-inline-citation-parser.md) | Done | [ADR-004](../decisions/ADR-004-citation-syntax-scope.md) |
| 6 | [YAML metadata extractor](completed/20260320-07-yaml-metadata-extractor.md) | Done | [ADR-002](../decisions/ADR-002-yaml-full-document-scan.md) |
| 7 | [File path resolver](completed/20260320-08-file-path-resolver.md) | Done | [ADR-003](../decisions/ADR-003-file-path-resolution.md) |
| 8 | [Bibliography loader](completed/20260320-09-bibliography-loader.md) | Done | [ADR-001](../decisions/ADR-001-citation-js-for-rendering.md) |
| 9 | [Citation renderer](completed/20260320-10-citation-renderer.md) | Done | [ADR-001](../decisions/ADR-001-citation-js-for-rendering.md) |
| 10 | [Bibliography renderer](completed/20260320-11-bibliography-renderer.md) | Done | [ADR-001](../decisions/ADR-001-citation-js-for-rendering.md) |
| 11 | [markdown-it plugin integration](completed/20260320-12-markdownit-plugin.md) | Done | — |
| 12 | [Extension settings — file resolution](completed/20260321-13-settings-file-resolution.md) | Done | — |
| 13 | [Extension settings — enabled toggle](completed/20260321-14-settings-enabled.md) | Done | — |
| 14 | [Extension settings — locale](20260321-15-settings-locale.md) | Planned | — |
| 15 | [Extension settings — popover toggle](completed/20260321-16-settings-popover.md) | Done | — |

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

```
Phase 11 (plugin) ──→ Phase 12 (file resolution settings)
                  ──→ Phase 13 (enabled toggle)
                  ──→ Phase 14 (locale)
                  ──→ Phase 15 (popover toggle)
```

Phases 12–15 depend on Phase 11 but are independent of each other.
Phase 12 should be done first as it establishes the configuration infrastructure.
