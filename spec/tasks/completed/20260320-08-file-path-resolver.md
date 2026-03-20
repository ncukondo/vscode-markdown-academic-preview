# Task: File Path Resolver

## Purpose

Resolve bibliography and CSL file paths from relative/absolute paths using the priority chain: markdown file directory → search directories → workspace root. Abstract filesystem access for testability.

## References

- ADR: `spec/decisions/ADR-003-file-path-resolution.md`
- Source: `src/resolver/file-resolver.ts`

## TDD Workflow

Each step follows Red-Green-Refactor.

## API Design

```typescript
interface ResolveContext {
  mdFileDir: string;              // directory containing the markdown file
  searchDirectories: string[];    // additional search paths
  workspaceRoot: string;          // workspace root directory
  exists: (path: string) => boolean | Promise<boolean>;  // injectable filesystem check
}

function resolvePath(filePath: string, context: ResolveContext): string | null;
```

## Steps

### Step 1: Absolute paths

- [x] Write test: `"/absolute/path/refs.bib"` → returned as-is (if exists)
- [x] Write test: absolute path that doesn't exist → `null`
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: Relative path resolved from markdown file directory

- [x] Write test: `"refs.bib"` with mdFileDir `/project/docs`, file exists at `/project/docs/refs.bib` → resolved
- [x] Write test: `"../bib/refs.bib"` with mdFileDir `/project/docs` → `/project/bib/refs.bib`
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: Fallback to search directories

- [x] Write test: `"refs.bib"` not in mdFileDir, exists in searchDirectories[0] → resolved
- [x] Write test: `"refs.bib"` not in first searchDir, exists in second → resolved
- [x] Write test: `"refs.bib"` not in any searchDir → falls through
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 4: Fallback to workspace root

- [x] Write test: `"refs.bib"` not in mdFileDir or searchDirs, exists at workspace root → resolved
- [x] Write test: not found anywhere → `null`
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 5: Default bibliography (when frontmatter has no bibliography field)

- [x] Write test: resolve default bibliography paths using same priority chain
- [x] Create stub (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
