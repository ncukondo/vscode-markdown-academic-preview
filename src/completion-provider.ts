import * as vscode from "vscode";
import * as fs from "fs";
import { buildCompletionEntries, isInsideBracket } from "./completion";
import type { CslEntry } from "./completion";
import { resolveDocumentBibliography } from "./resolver/document-bibliography";
import type { BibliographyCache } from "./resolver/bibliography-cache";

export interface CompletionProviderOptions {
  workspaceRoot?: string;
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  defaultBibliography?: string[];
  defaultCsl?: string;
  bibliographyCache?: BibliographyCache;
}

export function createCitationCompletionProvider(
  options: CompletionProviderOptions,
): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(document, position) {
      const { bibData } = resolveDocumentBibliography({
        documentText: document.getText(),
        documentPath: document.uri.fsPath,
        readFile: (p: string) => fs.readFileSync(p, "utf-8"),
        exists: (p: string) => fs.existsSync(p),
        workspaceRoot: options.workspaceRoot,
        searchDirectories: options.searchDirectories,
        cslSearchDirectories: options.cslSearchDirectories,
        defaultBibliography: options.defaultBibliography,
        defaultCsl: options.defaultCsl,
        bibliographyCache: options.bibliographyCache,
      });

      if (bibData.ids.length === 0) return [];

      const line = document.lineAt(position.line).text;
      const col = position.character;
      const insideBracket = isInsideBracket(line, col);

      const cslEntries: CslEntry[] = bibData.cite.data;
      const entries = buildCompletionEntries(cslEntries, { insideBracket });

      return entries.map((entry) => {
        const item = new vscode.CompletionItem(
          entry.label,
          vscode.CompletionItemKind.Reference,
        );
        item.detail = entry.detail;
        item.documentation = entry.documentation;
        item.filterText = `@${entry.filterText}`;
        item.insertText = entry.insertText;
        item.sortText = entry.key;
        return item;
      });
    },
  };
}
