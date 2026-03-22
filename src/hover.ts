import * as vscode from "vscode";
import * as fs from "fs";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import { parseCitationKey } from "./parser/citation-key";
import type { BibliographyCache } from "./resolver/bibliography-cache";
import { resolveDocumentBibliography } from "./resolver/document-bibliography";
import { linkifyUrls } from "./renderer/bibliography-renderer";

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

const CUSTOM_TEMPLATE_KEY = "__pandoc-citation-preview-hover__";

export interface HoverProviderOptions {
  enabled?: boolean;
  workspaceRoot?: string;
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  defaultBibliography?: string[];
  defaultCsl?: string;
  locale?: string;
  bibliographyCache?: BibliographyCache;
}

export function createCitationHoverProvider(
  options: HoverProviderOptions,
): vscode.HoverProvider {
  return {
    provideHover(document, position) {
      if (options.enabled === false) return null;

      const citationKey = findCitationKeyAtPosition(document, position);
      if (!citationKey) return null;

      const { bibData, cslStyle } = resolveDocumentBibliography({
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

      if (!bibData.ids.includes(citationKey)) return null;

      // Format single bibliography entry (same as bibliography section)
      const entry = bibData.cite.data.find(
        (e: { id: string }) => e.id === citationKey,
      );
      if (!entry) return null;

      const subset = new Cite([entry]);
      let template = "apa";
      if (cslStyle) {
        cslConfig.templates.add(CUSTOM_TEMPLATE_KEY, cslStyle);
        template = CUSTOM_TEMPLATE_KEY;
      }

      try {
        const html = linkifyUrls(
          String(subset.format("bibliography", { format: "html", template, ...(options.locale ? { lang: options.locale } : {}) })),
        );
        const md = new vscode.MarkdownString(html);
        md.supportHtml = true;
        return new vscode.Hover(md);
      } catch {
        return null;
      }
    },
  };
}

function findCitationKeyAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
): string | null {
  const line = document.lineAt(position.line).text;
  const col = position.character;

  for (let i = 0; i < line.length; i++) {
    if (line[i] !== "@") continue;
    // Skip email-like patterns: alphanumeric before @
    if (i > 0 && /[a-zA-Z0-9]/.test(line[i - 1])) continue;

    const result = parseCitationKey(line, i + 1);
    if (!result) continue;

    if (col >= i && col <= result.endPos) {
      return result.key;
    }
  }
  return null;
}
