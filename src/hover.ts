import * as vscode from "vscode";
import * as fs from "fs";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import { parseCitationKey } from "./parser/citation-key";
import { extractCitationMetadata } from "./metadata/yaml-extractor";
import { loadBibliographySync } from "./resolver/bibliography";
import {
  resolvePath,
  resolveDefaultBibliography,
  resolveDefaultCsl,
} from "./resolver/file-resolver";
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
  workspaceRoot?: string;
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  defaultBibliography?: string[];
  defaultCsl?: string;
}

export function createCitationHoverProvider(
  options: HoverProviderOptions,
): vscode.HoverProvider {
  return {
    provideHover(document, position) {
      const citationKey = findCitationKeyAtPosition(document, position);
      if (!citationKey) return null;

      const text = document.getText();
      const metadata = extractCitationMetadata(text);

      const mdFilePath = document.uri.fsPath;
      const mdFileDir = dirName(mdFilePath);

      const resolveCtx = {
        mdFileDir,
        searchDirectories: options.searchDirectories || [],
        workspaceRoot: options.workspaceRoot || "",
        exists: (p: string) => fs.existsSync(p),
      };

      const bibPaths: string[] = [];
      for (const p of metadata.bibliography) {
        const r = resolvePath(p, resolveCtx);
        if (r) bibPaths.push(r);
      }
      if (options.defaultBibliography) {
        for (const d of resolveDefaultBibliography(
          options.defaultBibliography,
          resolveCtx,
        )) {
          if (!bibPaths.includes(d)) bibPaths.push(d);
        }
      }

      const bibData = loadBibliographySync({
        bibliographyPaths: bibPaths,
        inlineReferences: metadata.references,
        readFile: (p: string) => fs.readFileSync(p, "utf-8"),
      });

      if (!bibData.ids.includes(citationKey)) return null;

      // Load CSL style (YAML csl field takes precedence over defaultCsl)
      let cslStyle: string | null = null;
      const cslCtx = {
        ...resolveCtx,
        searchDirectories: options.cslSearchDirectories || [],
      };
      if (metadata.csl) {
        const resolved = resolvePath(metadata.csl, cslCtx);
        if (resolved) {
          try {
            cslStyle = fs.readFileSync(resolved, "utf-8");
          } catch {
            // skip unreadable CSL files
          }
        }
      }
      if (!cslStyle && options.defaultCsl) {
        cslStyle = resolveDefaultCsl(
          options.defaultCsl,
          cslCtx,
          (p) => fs.readFileSync(p, "utf-8"),
        );
      }

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
          String(subset.format("bibliography", { format: "html", template })),
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

function dirName(filePath: string): string {
  const idx = filePath.lastIndexOf("/");
  return idx === -1 ? "" : filePath.slice(0, idx);
}
