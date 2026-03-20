# Task: markdown-it Plugin Integration

## Purpose

Integrate all parser, resolver, and renderer modules into a markdown-it plugin that replaces Pandoc citation syntax with rendered HTML in VS Code's markdown preview. Also inject a bibliography section at the end of the document.

## References

- Depends on: all previous phases
- Source: `src/plugin.ts`, `src/extension.ts`

## TDD Workflow

Integration tests using markdown-it directly.

## API Design

```typescript
// markdown-it plugin
function pandocCitationPlugin(md: MarkdownIt, options?: PluginOptions): void;

interface PluginOptions {
  mdFilePath?: string;           // path to current markdown file
  workspaceRoot?: string;        // workspace root
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  defaultBibliography?: string[];
  defaultCsl?: string;
}
```

## Steps

### Step 1: Bracket citation rendering in markdown-it

- [x] Write test: `md.render("[@smith2020]")` with loaded bib → HTML contains rendered citation
- [x] Write test: `md.render("[@unknown]")` → HTML contains warning/fallback
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Inline citation rendering in markdown-it

- [ ] Write test: `md.render("@smith2020 says")` with loaded bib → HTML contains author-style citation
- [ ] Write test: `md.render("@smith2020 [p. 10] says")` → citation with locator
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: Bibliography injection

- [ ] Write test: document with citations → rendered HTML ends with bibliography section
- [ ] Write test: document with `nocite: @*` → all bib entries in bibliography
- [ ] Write test: document with no citations and no nocite → no bibliography section
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: YAML metadata integration

- [ ] Write test: document with frontmatter `bibliography: refs.bib` → bibliography loaded and used
- [ ] Write test: document with `csl: ieee.csl` → citation style applied
- [ ] Write test: document with inline `references` → used for rendering
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 5: Citations do not interfere with other markdown

- [ ] Write test: email addresses not parsed as citations
- [ ] Write test: code blocks with `@` not parsed as citations
- [ ] Write test: links with `@` in URL not parsed as citations
- [ ] Write test: normal markdown (headings, bold, lists) unaffected
- [ ] Create stub (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 6: VS Code extension wiring

- [ ] Verify `extension.ts` correctly passes options from VS Code settings to plugin
- [ ] Verify `contributes.markdown.markdownItPlugins` activates the plugin
- [ ] Manual test in VS Code

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Manual test in VS Code passes
- [ ] Move file to `spec/tasks/completed/`
