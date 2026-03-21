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

- [x] Define `pandocCitationPreview.enabled`: `boolean` (default: `true`)
- [x] Add description

### Step 2: Handle enabled flag in plugin.ts

- [x] Write test: `enabled: false` → markdown-it plugin does not process citations (raw text preserved)
- [x] Write test: `enabled: true` (default) → normal operation
- [x] Add `enabled` to `PluginOptions`
- [x] Implement: early return when `enabled === false`
- [x] Lint & type check

### Step 3: Wire up in extension.ts

- [x] Read `enabled` from `vscode.workspace.getConfiguration`
- [x] Pass to `PluginOptions` and `HoverProviderOptions`
- [x] Hover provider returns null when `enabled === false`
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
