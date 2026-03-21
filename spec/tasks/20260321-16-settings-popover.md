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

- [x] Define `pandocCitationPreview.popoverEnabled`: `boolean` (default: `true`)
- [x] Add description

### Step 2: Handle popoverEnabled in plugin.ts

- [x] Write test: `popoverEnabled: false` → rendered HTML does not contain popover elements (`pandoc-citation-popover`)
- [x] Write test: `popoverEnabled: false` → citation text still renders correctly
- [x] Write test: `popoverEnabled: true` (default) → popovers are included
- [x] Add `popoverEnabled?: boolean` to `PluginOptions`
- [x] Implement: conditional popover generation
- [x] Lint & type check

### Step 3: Wire up in extension.ts

- [x] Read `popoverEnabled` from `vscode.workspace.getConfiguration`
- [x] Pass to `PluginOptions`
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
