import { parse as parseYaml } from "yaml";
import { type CrossrefConfig, DEFAULT_CROSSREF_CONFIG } from "../crossref/types";

/**
 * Represents a CSL-JSON reference entry found in inline `references` metadata.
 * This is intentionally a loose type — we accept whatever the user provides
 * and pass it through to citation-js later.
 */
export interface CslReference {
  id: string;
  [key: string]: unknown;
}

/**
 * Citation-related metadata extracted from YAML blocks in a Pandoc markdown document.
 */
export interface CitationMetadata {
  /** List of bibliography file paths */
  bibliography: string[];
  /** CSL style file path, or null if not specified */
  csl: string | null;
  /** Inline bibliography entries (CSL-JSON objects) */
  references: CslReference[];
  /** List of citation keys for nocite, or ["*"] for all */
  nocite: string[];
}

/**
 * Returns a default (empty) CitationMetadata object.
 */
function defaultMetadata(): CitationMetadata {
  return {
    bibliography: [],
    csl: null,
    references: [],
    nocite: [],
  };
}

/**
 * Extract all YAML block bodies from a Pandoc markdown document.
 *
 * Rules (per Pandoc spec and ADR-002):
 * - A YAML block starts with `---` on its own line and ends with `---` or `...` on its own line.
 * - The first block (frontmatter) may appear at the very start of the document.
 * - Non-frontmatter blocks must be preceded by a blank line.
 * - YAML blocks inside fenced code blocks (``` or ~~~) are excluded.
 */
interface YamlBlock {
  content: string;
  /** Start line (0-based, inclusive — the `---` opening line) */
  startLine: number;
  /** End line (0-based, exclusive — line after the closing `---`/`...`) */
  endLine: number;
}

function isYamlMapping(content: string): boolean {
  try {
    const parsed = parseYaml(content);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

function extractYamlBlocksWithPositions(document: string): YamlBlock[] {
  const lines = document.split("\n");
  const blocks: YamlBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for fenced code block opening
    if (/^(`{3,}|~{3,})/.test(line)) {
      const fence = line.match(/^(`{3,}|~{3,})/)![1];
      const fenceChar = fence[0];
      const fenceLen = fence.length;
      i++;
      // Skip until matching closing fence
      while (i < lines.length) {
        const closingMatch = lines[i].match(/^(`{3,}|~{3,})\s*$/);
        if (
          closingMatch &&
          closingMatch[1][0] === fenceChar &&
          closingMatch[1].length >= fenceLen
        ) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Check for YAML block opening `---`
    if (/^---\s*$/.test(line)) {
      const isFirstLine = i === 0;
      const hasPrecedingBlankLine =
        i > 0 && /^\s*$/.test(lines[i - 1]);

      if (isFirstLine || hasPrecedingBlankLine) {
        const startLine = i;
        // Collect YAML content until closing `---` or `...`
        const yamlLines: string[] = [];
        i++;
        let closed = false;
        while (i < lines.length) {
          if (/^(---|\.\.\.)\s*$/.test(lines[i])) {
            closed = true;
            i++;
            break;
          }
          yamlLines.push(lines[i]);
          i++;
        }
        if (closed && yamlLines.length > 0) {
          const content = yamlLines.join("\n");
          if (isYamlMapping(content)) {
            blocks.push({
              content,
              startLine,
              endLine: i,
            });
          }
        }
        continue;
      }
    }

    i++;
  }

  return blocks;
}

function extractYamlBlocks(document: string): string[] {
  return extractYamlBlocksWithPositions(document).map((b) => b.content);
}

/**
 * Normalize a `bibliography` field value to an array of strings.
 * Pandoc accepts both a single string and an array of strings.
 */
function normalizeBibliography(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

/**
 * Normalize a `references` field value to an array of CslReference objects.
 */
function normalizeReferences(value: unknown): CslReference[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (v): v is CslReference =>
      typeof v === "object" && v !== null && typeof v.id === "string"
  );
}

/**
 * Normalize a `nocite` field value to an array of citation keys.
 *
 * Pandoc's nocite field is typically a YAML literal block scalar like:
 *   nocite: |
 *     @item1, @item2
 *
 * Or for all items:
 *   nocite: |
 *     @*
 */
function normalizeNocite(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  // Check for wildcard
  if (trimmed === "@*") {
    return ["*"];
  }

  // Extract citation keys: split by comma/semicolon/whitespace, then strip @
  const keys: string[] = [];
  const matches = trimmed.matchAll(/@([\w][\w:.#$%&\-+?<>~/]*|\*)/g);
  for (const match of matches) {
    keys.push(match[1]);
  }
  return keys;
}

/**
 * Extract citation-related metadata from YAML blocks throughout a Pandoc markdown document.
 *
 * Supports multiple YAML blocks with merge semantics (later blocks override earlier ones).
 * Only extracts citation-related fields: `bibliography`, `csl`, `references`, `nocite`.
 *
 * @param document - The full text content of a markdown document
 * @returns Merged citation metadata from all YAML blocks
 */
/**
 * Returns line ranges of non-frontmatter YAML blocks (blocks that appear after line 0).
 * Each range is [startLine, endLine) (0-based).
 */
export function extractNonFrontmatterYamlRanges(document: string): Array<[number, number]> {
  return extractYamlBlocksWithPositions(document)
    .filter((b) => b.startLine > 0)
    .map((b) => [b.startLine, b.endLine]);
}

const CROSSREF_PREFIX_KEYS: (keyof CrossrefConfig)[] = [
  "figPrefix", "tblPrefix", "eqnPrefix", "secPrefix", "lstPrefix",
];

/**
 * Extract crossref prefix configuration from YAML blocks in a Pandoc markdown document.
 * Supports `figPrefix`, `tblPrefix`, `eqnPrefix`, `secPrefix`, `lstPrefix`.
 * Missing fields use defaults from CROSSREF_DISPLAY_NAMES.
 */
export function extractCrossrefConfig(document: string): CrossrefConfig {
  const result: CrossrefConfig = { ...DEFAULT_CROSSREF_CONFIG };
  const yamlBlocks = extractYamlBlocks(document);

  for (const block of yamlBlocks) {
    let parsed: Record<string, unknown>;
    try {
      parsed = parseYaml(block) as Record<string, unknown>;
    } catch {
      continue;
    }
    if (typeof parsed !== "object" || parsed === null) continue;

    for (const key of CROSSREF_PREFIX_KEYS) {
      if (key in parsed && typeof parsed[key] === "string") {
        result[key] = parsed[key];
      }
    }
  }

  return result;
}

export function extractCitationMetadata(document: string): CitationMetadata {
  const result = defaultMetadata();
  const yamlBlocks = extractYamlBlocks(document);

  for (const block of yamlBlocks) {
    let parsed: Record<string, unknown>;
    try {
      parsed = parseYaml(block) as Record<string, unknown>;
    } catch {
      // Skip malformed YAML blocks
      continue;
    }

    if (typeof parsed !== "object" || parsed === null) {
      continue;
    }

    if ("bibliography" in parsed) {
      result.bibliography = normalizeBibliography(parsed.bibliography);
    }

    if ("csl" in parsed) {
      const csl = parsed.csl;
      result.csl = typeof csl === "string" ? csl : null;
    }

    if ("references" in parsed) {
      result.references = normalizeReferences(parsed.references);
    }

    if ("nocite" in parsed) {
      result.nocite = normalizeNocite(parsed.nocite);
    }
  }

  return result;
}
