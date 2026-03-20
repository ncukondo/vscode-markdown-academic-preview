import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-csl";
import { parse as parseYaml } from "yaml";
import { extractCitationMetadata } from "./metadata/yaml-extractor";
import { parseBracketCitation } from "./parser/bracket-citation";
import { parseInlineCitation } from "./parser/inline-citation";
import type { BibliographyData } from "./resolver/bibliography";
import { resolvePath, resolveDefaultBibliography } from "./resolver/file-resolver";
import type { SingleCitation } from "./parser/single-citation";

export interface PluginOptions {
  mdFilePath?: string;
  workspaceRoot?: string;
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  defaultBibliography?: string[];
  defaultCsl?: string;
  readFileSync?: (path: string) => string;
  existsSync?: (path: string) => boolean;
}

interface CitationEnv {
  bibliographyData?: BibliographyData;
  cslStyle?: string | null;
  citedIds?: Set<string>;
  nocite?: string[];
}

export function pandocCitationPlugin(
  md: MarkdownIt,
  options?: PluginOptions,
): void {
  const opts = options ?? {};

  // --- Inline rules ---

  // Bracketed citations: [@key], [@key, p. 10], [-@key], [@k1; @k2]
  md.inline.ruler.before(
    "link",
    "pandoc_citation_bracket",
    (state: StateInline, silent: boolean) => {
      const src = state.src;
      const start = state.pos;
      if (src.charCodeAt(start) !== 0x5b /* [ */) return false;

      const parsed = parseBracketCitation(src, start);
      if (!parsed) return false;

      if (!silent) {
        const token = state.push("pandoc_citation", "", 0);
        token.content = JSON.stringify(parsed.citations);
        token.markup = "[@]";
      }

      state.pos = parsed.endPos;
      return true;
    },
  );

  // Inline citations: @key (word boundary)
  md.inline.ruler.before(
    "link",
    "pandoc_citation_inline",
    (state: StateInline, silent: boolean) => {
      const src = state.src;
      const start = state.pos;
      if (src.charCodeAt(start) !== 0x40 /* @ */) return false;

      const parsed = parseInlineCitation(src, start);
      if (!parsed) return false;

      if (!silent) {
        const token = state.push("pandoc_citation_inline", "", 0);
        token.content = JSON.stringify({
          id: parsed.id,
          locator: parsed.locator,
        });
        token.markup = "@";
      }

      state.pos = parsed.endPos;
      return true;
    },
  );

  // --- Core rule: load bibliography and prepare rendering data ---
  md.core.ruler.push("pandoc_citation_resolve", (state: StateCore) => {
    const env: CitationEnv = (state.env.__citations = state.env.__citations || {});
    env.citedIds = new Set<string>();

    // Extract YAML metadata from source
    const metadata = extractCitationMetadata(state.src);

    // Load bibliography synchronously
    const bibPaths = resolveBibliographyPaths(metadata.bibliography, opts);
    const bibData = loadBibliographySync(bibPaths, metadata.references, opts);
    env.bibliographyData = bibData;
    env.nocite = metadata.nocite;

    // Load CSL style if specified
    env.cslStyle = loadCslStyle(metadata.csl, opts);

    // Walk tokens to collect cited IDs
    walkTokens(state.tokens, (token) => {
      if (token.type === "pandoc_citation") {
        const citations: SingleCitation[] = JSON.parse(token.content);
        for (const c of citations) {
          env.citedIds!.add(c.id);
        }
      } else if (token.type === "pandoc_citation_inline") {
        const data = JSON.parse(token.content);
        env.citedIds!.add(data.id);
      }
    });
  });

  // --- Renderers ---

  md.renderer.rules["pandoc_citation"] = (
    tokens: Token[],
    idx: number,
    _options: MarkdownIt.Options,
    env: Record<string, unknown>,
  ) => {
    const citEnv = (env.__citations || {}) as CitationEnv;
    const citations: SingleCitation[] = JSON.parse(tokens[idx].content);
    return renderBracketCitation(citations, citEnv);
  };

  md.renderer.rules["pandoc_citation_inline"] = (
    tokens: Token[],
    idx: number,
    _options: MarkdownIt.Options,
    env: Record<string, unknown>,
  ) => {
    const citEnv = (env.__citations || {}) as CitationEnv;
    const data = JSON.parse(tokens[idx].content);
    return renderInlineCitation(data.id, data.locator, citEnv);
  };
}

// --- Rendering helpers ---

function renderBracketCitation(
  citations: SingleCitation[],
  env: CitationEnv,
): string {
  const bibData = env.bibliographyData;
  if (!bibData || bibData.ids.length === 0) {
    return renderFallbackBracket(citations);
  }

  const knownIds = new Set(bibData.ids);
  const allKnown = citations.every((c) => knownIds.has(c.id));

  if (!allKnown) {
    // Mix of known and unknown - render what we can, warn for unknowns
    const parts: string[] = [];
    for (const c of citations) {
      if (knownIds.has(c.id)) {
        parts.push(renderSingleCitationText(c, bibData, env.cslStyle));
      } else {
        parts.push(`<span class="pandoc-citation-warning">@${escapeHtml(c.id)}</span>`);
      }
    }
    return `<cite class="pandoc-citation">(${parts.join("; ")})</cite>`;
  }

  // All known - render using citation-js
  const text = renderCitationGroup(citations, bibData, env.cslStyle);
  return `<cite class="pandoc-citation">${escapeHtml(text)}</cite>`;
}

