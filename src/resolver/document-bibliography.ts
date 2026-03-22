import { extractCitationMetadata } from "../metadata/yaml-extractor";
import {
  loadBibliographySync,
  type BibliographyData,
} from "./bibliography";
import {
  resolvePath,
  resolveDefaultBibliography,
  resolveDefaultCsl,
  type ResolveContext,
} from "./file-resolver";

export { type BibliographyData } from "./bibliography";

/**
 * Result of resolving document bibliography and CSL style.
 */
export interface DocumentBibliographyResult {
  bibData: BibliographyData;
  cslStyle: string | null;
}

/**
 * Options for resolving document bibliography.
 */
export interface DocumentBibliographyOptions {
  /** Full text of the markdown document */
  documentText: string;
  /** File path of the markdown document */
  documentPath: string;
  /** Synchronous file reader */
  readFile: (path: string) => string;
  /** Check if a file exists */
  exists: (path: string) => boolean;
  /** Workspace root directory */
  workspaceRoot?: string;
  /** Search directories for bibliography files */
  searchDirectories?: string[];
  /** Search directories for CSL files */
  cslSearchDirectories?: string[];
  /** Default bibliography file paths from settings */
  defaultBibliography?: string[];
  /** Default CSL style from settings */
  defaultCsl?: string;
}

function dirName(filePath: string): string {
  const idx = filePath.lastIndexOf("/");
  return idx === -1 ? "" : filePath.slice(0, idx);
}

/**
 * Resolve bibliography data and CSL style from a document's text and settings.
 *
 * Extracts YAML metadata, resolves bibliography file paths,
 * loads bibliography entries, and resolves the CSL style.
 */
export function resolveDocumentBibliography(
  options: DocumentBibliographyOptions,
): DocumentBibliographyResult {
  const metadata = extractCitationMetadata(options.documentText);
  const mdFileDir = dirName(options.documentPath);

  const resolveCtx: ResolveContext = {
    mdFileDir,
    searchDirectories: options.searchDirectories ?? [],
    workspaceRoot: options.workspaceRoot ?? "",
    exists: options.exists,
  };

  // Resolve bibliography file paths from YAML metadata
  const bibPaths: string[] = [];
  for (const p of metadata.bibliography) {
    const r = resolvePath(p, resolveCtx);
    if (r) bibPaths.push(r);
  }

  // Add default bibliography paths
  if (options.defaultBibliography) {
    for (const d of resolveDefaultBibliography(
      options.defaultBibliography,
      resolveCtx,
    )) {
      if (!bibPaths.includes(d)) bibPaths.push(d);
    }
  }

  // Load bibliography data
  const bibData = loadBibliographySync({
    bibliographyPaths: bibPaths,
    inlineReferences: metadata.references,
    readFile: options.readFile,
  });

  // Resolve CSL style
  const cslCtx: ResolveContext = {
    ...resolveCtx,
    searchDirectories: options.cslSearchDirectories ?? [],
  };

  let cslStyle: string | null = null;

  // YAML csl field takes precedence
  if (metadata.csl) {
    const resolved = resolvePath(metadata.csl, cslCtx);
    if (resolved) {
      try {
        cslStyle = options.readFile(resolved);
      } catch {
        // skip unreadable CSL files
      }
    }
  }

  // Fall back to defaultCsl setting
  if (!cslStyle && options.defaultCsl) {
    cslStyle = resolveDefaultCsl(options.defaultCsl, cslCtx, options.readFile);
  }

  return { bibData, cslStyle };
}
