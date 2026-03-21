import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import { extractCitationMetadata, extractNonFrontmatterYamlRanges } from "./metadata/yaml-extractor";
import { parseBracketCitation } from "./parser/bracket-citation";
import { parseInlineCitation } from "./parser/inline-citation";
import {
  type BibliographyData,
  loadBibliographySync,
} from "./resolver/bibliography";
import type { BibliographyCache } from "./resolver/bibliography-cache";
import { resolvePath, resolveDefaultBibliography, resolveDefaultCsl } from "./resolver/file-resolver";
import type { SingleCitation } from "./parser/single-citation";
import { linkifyUrls } from "./renderer/bibliography-renderer";

export interface PluginOptions {
  enabled?: boolean;
  mdFilePath?: string;
  workspaceRoot?: string;
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  defaultBibliography?: string[];
  defaultCsl?: string;
  locale?: string;
  popoverEnabled?: boolean;
  readFileSync?: (path: string) => string;
  existsSync?: (path: string) => boolean;
  bibliographyCache?: BibliographyCache;
}

export function pandocCitationPlugin(
  md: MarkdownIt,
  options?: PluginOptions,
): void {
  const opts = options ?? {};

  // Skip all processing when extension is disabled
  if (opts.enabled === false) return;

  // Shared state between core rule and renderers via closure
  // (VS Code may use different env objects for parse and render)
  let currentBibData: BibliographyData | undefined;
  let currentCslStyle: string | null = null;
  const currentLocale: string | undefined = opts.locale;
  let popoverCounter = 0;

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
    const citedIds = new Set<string>();

    // Extract YAML metadata from source
    const metadata = extractCitationMetadata(state.src);

    // Load bibliography synchronously (with caching if available)
    const bibPaths = resolveBibliographyPaths(metadata.bibliography, opts);
    const bibData = opts.bibliographyCache
      ? opts.bibliographyCache.load({
          bibliographyPaths: bibPaths,
          inlineReferences: metadata.references,
        })
      : loadBibliographySync({
          bibliographyPaths: bibPaths,
          inlineReferences: metadata.references,
          readFile: opts.readFileSync || (() => ""),
        });

    // Store in closure for renderers
    currentBibData = bibData;
    currentCslStyle = loadCslStyle(metadata.csl, opts);
    popoverCounter = 0;

    // Remove tokens generated from non-frontmatter YAML blocks
    const yamlRanges = extractNonFrontmatterYamlRanges(state.src);
    if (yamlRanges.length > 0) {
      state.tokens = state.tokens.filter((token) => {
        if (!token.map) return true;
        const [tokenStart, tokenEnd] = token.map;
        return !yamlRanges.some(
          ([yamlStart, yamlEnd]) => tokenStart >= yamlStart && tokenEnd <= yamlEnd,
        );
      });
    }

    // Walk tokens to collect cited IDs
    walkTokens(state.tokens, (token) => {
      if (token.type === "pandoc_citation") {
        const citations: SingleCitation[] = JSON.parse(token.content);
        for (const c of citations) {
          citedIds.add(c.id);
        }
      } else if (token.type === "pandoc_citation_inline") {
        const data = JSON.parse(token.content);
        citedIds.add(data.id);
      }
    });

    // Inject bibliography: replace ::: {#refs} ::: marker, or append at end
    const hasCitations = citedIds.size > 0;
    const hasNocite = metadata.nocite && metadata.nocite.length > 0;

    if ((hasCitations || hasNocite) && bibData.ids.length > 0) {
      const bibToken = new state.Token("pandoc_bibliography", "", 0);
      bibToken.content = JSON.stringify({
        citedIds: Array.from(citedIds),
        nocite: metadata.nocite || [],
      });

      // Look for ::: {#refs} ... ::: pattern in tokens
      const refsIdx = findRefsDivTokens(state.tokens);
      if (refsIdx) {
        // Replace the refs div tokens with bibliography
        const count = refsIdx.end - refsIdx.start + 1;
        state.tokens.splice(refsIdx.start, count, bibToken);
      } else {
        state.tokens.push(bibToken);
      }
    }
  });

  // --- Renderers ---

  const popoverEnabled = opts.popoverEnabled !== false;
  const getPopoverId = () => `pandoc-popover-${popoverCounter++}`;

  md.renderer.rules["pandoc_citation"] = (
    tokens: Token[],
    idx: number,
  ) => {
    const citations: SingleCitation[] = JSON.parse(tokens[idx].content);
    return renderBracketCitation(citations, currentBibData, currentCslStyle, popoverEnabled ? getPopoverId : null, currentLocale);
  };

  md.renderer.rules["pandoc_citation_inline"] = (
    tokens: Token[],
    idx: number,
  ) => {
    const data = JSON.parse(tokens[idx].content);
    return renderInlineCitation(data.id, data.locator, currentBibData, currentCslStyle, popoverEnabled ? getPopoverId : null, currentLocale);
  };

  md.renderer.rules["pandoc_bibliography"] = (
    tokens: Token[],
    idx: number,
  ) => {
    const data = JSON.parse(tokens[idx].content);
    return renderBibliographyHtml(
      data.citedIds,
      data.nocite,
      currentBibData,
      currentCslStyle,
      currentLocale,
    );
  };
}

