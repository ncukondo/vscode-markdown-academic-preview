# Task: Test Infrastructure Setup

## Purpose

Set up vitest as the test framework. Establish project structure separating pure logic from VS Code integration so that parser/resolver modules can be tested without the VS Code API.

## References

- Source: `src/extension.ts`

## Steps

### Step 1: Install vitest and configure

- [ ] Add vitest as devDependency
- [ ] Create `vitest.config.ts`
- [ ] Add `test` script to `package.json`
- [ ] Verify `npm test` runs (no tests yet, but exits cleanly)

### Step 2: Establish source directory structure

- [ ] Create directory layout:
  ```
  src/
    extension.ts
    parser/
    metadata/
    resolver/
    renderer/
  ```
- [ ] Verify build still works

### Step 3: Verify with a smoke test

- [ ] Write a trivial test to confirm vitest runs
- [ ] Verify `npm test` passes

## Completion Checklist

- [ ] `npm test` runs successfully
- [ ] `npm run build` still works
- [ ] Move file to `spec/tasks/completed/`
