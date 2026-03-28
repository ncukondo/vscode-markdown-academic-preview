import * as vscode from "vscode";
import {
  findInlineFootnoteAtPosition,
  findFootnoteRefAtPosition,
  findFootnoteDefinitionInText,
} from "./footnote-parser";

export function createFootnoteHoverProvider(): vscode.HoverProvider {
  return {
    provideHover(document, position) {
      const line = document.lineAt(position.line).text;
      const col = position.character;

      // Check for inline footnote ^[...]
      const inlineContent = findInlineFootnoteAtPosition(line, col);
      if (inlineContent) {
        const md = new vscode.MarkdownString(inlineContent);
        return new vscode.Hover(md);
      }

      // Check for reference footnote [^id]
      const label = findFootnoteRefAtPosition(line, col);
      if (label) {
        const lines: string[] = [];
        for (let i = 0; i < document.lineCount; i++) {
          lines.push(document.lineAt(i).text);
        }
        const content = findFootnoteDefinitionInText(lines, label);
        if (content) {
          const md = new vscode.MarkdownString(content);
          return new vscode.Hover(md);
        }
      }

      return null;
    },
  };
}