// --- Rendering helpers ---

function renderBracketCitation(
  citations: SingleCitation[],
  bibData: BibliographyData | undefined,
  cslStyle: string | null,
  getPopoverId: (() => string) | null,
  locale?: string,
): string {
  if (!bibData || bibData.ids.length === 0) {
    return renderFallbackBracket(citations);
  }

  const knownIds = new Set(bibData.ids);
  const allKnown = citations.every((c) => knownIds.has(c.id));
  const knownCitations = citations.filter((c) => knownIds.has(c.id));
  const tooltipHtml = getPopoverId ? bibliographyTooltipHtml(knownCitations.map((c) => c.id), bibData, cslStyle, locale) : "";
  const popover = buildPopover(tooltipHtml, getPopoverId, knownCitations[0]?.id);

  if (!allKnown) {
    // Mix of known and unknown - render what we can, warn for unknowns
    const parts: string[] = [];
    for (const c of citations) {
      if (knownIds.has(c.id)) {
        parts.push(escapeHtml(renderSingleCitationText(c, bibData, cslStyle, locale)));
      } else {
        parts.push(`<span class="pandoc-citation-warning">@${escapeHtml(c.id)}</span>`);
      }
    }
    const inner = `(${parts.join("; ")})`;
    return `<cite class="pandoc-citation">${popover.wrapInvoker(inner)}</cite>${popover.element}`;
  }

  // All known - render using citation-js
  const text = renderCitationGroup(citations, bibData, cslStyle, locale);
  return `<cite class="pandoc-citation">${popover.wrapInvoker(escapeHtml(text))}</cite>${popover.element}`;
}

function renderFallbackBracket(citations: SingleCitation[]): string {
  const keys = citations.map((c) => `@${escapeHtml(c.id)}`).join("; ");
  return `<cite class="pandoc-citation pandoc-citation-warning">[${keys}]</cite>`;
}

