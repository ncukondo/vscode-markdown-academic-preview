import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import { parse as parseYaml } from "yaml";
import type { CslReference } from "../metadata/yaml-extractor";

export interface BibliographyData {
  cite: Cite;
  ids: string[];
}

export interface LoadOptions {
  bibliographyPaths: string[];
  inlineReferences: CslReference[];
  readFile: (path: string) => string | Promise<string>;
}

export interface LoadSyncOptions {
  bibliographyPaths: string[];
  inlineReferences: CslReference[];
  readFile: (path: string) => string;
}

function isYamlFile(filePath: string): boolean {
  return /\.ya?ml$/i.test(filePath);
}

function isJsonFile(filePath: string): boolean {
  return /\.json$/i.test(filePath);
}

/** Remove duplicate entries by id, keeping the first occurrence (consistent with Pandoc). */
function deduplicateById(cite: Cite): void {
  const seen = new Set<string>();
  cite.data = cite.data.filter((entry: { id: string }) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function parseContent(content: string, filePath: string): unknown {
  if (isYamlFile(filePath)) {
    return parseYaml(content);
  }
  if (isJsonFile(filePath)) {
    return JSON.parse(content);
  }
  // BibTeX and other formats: pass as string for citation-js to parse
  return content;
}

export async function loadBibliography(
  options: LoadOptions,
): Promise<BibliographyData> {
  const cite = new Cite();

  for (const filePath of options.bibliographyPaths) {
    try {
      const content = await options.readFile(filePath);
      cite.add(parseContent(content, filePath));
    } catch (e) {
      console.warn(`[markdown-academic-preview] Failed to load bibliography: ${filePath}`, e);
    }
  }

  // Deduplicate entries with the same id across multiple files (first wins, consistent with Pandoc)
  deduplicateById(cite);

  // Merge inline references, overriding any existing entries with the same id
  if (options.inlineReferences.length > 0) {
    const inlineIds = new Set(options.inlineReferences.map((r) => r.id));
    cite.data = cite.data.filter((entry) => !inlineIds.has(entry.id));
    cite.add(options.inlineReferences);
  }

  return { cite, ids: cite.getIds() };
}

export function loadBibliographySync(
  options: LoadSyncOptions,
): BibliographyData {
  const cite = new Cite();

  for (const filePath of options.bibliographyPaths) {
    try {
      const content = options.readFile(filePath);
      if (content) {
        cite.add(parseContent(content, filePath));
      }
    } catch (e) {
      console.warn(`[markdown-academic-preview] Failed to load bibliography: ${filePath}`, e);
    }
  }

  // Deduplicate entries with the same id across multiple files (first wins, consistent with Pandoc)
  deduplicateById(cite);

  // Merge inline references, overriding any existing entries with the same id
  if (options.inlineReferences.length > 0) {
    const inlineIds = new Set(options.inlineReferences.map((r) => r.id));
    cite.data = cite.data.filter((entry) => !inlineIds.has(entry.id));
    cite.add(options.inlineReferences);
  }

  return { cite, ids: cite.getIds() };
}
