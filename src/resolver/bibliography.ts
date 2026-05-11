import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import { parse as parseYaml } from "yaml";
import type { CslReference } from "../metadata/yaml-extractor";

/** A single CSL bibliography entry. Shape mirrors what citation-js stores in `cite.data`. */
export interface CslEntry {
  id: string;
  [key: string]: unknown;
}

export interface BibliographyData {
  /** Load-order list of entry ids (after dedup + inline-reference merge). */
  ids: string[];
  /** O(1) lookup index: id → CSL entry. Built once per load. */
  entriesById: Map<string, CslEntry>;
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

/**
 * Parse a bibliography file into raw CSL entries WITHOUT running them through
 * citation-js normalization.
 *
 * - JSON / YAML: parsed directly into the entry array (already CSL-shape).
 *   Accepts either a top-level array or a Pandoc-style `{ references: [...] }`
 *   wrapper.
 * - BibTeX and others: must go through citation-js, which both parses the
 *   format and normalizes. Returns the entries from a temporary Cite.
 */
function parseFileEntries(content: string, filePath: string): CslEntry[] {
  if (!content) return [];

  if (isJsonFile(filePath)) {
    return normalizeParsedEntries(JSON.parse(content));
  }

  if (isYamlFile(filePath)) {
    return normalizeParsedEntries(parseYaml(content));
  }

  // BibTeX and other formats: must use citation-js to parse.
  // This still pays the citation-js cost, but typical BibTeX files are small.
  const tmp = new Cite(content);
  return tmp.data as CslEntry[];
}

/**
 * Normalize a JSON.parse / parseYaml result into a `CslEntry[]`.
 *
 * Accepts:
 *   - `[entry, entry, ...]` (CSL-JSON canonical)
 *   - `{ references: [entry, ...] }` (Pandoc-style YAML wrapper, also seen in JSON)
 *   - a single entry object
 */
function normalizeParsedEntries(parsed: unknown): CslEntry[] {
  if (Array.isArray(parsed)) {
    return parsed.filter((e): e is CslEntry => isCslEntry(e));
  }
  if (parsed && typeof parsed === "object") {
    const refs = (parsed as { references?: unknown }).references;
    if (Array.isArray(refs)) {
      return refs.filter((e): e is CslEntry => isCslEntry(e));
    }
  }
  return isCslEntry(parsed) ? [parsed] : [];
}

function isCslEntry(value: unknown): value is CslEntry {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string"
  );
}

function buildBibliographyData(
  fileEntries: CslEntry[][],
  inlineReferences: CslReference[],
): BibliographyData {
  const entriesById = new Map<string, CslEntry>();
  const ids: string[] = [];

  // First-wins dedup across files
  for (const entries of fileEntries) {
    for (const entry of entries) {
      if (entriesById.has(entry.id)) continue;
      entriesById.set(entry.id, entry);
      ids.push(entry.id);
    }
  }

  // Inline references override file entries with the same id;
  // new ids are appended to the end (preserves prior load order otherwise).
  if (inlineReferences.length > 0) {
    for (const ref of inlineReferences) {
      if (!entriesById.has(ref.id)) {
        ids.push(ref.id);
      }
      entriesById.set(ref.id, ref as CslEntry);
    }
  }

  return { ids, entriesById };
}

export async function loadBibliography(
  options: LoadOptions,
): Promise<BibliographyData> {
  const fileEntries: CslEntry[][] = [];

  for (const filePath of options.bibliographyPaths) {
    try {
      const content = await options.readFile(filePath);
      fileEntries.push(parseFileEntries(content, filePath));
    } catch (e) {
      console.warn(
        `[markdown-academic-preview] Failed to load bibliography: ${filePath}`,
        e,
      );
    }
  }

  return buildBibliographyData(fileEntries, options.inlineReferences);
}

export function loadBibliographySync(
  options: LoadSyncOptions,
): BibliographyData {
  const fileEntries: CslEntry[][] = [];

  for (const filePath of options.bibliographyPaths) {
    try {
      const content = options.readFile(filePath);
      if (content) {
        fileEntries.push(parseFileEntries(content, filePath));
      }
    } catch (e) {
      console.warn(
        `[markdown-academic-preview] Failed to load bibliography: ${filePath}`,
        e,
      );
    }
  }

  return buildBibliographyData(fileEntries, options.inlineReferences);
}