function renderInlineCitation(
  id: string,
  locator: { label: string; value: string } | null,
  bibData: BibliographyData | undefined,
  cslStyle: string | null,
  getPopoverId: (() => string) | null,
  locale?: string,
): string {
  if (!bibData || !bibData.ids.includes(id)) {
    return `<cite class="pandoc-citation pandoc-citation-inline pandoc-citation-warning">@${escapeHtml(id)}</cite>`;
  }

  const langOpt = locale ? { lang: locale } : {};
  const subset = new Cite(bibData.cite.data.filter((e) => e.id === id));
  let text = String(subset.format("citation", { format: "text", template: cslStyle || "apa", ...langOpt }));

  // For inline citation, show "Author (Year)" style instead of "(Author, Year)"
  // Strip outer parentheses if present
  text = text.replace(/^\((.+)\)$/, "$1");

  if (locator) {
    text += `, ${locator.label} ${locator.value}`;
  }

  const tooltipHtml = getPopoverId ? bibliographyTooltipHtml([id], bibData, cslStyle, locale) : "";
  const popover = buildPopover(tooltipHtml, getPopoverId, id);

  return `<cite class="pandoc-citation pandoc-citation-inline">${popover.wrapInvoker(escapeHtml(text))}</cite>${popover.element}`;
}

