---
name: code-with-task
description: Implements a task from spec/tasks in a git worktree following TDD. Use when working on a specific task by keyword.
---

# Task Implementation: $ARGUMENTS

CLAUDE.md, spec/_index.mdを起点として必要事項を確認後、spec/tasks内の `[prefix]-*$ARGUMENTS*.md` に一致するタスクファイルの実装に取り組みます（ファイルは該当のブランチ内, worktree内にしか無いことがあります）。

## Prerequisites

まず以下を確認:
- CLAUDE.md
- spec/_index.md（存在すれば）

## Worktree Setup

作業はgit worktree内で行います:

```bash
PARENT_DIR="$(cd "$(git rev-parse --show-toplevel)/.." && pwd)"
PROJECT_NAME="$(basename "$(git rev-parse --show-toplevel)")"
git worktree add "${PARENT_DIR}/${PROJECT_NAME}--worktrees/<branch-name>" -b <branch-name>
cd "${PARENT_DIR}/${PROJECT_NAME}--worktrees/<branch-name>"
npm install
```

**パス規則**: worktreeは必ずリポジトリの親ディレクトリ直下の `vscode-markdown-academic-preview--worktrees/` 内に作成

## IPC Status Reporting

worktreeルートの `.worker-status.json` にステータスを書き込む:

```bash
WORKTREE_ROOT="$(git rev-parse --show-toplevel)"
cat > "$WORKTREE_ROOT/.worker-status.json" <<IPCEOF
{
  "branch": "$(git branch --show-current)",
  "task_file": "<task file path>",
  "status": "<status>",
  "current_step": "<step description>",
  "pr_number": null,
  "error": null,
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
IPCEOF
```

ステータス値: `starting` → `in_progress` → `testing` → `creating_pr` → `completed` / `failed`

## Implementation Flow

### TDD Cycle
1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限の実装
3. **Refactor**: リファクタリング
4. 各ステップ完了後にcommit

### Progress Tracking
- ステップ完了毎にタスクファイルを更新し、commit
- 次の作業前にcontext残量を確認
- compactが必要になりそうなら作業を中断して報告

## Completion Checks

```bash
npm test
npm run build
```

## PR Creation

全テスト通過後:
```bash
gh pr create --title "feat: ..." --body "..."
```

## Work Boundaries

並列作業時のconflict回避のため:

- **worktree内での作業**: 実装 → テスト → PR作成まで
- **マージ後にmainブランチで**: ROADMAP.md更新とタスクファイルのcompleted/への移動
