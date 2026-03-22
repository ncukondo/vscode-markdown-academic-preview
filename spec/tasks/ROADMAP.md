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
| 14 | [Extension settings — locale](completed/20260321-15-settings-locale.md) | Done | — |
| 15 | [Extension settings — popover toggle](completed/20260321-16-settings-popover.md) | Done | — |
| 16 | [Document bibliography provider](completed/20260322-16-document-bibliography-provider.md) | Done | — |
| 17 | [Citation completion provider](completed/20260322-17-citation-completion-provider.md) | Done | — |
| 18 | [Citation insert command (QuickPick)](completed/20260322-18-citation-insert-command.md) | Done | — |
| 19 | [Crossref type detector](completed/20260322-19-crossref-type-detector.md) | Done | [ADR-005](../decisions/ADR-005-crossref-support.md) |
| 20 | [Crossref plugin rendering (no numbering)](completed/20260322-20-crossref-plugin-rendering.md) | Done | [ADR-005](../decisions/ADR-005-crossref-support.md) |
| 21 | [Crossref definition scanner](completed/20260322-21-crossref-definition-scanner.md) | Done | [ADR-005](../decisions/ADR-005-crossref-support.md) |
| 22 | [Crossref numbering](completed/20260322-22-crossref-numbering.md) | Done | [ADR-005](../decisions/ADR-005-crossref-support.md) |
| 23 | [Crossref numbered rendering in plugin](completed/20260322-23-crossref-numbered-rendering.md) | Done | [ADR-005](../decisions/ADR-005-crossref-support.md) |
| 24 | [Crossref YAML configuration](completed/20260322-24-crossref-yaml-config.md) | Done | [ADR-005](../decisions/ADR-005-crossref-support.md) |

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

```
Phase 8 (bib loader) ──→ Phase 16 (doc bib provider) ──→ Phase 17 (completion)
Phase 6 (yaml) ─────────────────↑                    ──→ Phase 18 (insert command)
Phase 7 (resolver) ─────────────↑
```

Phases 17 and 18 depend on Phase 16 but are independent of each other (can be developed in parallel).

```
Phase 19 (crossref types) ──→ Phase 20 (plugin rendering, no numbering)
                                        ↓
Phase 21 (def scanner) ──→ Phase 22 (numbering) ──→ Phase 23 (numbered rendering)
                                                            ↓
                                                     Phase 24 (YAML config)
```

Phase 19 and 21 can be started independently (no dependency on each other).
Phase 20 depends on Phase 19. Phase 22 depends on Phase 21.
Phase 23 depends on both Phase 20 and Phase 22.
Phase 24 depends on Phase 23.
