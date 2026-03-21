# Task: Extension Settings — File Resolution

## Purpose

Add `contributes.configuration` to package.json and wire up VS Code settings for file resolution options. Target settings:

- `pandocCitationPreview.defaultCsl` — Default CSL style name or file path
- `pandocCitationPreview.defaultBibliography` — Default bibliography file paths (array)
- `pandocCitationPreview.searchDirectories` — Search directories for bibliography files (array)
- `pandocCitationPreview.cslSearchDirectories` — Search directories for CSL files (array)

These are already defined in `PluginOptions` / `HoverProviderOptions` types but never populated from VS Code configuration.

## References

- Source: `src/extension.ts`, `src/plugin.ts`, `src/hover.ts`
- Existing TODO: `extension.ts:22`

## TDD Workflow

Each step follows Red-Green-Refactor.

## Steps

### Step 1: Add configuration schema to package.json

- [ ] Add `contributes.configuration` section with title `"Pandoc Citation Preview"`
- [ ] Define `pandocCitationPreview.defaultCsl`: `string` (default: `""`)
- [ ] Define `pandocCitationPreview.defaultBibliography`: `array` of `string` (default: `[]`)
- [ ] Define `pandocCitationPreview.searchDirectories`: `array` of `string` (default: `[]`)
- [ ] Define `pandocCitationPreview.cslSearchDirectories`: `array` of `string` (default: `[]`)
- [ ] Add English descriptions for each setting

### Step 2: Read settings in extension.ts and pass to plugin options

- [ ] Write test: settings reader helper function (mock `getConfiguration`)
- [ ] Implement: read values from `vscode.workspace.getConfiguration("pandocCitationPreview")`
- [ ] Pass settings to `PluginOptions` in `extendMarkdownIt`
- [ ] Pass settings to `createCitationHoverProvider`
- [ ] Lint & type check

### Step 3: defaultCsl behavior

- [ ] Write test: `defaultCsl` set to built-in style name (e.g. `"ieee"`) → renderers use that style
- [ ] Write test: `defaultCsl` set to file path → CSL file loaded and applied
- [ ] Write test: YAML metadata `csl` field takes precedence over `defaultCsl`
- [ ] Implement
- [ ] Lint & type check

### Step 4: defaultBibliography behavior

- [ ] Write test: `defaultBibliography` set to bib file path → citations resolved without YAML metadata
- [ ] Write test: both YAML `bibliography` and `defaultBibliography` present → both loaded
- [ ] Implement (plugin.ts already has `resolveDefaultBibliography` support — verify and wire up)
- [ ] Lint & type check

### Step 5: searchDirectories / cslSearchDirectories behavior

- [ ] Write test: `searchDirectories` specified → bibliography files resolved from those directories
- [ ] Write test: `cslSearchDirectories` specified → CSL files resolved from those directories
- [ ] Implement
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
