# Task: Extension Settings — Popover Toggle

## Purpose

Add `pandocCitationPreview.popoverEnabled` setting to toggle the citation popover (tooltip) in the Markdown preview. When disabled, citation text is rendered normally but without popover HTML elements.

## References

- Source: `src/plugin.ts` (popover generation), `src/extension.ts`
- Depends on: Phase 12 (configuration infrastructure)

## TDD Workflow

Each step follows Red-Green-Refactor.

## Steps

### Step 1: Add popoverEnabled setting to package.json

- [ ] Define `pandocCitationPreview.popoverEnabled`: `boolean` (default: `true`)
- [ ] Add description

### Step 2: Handle popoverEnabled in plugin.ts

- [ ] Write test: `popoverEnabled: false` → rendered HTML does not contain popover elements (`pandoc-citation-popover`)
- [ ] Write test: `popoverEnabled: false` → citation text still renders correctly
- [ ] Write test: `popoverEnabled: true` (default) → popovers are included
- [ ] Add `popoverEnabled?: boolean` to `PluginOptions`
- [ ] Implement: conditional popover generation
- [ ] Lint & type check

### Step 3: Wire up in extension.ts

- [ ] Read `popoverEnabled` from `vscode.workspace.getConfiguration`
- [ ] Pass to `PluginOptions`
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
