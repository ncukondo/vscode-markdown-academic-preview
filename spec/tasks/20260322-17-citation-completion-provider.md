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

- [ ] Write test: `provideCompletionItems()` にドキュメント + ポジション（`@` の直後）を渡すと CompletionItem 配列が返る
- [ ] Write test: 文献がない場合は空配列を返す
- [ ] Create stub `src/completion.ts` (verify Red)
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 2: CompletionItem の内容

各文献エントリから適切な CompletionItem を生成する。

- [ ] Write test: `label` がキー名（例: `smith2020`）であること
- [ ] Write test: `detail` に著者名 + 年（例: `Smith (2020)`）が含まれること
- [ ] Write test: `documentation` にタイトルが含まれること
- [ ] Write test: `filterText` にキー・著者名・タイトルが含まれること（ファジーマッチ対応）
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 3: 挿入テキストの生成

カーソル位置に応じて適切な挿入テキストを生成する。

- [ ] Write test: `[` の中で `@` を入力した場合 → `@key` のみ挿入（ブラケット内）
- [ ] Write test: それ以外の場合 → `[@key]` を挿入
- [ ] Write test: `-@` のパターンで suppress-author の場合も正しく補完
- [ ] Implement (verify Green)
- [ ] Lint & type check

### Step 4: extension.ts への登録

CompletionItemProvider を VS Code に登録する。

- [ ] `extension.ts` で `registerCompletionItemProvider` を呼び出し
- [ ] トリガー文字: `@`
- [ ] `enabled` 設定による有効/無効の切り替え
- [ ] Lint & type check

### Step 5: package.json の更新

必要な設定項目があれば追加する。

- [ ] 補完機能の有効/無効トグル設定の追加を検討（`pandocCitationPreview.completionEnabled`）
- [ ] Lint & type check

## Completion Checklist

- [ ] All tests pass
- [ ] Lint passes
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
