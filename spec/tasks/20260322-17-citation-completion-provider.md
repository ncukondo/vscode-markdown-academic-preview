# Task: Citation Completion Provider

## Purpose

Markdown ファイル編集中に `@` を入力するとオートコンプリートで文献候補を表示し、選択した引用キーを挿入する。
VS Code の `CompletionItemProvider` を使用する。

## References

- Depends on: Phase 16 (Document Bibliography Provider)
- Source: `src/extension.ts` (登録箇所)
- VS Code API: `vscode.languages.registerCompletionItemProvider`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: CompletionItemProvider の基本構造

`@` をトリガー文字として CompletionItemProvider を作成する。

- [x] Write test: `provideCompletionItems()` にドキュメント + ポジション（`@` の直後）を渡すと CompletionItem 配列が返る
- [x] Write test: 文献がない場合は空配列を返す
- [x] Create stub `src/completion.ts` (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: CompletionItem の内容

各文献エントリから適切な CompletionItem を生成する。

- [x] Write test: `label` がキー名（例: `smith2020`）であること
- [x] Write test: `detail` に著者名 + 年（例: `Smith (2020)`）が含まれること
- [x] Write test: `documentation` にタイトルが含まれること
- [x] Write test: `filterText` にキー・著者名・タイトルが含まれること（ファジーマッチ対応）
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: 挿入テキストの生成

カーソル位置に応じて適切な挿入テキストを生成する。

- [x] Write test: `[` の中で `@` を入力した場合 → `@key` のみ挿入（ブラケット内）
- [x] Write test: それ以外の場合 → `[@key]` を挿入
- [x] Write test: `-@` のパターンで suppress-author の場合も正しく補完
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 4: extension.ts への登録

CompletionItemProvider を VS Code に登録する。

- [x] `extension.ts` で `registerCompletionItemProvider` を呼び出し
- [x] トリガー文字: `@`
- [x] `enabled` 設定による有効/無効の切り替え
- [x] Lint & type check

### Step 5: package.json の更新

必要な設定項目があれば追加する。

- [x] 補完機能の有効/無効トグル設定の追加を検討（`pandocCitationPreview.completionEnabled`）
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [x] Move file to `spec/tasks/completed/`
