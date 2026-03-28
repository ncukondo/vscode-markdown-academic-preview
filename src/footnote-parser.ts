/**
 * Find inline footnote ^[...] at the given column position.
 * Returns the content text if the cursor is inside one, null otherwise.
 */
export function findInlineFootnoteAtPosition(
  line: string,
  col: number,
): string | null {
  let i = 0;
  while (i < line.length - 1) {
    if (line[i] === "^" && line[i + 1] === "[") {
      const start = i;
      let depth = 1;
      let j = i + 2;
      while (j < line.length && depth > 0) {
        if (line[j] === "[") depth++;
        if (line[j] === "]") depth--;
        j++;
      }
      if (depth === 0 && col >= start && col < j) {
        return line.slice(i + 2, j - 1);
      }
      i = j;
    } else {
      i++;
    }
  }
  return null;
}

/**
 * Find footnote reference [^id] at the given column position.
 * Returns the label if the cursor is inside one, null otherwise.
 * Excludes footnote definitions ([^id]:).
 */
export function findFootnoteRefAtPosition(
  line: string,
  col: number,
): string | null {
  const re = /\[\^([^\s\]]+)\](?!:)/g;
  let match;
  while ((match = re.exec(line)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (col >= start && col < end) {
      return match[1];
    }
  }
  return null;
}

/**
 * Find a footnote definition [^label]: ... in text lines.
 * Returns the content text including continuation paragraphs.
 */
export function findFootnoteDefinitionInText(
  lines: string[],
  label: string,
): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const defRe = new RegExp(`^\\[\\^${escaped}\\]:\\s*(.*)$`);

  for (let i = 0; i < lines.length; i++) {
    const match = defRe.exec(lines[i]);
    if (match) {
      const result = [match[1].trim()];
      // Collect continuation lines (indented by 4 spaces or tab)
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^(    |\t)/)) {
          result.push(lines[j].replace(/^(    |\t)/, ""));
        } else if (lines[j].trim() === "") {
          result.push("");
        } else {
          break;
        }
      }
      // Remove trailing empty lines
      while (result.length > 0 && result[result.length - 1] === "") {
        result.pop();
      }
      return result.join("\n");
    }
  }
  return null;
}
