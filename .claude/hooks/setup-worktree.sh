#!/bin/bash
# Hook: setup-worktree.sh
# WorktreeCreate hook: creates a git worktree and places
# .claude/settings.local.json with full permissions for subagents.

set -e

INPUT=$(cat)
NAME=$(echo "$INPUT" | jq -r '.name')
CWD=$(echo "$INPUT" | jq -r '.cwd')

# Determine worktree path inside .claude/worktrees/
WORKTREE_PATH="${CWD}/.claude/worktrees/${NAME}"

# Create git worktree
git -C "$CWD" worktree add "$WORKTREE_PATH" -b "worktree-${NAME}" HEAD >&2 2>&1

# Create .claude directory and settings.local.json with full permissions
mkdir -p "${WORKTREE_PATH}/.claude"
cat > "${WORKTREE_PATH}/.claude/settings.local.json" <<'EOF'
{
  "permissions": {
    "allow": [
      "Read(/**)",
      "Edit(/**)",
      "Write(/**)",
      "Bash(*)"
    ]
  }
}
EOF

# Print the worktree path (required by WorktreeCreate)
echo "$WORKTREE_PATH"
