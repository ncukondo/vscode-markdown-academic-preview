#!/bin/bash
# Hook: block-dangerous-commands.sh
# PreToolUse hook for Bash commands.
# Blocks destructive or dangerous commands.

set -e

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Patterns to block (case insensitive matching where needed)
BLOCKED=false
REASON=""

# rm -rf / rm -r (recursive delete)
if echo "$COMMAND" | grep -qE '\brm\s+(-[a-zA-Z]*r|-[a-zA-Z]*f|--recursive|--force)'; then
  BLOCKED=true
  REASON="Recursive or forced rm detected"
fi

# git push --force / git push -f
if echo "$COMMAND" | grep -qE '\bgit\s+push\s+.*(-f|--force)'; then
  BLOCKED=true
  REASON="Force push detected"
fi

# git reset --hard
if echo "$COMMAND" | grep -qE '\bgit\s+reset\s+--hard'; then
  BLOCKED=true
  REASON="git reset --hard detected"
fi

# git clean -f
if echo "$COMMAND" | grep -qE '\bgit\s+clean\s+.*-[a-zA-Z]*f'; then
  BLOCKED=true
  REASON="git clean -f detected"
fi

# drop database / drop table (SQL injection prevention)
if echo "$COMMAND" | grep -qiE '\bdrop\s+(database|table)\b'; then
  BLOCKED=true
  REASON="SQL DROP detected"
fi

# chmod 777
if echo "$COMMAND" | grep -qE '\bchmod\s+777\b'; then
  BLOCKED=true
  REASON="chmod 777 detected"
fi

# curl/wget piped to sh/bash (remote code execution)
if echo "$COMMAND" | grep -qE '(curl|wget)\s.*\|\s*(bash|sh|zsh)'; then
  BLOCKED=true
  REASON="Remote code execution pattern detected"
fi

if [ "$BLOCKED" = "true" ]; then
  echo "BLOCKED: $REASON — command: $COMMAND" >&2
  exit 2
fi

exit 0
