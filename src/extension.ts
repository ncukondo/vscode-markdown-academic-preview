import type MarkdownIt from "markdown-it";
import * as vscode from "vscode";
import { pandocCitationPlugin } from "./plugin";
import type { PluginOptions } from "./plugin";
import { createCitationHoverProvider } from "./hover";
import { createCitationCompletionProvider } from "./completion-provider";
import { BibliographyCache } from "./resolver/bibliography-cache";
import { resolveDocumentBibliography } from "./resolver/document-bibliography";
import { readExtensionSettings } from "./settings";
import { toQuickPickItems, buildInsertText } from "./citation-picker";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const config = vscode.workspace.getConfiguration("markdownAcademicPreview");
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

  // Register insert citation command
  const insertCitationCommand = vscode.commands.registerCommand(
    "markdownAcademicPreview.insertCitation",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== "markdown") return;

      const { bibData } = resolveDocumentBibliography({
        documentText: editor.document.getText(),
        documentPath: editor.document.uri.fsPath,
        readFile: (p: string) => fs.readFileSync(p, "utf-8"),
        exists: (p: string) => fs.existsSync(p),
        workspaceRoot,
        searchDirectories: settings.searchDirectories,
        cslSearchDirectories: settings.cslSearchDirectories,
        defaultBibliography: settings.defaultBibliography,
        defaultCsl: settings.defaultCsl,
        bibliographyCache: bibCache,
      });

      if (bibData.ids.length === 0) {
        vscode.window.showInformationMessage(
          "No bibliography entries found in the current document.",
        );
        return;
      }

      const items = toQuickPickItems(bibData.cite.data);
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Search and select citations to insert",
        canPickMany: true,
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (!selected || selected.length === 0) return;

      const text = buildInsertText(selected.map((s) => s.citationKey));
      await editor.edit((editBuilder) => {
        editBuilder.insert(editor.selection.active, text);
      });
    },
  );
  context.subscriptions.push(insertCitationCommand);

  // Register completion provider for citation keys
  if (settings.completionEnabled !== false) {
    const completionProvider = createCitationCompletionProvider({
      workspaceRoot,
      ...settings,
      bibliographyCache: bibCache,
    });
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        "markdown",
        completionProvider,
        "@",
      ),
    );
  }

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
