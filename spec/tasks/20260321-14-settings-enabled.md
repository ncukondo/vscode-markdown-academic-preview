# Task: Extension Settings — Enabled Toggle

## Purpose

Add `pandocCitationPreview.enabled` setting to allow users to enable/disable the extension per workspace. When disabled, both the markdown-it plugin and hover provider should be skipped entirely.

## References

- Source: `src/extension.ts`, `src/plugin.ts`
- Depends on: Phase 12 (configuration infrastructure)

## TDD Workflow

Each step follows Red-Green-Refactor.

## Steps

### Step 1: Add enabled setting to package.json

- [ ] Define `pandocCitationPreview.enabled`: `boolean` (default: `true`)
- [ ] Add description

### Step 2: Handle enabled flag in plugin.ts

- [ ] Write test: `enabled: false` → markdown-it plugin does not process citations (raw text preserved)
- [ ] Write test: `enabled: true` (default) → normal operation
- [ ] Add `enabled` to `PluginOptions`
- [ ] Implement: early return when `enabled === false`
- [ ] Lint & type check

### Step 3: Wire up in extension.ts

- [ ] Read `enabled` from `vscode.workspace.getConfiguration`
- [ ] Pass to `PluginOptions` and `HoverProviderOptions`
- [ ] Hover provider returns null when `enabled === false`
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
