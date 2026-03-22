# Task: Citation Insert Command (QuickPick)

## Purpose

コマンドパレットから「Pandoc Citation: Insert Citation」コマンドを実行すると、
QuickPick で文献一覧を検索・選択し、カーソル位置に引用を挿入する。
キーを覚えていない場合や一覧からブラウズしたい場合に有用。

## References

- Depends on: Phase 16 (Document Bibliography Provider)
- Source: `src/extension.ts` (コマンド登録箇所)
- VS Code API: `vscode.window.showQuickPick`, `vscode.commands.registerCommand`

## TDD Workflow

Each step follows Red-Green-Refactor:

1. **Red**: Write a failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Clean up while keeping tests green

## Steps

### Step 1: QuickPickItem の生成ロジック

文献データから QuickPickItem 配列を生成する純粋関数を作成する。

- [x] Write test: CSL-JSON エントリから QuickPickItem を生成 — `label`: `@key`, `description`: `Author (Year)`, `detail`: タイトル
- [x] Write test: 著者が複数の場合 → `Smith, Jones & Lee (2020)` 形式
- [x] Write test: 著者・年・タイトルが欠けている場合のフォールバック
- [x] Create stub `src/citation-picker.ts` (verify Red)
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 2: 挿入テキストの生成

選択されたエントリからカーソル位置に挿入するテキストを生成する。

- [x] Write test: 単一選択 → `[@key]` を挿入
- [x] Write test: 複数選択 → `[@key1; @key2; @key3]` を挿入
- [x] Implement (verify Green)
- [x] Lint & type check

### Step 3: コマンドの実装

VS Code コマンドとして QuickPick を表示し、選択結果をエディタに挿入する。

- [x] `pandocCitationPreview.insertCitation` コマンドの実装
- [x] アクティブエディタが Markdown でない場合は何もしない
- [x] QuickPick の `canPickMany: true` で複数選択を有効化
- [x] 選択後、カーソル位置に挿入テキストを insert
- [x] Lint & type check

### Step 4: package.json への登録

コマンドとキーバインドの設定を追加する。

- [x] `contributes.commands` にコマンドを追加
  - `command`: `pandocCitationPreview.insertCitation`
  - `title`: `Pandoc Citation: Insert Citation`
- [x] `contributes.keybindings` にデフォルトキーバインドを追加（任意）
  - `Ctrl+Shift+[` は VS Code 組み込みの fold と衝突するためスキップ
- [x] `activationEvents` にコマンドイベントを追加（必要に応じて）
  - `onLanguage:markdown` で既にカバー済み
- [x] Lint & type check

## Completion Checklist

- [x] All tests pass
- [x] Lint passes
- [x] Type check passes
- [x] Build succeeds
- [ ] Move file to `spec/tasks/completed/`
