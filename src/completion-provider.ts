import * as vscode from "vscode";
import * as fs from "fs";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import {
  buildCompletionEntries,
  buildCrossrefCompletionEntries,
  isInsideBracket,
} from "./completion";
import type { CslEntry } from "./completion";
import { scanCrossrefDefinitions } from "./crossref/definition-scanner";
import { resolveDocumentBibliography } from "./resolver/document-bibliography";
import { linkifyUrls } from "./renderer/bibliography-renderer";
import type { BibliographyCache } from "./resolver/bibliography-cache";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { plugins } = require("@citation-js/core") as {
  plugins: {
    config: {
      get(name: string): {
        templates: { add(name: string, xml: string): void };
      };
    };
  };
};
const cslConfig = plugins.config.get("@csl");
const CUSTOM_TEMPLATE_KEY = "__markdown-academic-preview-completion__";

export interface CompletionProviderOptions {
  workspaceRoot?: string;
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  defaultBibliography?: string[];
  defaultCsl?: string;
  locale?: string;
  bibliographyCache?: BibliographyCache;
}

export function createCitationCompletionProvider(
  options: CompletionProviderOptions,
): vscode.CompletionItemProvider {
  let cachedCslData: Map<string, unknown> = new Map();
  let cachedCslStyle: string | undefined;

  return {
    provideCompletionItems(document, position) {
      const documentText = document.getText();

      const { bibData, cslStyle } = resolveDocumentBibliography({
        documentText,
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

      cachedCslData = bibData.entriesById as Map<string, unknown>;
      cachedCslStyle = cslStyle ?? undefined;

      const line = document.lineAt(position.line).text;
      const col = position.character;
      const insideBracket = isInsideBracket(line, col);
      const context = { insideBracket };

      const atPosition = new vscode.Position(position.line, col - 1);
      const replaceRange = new vscode.Range(atPosition, position);

      // Bibliography completion entries
      const cslEntries: CslEntry[] = Array.from(bibData.entriesById.values()) as CslEntry[];
      const bibEntries = buildCompletionEntries(cslEntries, context);

      // Crossref completion entries
      const crossrefDefs = scanCrossrefDefinitions(documentText);
      const crossrefEntries = buildCrossrefCompletionEntries(crossrefDefs, context);

      const allEntries = [...bibEntries, ...crossrefEntries];
      if (allEntries.length === 0) return [];

      return allEntries.map((entry) => {
        const item = new vscode.CompletionItem(
          entry.label,
          vscode.CompletionItemKind.Reference,
        );
        item.detail = entry.detail;
        item.documentation = entry.documentation;
        item.filterText = `@${entry.filterText}`;
        item.insertText = entry.insertText;
        item.range = replaceRange;
        item.sortText = entry.key;
        return item;
      });
    },

    resolveCompletionItem(item) {
      const key = item.sortText;
      if (!key) return item;

      const entry = cachedCslData.get(key);
      if (!entry) return item;

      try {
        const subset = new Cite([entry]);
        let template = "apa";
        if (cachedCslStyle) {
          cslConfig.templates.add(CUSTOM_TEMPLATE_KEY, cachedCslStyle);
          template = CUSTOM_TEMPLATE_KEY;
        }

        const html = linkifyUrls(
          String(
            subset.format("bibliography", {
              format: "html",
              template,
              ...(options.locale ? { lang: options.locale } : {}),
            }),
          ),
        );
        const md = new vscode.MarkdownString(html);
        md.supportHtml = true;
        item.documentation = md;
      } catch {
        // Keep existing plain-text documentation as fallback
      }

      return item;
    },
  };
}