function renderFallbackBracket(citations: SingleCitation[]): string {
  const keys = citations.map((c) => `@${escapeHtml(c.id)}`).join("; ");
  return `<cite class="pandoc-citation pandoc-citation-warning">[${keys}]</cite>`;
}

function renderInlineCitation(
  id: string,
  locator: { label: string; value: string } | null,
  env: CitationEnv,
): string {
  const bibData = env.bibliographyData;
  if (!bibData || !bibData.ids.includes(id)) {
    return `<cite class="pandoc-citation pandoc-citation-inline pandoc-citation-warning">@${escapeHtml(id)}</cite>`;
  }

  const subset = new Cite(bibData.cite.data.filter((e) => e.id === id));
  let text = String(subset.format("citation", { format: "text", template: env.cslStyle || "apa" }));

  // For inline citation, show "Author (Year)" style instead of "(Author, Year)"
  // Strip outer parentheses if present
  text = text.replace(/^\((.+)\)$/, "$1");

  if (locator) {
    text += `, ${locator.label} ${locator.value}`;
  }

  return `<cite class="pandoc-citation pandoc-citation-inline">${escapeHtml(text)}</cite>`;
}

function renderCitationGroup(
  citations: SingleCitation[],
  bibData: BibliographyData,
  cslStyle?: string | null,
): string {
  // Build a Cite with just the referenced entries
  const ids = citations.map((c) => c.id);
  const entries = bibData.cite.data.filter((e) => ids.includes(e.id));
  if (entries.length === 0) return "";

  const subset = new Cite(entries);
  let text = String(subset.format("citation", { format: "text", template: cslStyle || "apa" }));

  // Handle single citation with locator, prefix, suffix
  if (citations.length === 1) {
    const c = citations[0];
    // Strip outer parens for manipulation, re-add later
    const inner = text.replace(/^\((.+)\)$/, "$1");
    let result = inner;

    if (c.suppressAuthor) {
      // Extract just the year portion
      const yearMatch = inner.match(/\d{4}/);
      result = yearMatch ? yearMatch[0] : inner;
    }

    if (c.locator) {
      result += `, ${c.locator.label} ${c.locator.value}`;
    }

    if (c.prefix) {
      result = c.prefix + result;
    }
    if (c.suffix) {
      result += c.suffix;
    }

    text = `(${result})`;
  }

  return text;
}

function renderSingleCitationText(
  citation: SingleCitation,
  bibData: BibliographyData,
  cslStyle?: string | null,
): string {
  const entry = bibData.cite.data.find((e) => e.id === citation.id);
  if (!entry) return `@${citation.id}`;
  const subset = new Cite([entry]);
  let text = String(subset.format("citation", { format: "text", template: cslStyle || "apa" }));
  text = text.replace(/^\((.+)\)$/, "$1");
  return text;
}

// --- Bibliography loading helpers ---

function resolveBibliographyPaths(
  metadataPaths: string[],
  opts: PluginOptions,
): string[] {
  if (!opts.existsSync) return metadataPaths;

  const context = {
    mdFileDir: opts.mdFilePath
      ? opts.mdFilePath.replace(/\/[^/]+$/, "")
      : opts.workspaceRoot || "",
    searchDirectories: opts.searchDirectories || [],
    workspaceRoot: opts.workspaceRoot || "",
    exists: opts.existsSync,
  };

  const resolved: string[] = [];
  for (const p of metadataPaths) {
    const r = resolvePath(p, context);
    if (r) resolved.push(r);
  }

  // Add default bibliography paths
  if (opts.defaultBibliography) {
    const defaults = resolveDefaultBibliography(opts.defaultBibliography, context);
    for (const d of defaults) {
      if (!resolved.includes(d)) resolved.push(d);
    }
  }

  return resolved;
}

function loadBibliographySync(
  paths: string[],
  inlineReferences: Array<{ id: string; [key: string]: unknown }>,
  opts: PluginOptions,
): BibliographyData {
  const cite = new Cite();

  for (const filePath of paths) {
    try {
      const content = opts.readFileSync
        ? opts.readFileSync(filePath)
        : "";
      if (content) {
        if (/\.ya?ml$/i.test(filePath)) {
          // YAML files need parsing first - reuse the yaml import from bibliography.ts
          // For simplicity, just add as-is (citation-js handles CSL JSON)
          cite.add(parseYaml(content));
        } else {
          cite.add(content);
        }
      }
    } catch {
      // Skip files that fail to read or parse
    }
  }

  // Merge inline references
  if (inlineReferences.length > 0) {
    const inlineIds = new Set(inlineReferences.map((r) => r.id));
    cite.data = cite.data.filter((entry) => !inlineIds.has(entry.id));
    cite.add(inlineReferences);
  }

  return { cite, ids: cite.getIds() };
}

function loadCslStyle(
  cslPath: string | null,
  opts: PluginOptions,
): string | null {
  if (!cslPath || !opts.readFileSync || !opts.existsSync) return null;

  const context = {
    mdFileDir: opts.mdFilePath
      ? opts.mdFilePath.replace(/\/[^/]+$/, "")
      : opts.workspaceRoot || "",
    searchDirectories: opts.cslSearchDirectories || [],
    workspaceRoot: opts.workspaceRoot || "",
    exists: opts.existsSync,
  };

  const resolved = resolvePath(cslPath, context);
  if (!resolved) return null;

  try {
    return opts.readFileSync(resolved);
  } catch {
    return null;
  }
}

// --- Utility ---

function walkTokens(tokens: Token[], fn: (token: Token) => void): void {
  for (const token of tokens) {
    fn(token);
    if (token.children) {
      walkTokens(token.children, fn);
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
