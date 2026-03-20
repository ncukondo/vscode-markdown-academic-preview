#!/bin/bash
# Hook: cleanup-worktree.sh
# WorktreeRemove hook: removes the git worktree and cleans up.

set -e

INPUT=$(cat)
WORKTREE_PATH=$(echo "$INPUT" | jq -r '.worktree_path // .cwd')

if [ -d "$WORKTREE_PATH" ] && [ -f "$WORKTREE_PATH/.git" ]; then
  # Find the main repo from the worktree
  MAIN_REPO=$(git -C "$WORKTREE_PATH" rev-parse --path-format=absolute --git-common-dir 2>/dev/null | sed 's|/.git$||')
  BRANCH=$(git -C "$WORKTREE_PATH" branch --show-current 2>/dev/null)

  # Remove worktree
  git -C "$MAIN_REPO" worktree remove "$WORKTREE_PATH" --force 2>/dev/null || rm -rf "$WORKTREE_PATH"

  # Delete worktree branch if it exists
  if [ -n "$BRANCH" ]; then
    git -C "$MAIN_REPO" branch -D "$BRANCH" 2>/dev/null || true
  fi

  # Prune
  git -C "$MAIN_REPO" worktree prune 2>/dev/null || true
fi

echo "removed" >&2
