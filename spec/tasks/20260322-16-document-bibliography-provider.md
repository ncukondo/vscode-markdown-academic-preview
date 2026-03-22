# Task: Document Bibliography Provider

## Purpose

hover.ts に埋め込まれている「ドキュメントから文献データを取得する」ロジックを共通モジュールとして抽出する。
これにより、hover / completion / insert-command の3機能が同一のインフラを再利用できるようになる。

## References

- Source: `src/hover.ts` (既存の文献解決ロジック)
- Source: `src/resolver/bibliography.ts`, `src/resolver/bibliography-cache.ts`
- Source: `src/metadata/yaml-extractor.ts`, `src/resolver/file-resolver.ts`
- Source: `src/settings.ts`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: Define DocumentBibliographyProvider interface and types

ドキュメントテキスト + ファイルパス + 設定から `BibliographyData` を返すインタフェースを定義する。

- [ ] Write test: `resolveDocumentBibliography()` に テキスト(YAMLフロントマター付き) + bibファイルパス + 設定を渡し、`BibliographyData` (cite, ids) が返ることを確認
- [ ] Create stub `src/resolver/document-bibliography.ts` (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: YAML metadata 連携

ドキュメントの YAML フロントマターから bibliography / csl / references を読み取り、文献を解決する。

- [ ] Write test: YAML `bibliography` フィールドからファイルパスを解決し文献をロード
- [ ] Write test: YAML `references` フィールド（インライン参照）をマージ
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: defaultBibliography / searchDirectories 連携

設定値をフォールバックとして使用する。

- [ ] Write test: `defaultBibliography` 設定のファイルも追加でロード
- [ ] Write test: `searchDirectories` を使ったパス解決
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: CSL スタイル解決

CSL スタイルの解決ロジックも共通化する。

- [ ] Write test: YAML `csl` フィールドから CSL ファイルを解決
- [ ] Write test: `defaultCsl` 設定のフォールバック
- [ ] Write test: YAML の `csl` が `defaultCsl` より優先されること
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 5: hover.ts をリファクタリング

hover.ts の文献解決ロジックを新モジュールに置き換える。既存テストが壊れないことを確認。

- [ ] hover.ts を `resolveDocumentBibliography()` を使うようリファクタリング
- [ ] 既存テスト・型チェック・ビルドが通ることを確認
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
