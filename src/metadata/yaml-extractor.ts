import { parse as parseYaml } from "yaml";

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
function extractYamlBlocks(document: string): string[] {
  const lines = document.split("\n");
  const blocks: string[] = [];
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
          blocks.push(yamlLines.join("\n"));
        }
        continue;
      }
    }

    i++;
  }

  return blocks;
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