function renderCitationGroup(
  citations: SingleCitation[],
  bibData: BibliographyData,
  cslStyle?: string | null,
  locale?: string,
): string {
  // Build a Cite with just the referenced entries
  const idSet = new Set(citations.map((c) => c.id));
  const entries = bibData.cite.data.filter((e) => idSet.has(e.id));
  if (entries.length === 0) return "";

  const langOpt = locale ? { lang: locale } : {};
  const subset = new Cite(entries);
  let text = String(subset.format("citation", { format: "text", template: cslStyle || "apa", ...langOpt }));

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

function bibliographyTooltipHtml(
  ids: string[],
  bibData: BibliographyData,
  cslStyle?: string | null,
  locale?: string,
): string {
  const entries = bibData.cite.data.filter((e: { id: string }) =>
    ids.includes(e.id),
  );
  if (entries.length === 0) return "";

  const langOpt = locale ? { lang: locale } : {};
  const subset = new Cite(entries);
  try {
    const html = String(
      subset.format("bibliography", {
        format: "html",
        template: cslStyle || "apa",
        ...langOpt,
      }),
    );
    return linkifyUrls(html);
  } catch {
    return "";
  }
}

function buildPopover(
  tooltipHtml: string,
  getPopoverId: (() => string) | null,
  refId?: string,
): { wrapInvoker: (content: string) => string; element: string } {
  if (!tooltipHtml || !getPopoverId) {
    return {
      wrapInvoker: (content) => content,
      element: "",
    };
  }
  const id = getPopoverId();
  const href = refId ? ` href="#ref-${refId}"` : "";
  return {
    wrapInvoker: (content) =>
      `<a${href} class="pandoc-citation-invoker" style="anchor-name: --${id}" interestfor="${id}">${content}</a>`,
    element: `<div popover="hint" id="${id}" class="pandoc-citation-popover" style="position-anchor: --${id}">${tooltipHtml}</div>`,
  };
}

function renderSingleCitationText(
  citation: SingleCitation,
  bibData: BibliographyData,
  cslStyle?: string | null,
  locale?: string,
): string {
  const entry = bibData.cite.data.find((e) => e.id === citation.id);
  if (!entry) return `@${citation.id}`;
  const langOpt = locale ? { lang: locale } : {};
  const subset = new Cite([entry]);
  let text = String(subset.format("citation", { format: "text", template: cslStyle || "apa", ...langOpt }));
  text = text.replace(/^\((.+)\)$/, "$1");
  return text;
}

function renderBibliographyHtml(
  citedIds: string[],
  nocite: string[],
  bibData: BibliographyData | undefined,
  cslStyle: string | null,
  locale?: string,
): string {
  if (!bibData || bibData.ids.length === 0) return "";

  // Determine which entries to include
  const includeIds = new Set(citedIds);
  const bibIdSet = new Set(bibData.ids);

  if (nocite.includes("*")) {
    // Include all entries
    for (const id of bibData.ids) {
      includeIds.add(id);
    }
  } else {
    for (const id of nocite) {
      if (bibIdSet.has(id)) {
        includeIds.add(id);
      }
    }
  }

  if (includeIds.size === 0) return "";

  const entries = bibData.cite.data.filter((e) => includeIds.has(e.id));
  if (entries.length === 0) return "";

  const langOpt = locale ? { lang: locale } : {};
  const subset = new Cite(entries);
  const html = String(
    subset.format("bibliography", {
      format: "html",
      template: cslStyle || "apa",
      ...langOpt,
    }),
  );

  return `<section class="pandoc-bibliography">${addBibEntryIds(linkifyUrls(html))}</section>`;
}

// --- Bibliography loading helpers ---

function resolveBibliographyPaths(
  metadataPaths: string[],
  opts: PluginOptions,
): string[] {
  if (!opts.existsSync) return metadataPaths;

  const context = {
    mdFileDir: opts.mdFilePath
      ? dirName(opts.mdFilePath)
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

function loadCslStyle(
  cslPath: string | null,
  opts: PluginOptions,
): string | null {
  const context = {
    mdFileDir: opts.mdFilePath
      ? dirName(opts.mdFilePath)
      : opts.workspaceRoot || "",
    searchDirectories: opts.cslSearchDirectories || [],
    workspaceRoot: opts.workspaceRoot || "",
    exists: opts.existsSync || (() => false),
  };

  // YAML csl field takes precedence
  if (cslPath && opts.readFileSync && opts.existsSync) {
    const resolved = resolvePath(cslPath, context);
    if (resolved) {
      try {
        return opts.readFileSync(resolved);
      } catch {
        // fall through to defaultCsl
      }
    }
  }

  // Fall back to defaultCsl setting
  if (!opts.defaultCsl) return null;

  if (opts.readFileSync) {
    return resolveDefaultCsl(opts.defaultCsl, context, opts.readFileSync);
  }

  // No readFileSync available — treat as built-in style name
  return opts.defaultCsl;
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

function findRefsDivTokens(tokens: Token[]): { start: number; end: number } | null {
  // Look for paragraph tokens containing ::: {#refs} and :::
  // Pattern 1: single paragraph "::: {#refs}\n:::" or "::: {#refs} :::"
  // Pattern 2: separate paragraphs for opening and closing
  const refsPattern = /^:{3,}\s*\{[^}]*#refs[^}]*\}/;
  const closingPattern = /^:{3,}\s*$/;

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== "inline") continue;
    const content = tokens[i].content;

    if (refsPattern.test(content)) {
      // Find the paragraph_open before this inline
      const pOpen = i - 1;
      if (pOpen < 0 || tokens[pOpen].type !== "paragraph_open") continue;

      // Check if closing ::: is in the same paragraph
      if (closingPattern.test(content.split("\n").pop() || "") && content.includes("\n")) {
        // Same paragraph: paragraph_open, inline, paragraph_close
        const pClose = i + 1;
        if (pClose < tokens.length && tokens[pClose].type === "paragraph_close") {
          return { start: pOpen, end: pClose };
        }
      }

      // Look for closing ::: in subsequent paragraphs
      for (let j = i + 2; j < tokens.length; j++) {
        if (tokens[j].type === "inline" && closingPattern.test(tokens[j].content)) {
          const closePClose = j + 1;
          if (closePClose < tokens.length && tokens[closePClose].type === "paragraph_close") {
            return { start: pOpen, end: closePClose };
          }
        }
      }

      // No closing found - just replace the opening paragraph
      const pClose = i + 1;
      if (pClose < tokens.length && tokens[pClose].type === "paragraph_close") {
        return { start: pOpen, end: pClose };
      }
    }
  }
  return null;
}

function dirName(filePath: string): string {
  const idx = filePath.lastIndexOf('/');
  return idx === -1 ? '' : filePath.slice(0, idx);
}

function addBibEntryIds(html: string): string {
  return html.replace(
    /data-csl-entry-id="([^"]+)"/g,
    'id="ref-$1" data-csl-entry-id="$1"',
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
