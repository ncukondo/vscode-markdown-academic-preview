import type MarkdownIt from "markdown-it";
import * as vscode from "vscode";
import { pandocCitationPlugin } from "./plugin";
import type { PluginOptions } from "./plugin";
import { createCitationHoverProvider } from "./hover";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  // Register hover provider for citation tooltips
  const hoverProvider = createCitationHoverProvider({ workspaceRoot });
  context.subscriptions.push(
    vscode.languages.registerHoverProvider("markdown", hoverProvider),
  );

  return {
    extendMarkdownIt(md: MarkdownIt) {
      const options: PluginOptions = {
        workspaceRoot,
        // TODO: mdFilePath — not available from extendMarkdownIt; requires MarkdownPreviewManager hook
        // TODO: searchDirectories, cslSearchDirectories, defaultBibliography, defaultCsl — read from extension settings
        readFileSync: (filePath: string) => fs.readFileSync(filePath, "utf-8"),
        existsSync: (filePath: string) => fs.existsSync(filePath),
      };
      return md.use(pandocCitationPlugin, options);
    },
  };
}
