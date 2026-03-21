import type MarkdownIt from "markdown-it";
import * as vscode from "vscode";
import { pandocCitationPlugin } from "./plugin";
import type { PluginOptions } from "./plugin";
import { createCitationHoverProvider } from "./hover";
import { BibliographyCache } from "./resolver/bibliography-cache";
import { readExtensionSettings } from "./settings";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const config = vscode.workspace.getConfiguration("pandocCitationPreview");
  const settings = readExtensionSettings(config);

  const bibCache = new BibliographyCache({
    statSync: (p) => fs.statSync(p),
    readFile: (p) => fs.readFileSync(p, "utf-8"),
  });

  // Register hover provider for citation tooltips
  const hoverProvider = createCitationHoverProvider({
    workspaceRoot,
    ...settings,
    bibliographyCache: bibCache,
  });
  context.subscriptions.push(
    vscode.languages.registerHoverProvider("markdown", hoverProvider),
  );

  return {
    extendMarkdownIt(md: MarkdownIt) {
      const options: PluginOptions = {
        workspaceRoot,
        // TODO: mdFilePath — not available from extendMarkdownIt; requires MarkdownPreviewManager hook
        ...settings,
        readFileSync: (filePath: string) => fs.readFileSync(filePath, "utf-8"),
        existsSync: (filePath: string) => fs.existsSync(filePath),
        bibliographyCache: bibCache,
      };
      return md.use(pandocCitationPlugin, options);
    },
  };
}
