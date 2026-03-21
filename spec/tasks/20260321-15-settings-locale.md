# Task: Extension Settings — Locale

## Purpose

Add `pandocCitationPreview.locale` setting to control the language used for citation rendering. This affects locale-dependent strings such as "et al.", "and", "edited by", etc. via the CSL locale mechanism in citation-js.

## References

- Source: `src/renderer/citation-renderer.ts`, `src/renderer/bibliography-renderer.ts`, `src/plugin.ts`, `src/hover.ts`
- citation-js `format()` method accepts a `lang` option (e.g. `"en-US"`, `"de-DE"`)

## TDD Workflow

Each step follows Red-Green-Refactor.

## Steps

### Step 1: Add locale setting to package.json

- [ ] Define `pandocCitationPreview.locale`: `string` (default: `""`)
- [ ] Add description (examples: `"en-US"`, `"ja-JP"`, `"de-DE"`)
- [ ] Empty string means citation-js default (en-US)

### Step 2: Add locale support to citation-renderer

- [ ] Write test: `lang: "de-DE"` produces different output (e.g. "und" instead of "and")
- [ ] Add `locale?: string` to `CitationRenderOptions`
- [ ] Pass `lang` option to `format()` call in `renderCitation`
- [ ] Implement
- [ ] Lint & type check

### Step 3: Add locale support to bibliography-renderer

- [ ] Write test: `lang` option changes bibliography output locale
- [ ] Add `locale?: string` to `BibliographyRenderOptions`
- [ ] Pass `lang` option to `format()` call in `renderBibliography`
- [ ] Implement
- [ ] Lint & type check

### Step 4: Propagate locale through plugin.ts / hover.ts / extension.ts

- [ ] Add `locale?: string` to `PluginOptions`
- [ ] Pass locale to citation/bibliography renderers in plugin.ts
- [ ] Pass locale in hover.ts
- [ ] Read setting in extension.ts and pass to options
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
