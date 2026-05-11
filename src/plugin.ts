import type MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type StateCore from "markdown-it/lib/rules_core/state_core.mjs";
import type StateInline from "markdown-it/lib/rules_inline/state_inline.mjs";
import { Cite } from "@citation-js/core";
import "@citation-js/plugin-csl";
import { extractCitationMetadata, extractCrossrefConfig, extractNonFrontmatterYamlRanges } from "./metadata/yaml-extractor";
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
import { CROSSREF_DISPLAY_NAMES, CROSSREF_TYPE_TO_PREFIX_KEY, type CrossrefConfig, type CrossrefType, DEFAULT_CROSSREF_CONFIG, isCrossrefKey, parseCrossrefKey } from "./crossref/types";
import { renderCrossref } from "./crossref/crossref-renderer";
import { scanCrossrefDefinitions, type CrossrefDefinitionMap } from "./crossref/definition-scanner";
import { resolveCrossrefNumber } from "./crossref/numbering";
import { escapeHtml } from "./renderer/escape-html";
import { pandocFormattingPlugin } from "./pandoc-formatting";
import footnote from "markdown-it-footnote";

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

  // Add Pandoc subscript/superscript formatting rules
  pandocFormattingPlugin(md);

  // Add footnote support (reference [^id] and inline ^[...])
  md.use(footnote);

  // Override footnote renderers for Pandoc-compatible HTML output
  md.renderer.rules.footnote_ref = (tokens, idx, _options, env, slf) => {
    const id = slf.rules.footnote_anchor_name!(tokens, idx, _options, env, slf);
    let caption = Number(tokens[idx].meta.id + 1).toString();
    if (tokens[idx].meta.subId > 0) caption += `:${tokens[idx].meta.subId}`;
    let refid = id;
    if (tokens[idx].meta.subId > 0) refid += `:${tokens[idx].meta.subId}`;

    const tooltipHtml = currentFootnoteContents.get(tokens[idx].meta.id) || "";
    if (tooltipHtml && popoverEnabled) {
      const popoverId = getPopoverId();
      return `<a href="#fn${id}" class="footnote-ref pandoc-citation-invoker" id="fnref${refid}" role="doc-noteref" style="anchor-name: --${popoverId}" interestfor="${popoverId}"><sup>${caption}</sup></a><span popover="hint" id="${popoverId}" class="pandoc-citation-popover" style="position-anchor: --${popoverId}">${tooltipHtml}</span>`;
    }

    return `<a href="#fn${id}" class="footnote-ref" id="fnref${refid}" role="doc-noteref"><sup>${caption}</sup></a>`;
  };

  md.renderer.rules.footnote_block_open = () => {
    return '<section id="footnotes" class="footnotes footnotes-end-of-document" role="doc-endnotes">\n<hr />\n<ol>\n';
  };

  md.renderer.rules.footnote_block_close = () => {
    return '</ol>\n</section>\n';
  };

  md.renderer.rules.footnote_open = (tokens, idx, _options, env, slf) => {
    let id = slf.rules.footnote_anchor_name!(tokens, idx, _options, env, slf);
    if (tokens[idx].meta.subId > 0) id += `:${tokens[idx].meta.subId}`;
    return `<li id="fn${id}">\n`;
  };

  md.renderer.rules.footnote_close = () => {
    return '</li>\n';
  };

  md.renderer.rules.footnote_anchor = (tokens, idx, _options, env, slf) => {
    let id = slf.rules.footnote_anchor_name!(tokens, idx, _options, env, slf);
    if (tokens[idx].meta.subId > 0) id += `:${tokens[idx].meta.subId}`;
    return `<a href="#fnref${id}" class="footnote-back" role="doc-backlink">\u21a9\uFE0E</a>`;
  };

  // Shared state between core rule and renderers via closure
  // (VS Code may use different env objects for parse and render)
  let currentBibData: BibliographyData | undefined;
  let currentCslStyle: string | null = null;
  const currentLocale: string | undefined = opts.locale;
  let popoverCounter = 0;
  let currentCrossrefDefs: CrossrefDefinitionMap = new Map();
  let currentCrossrefConfig: CrossrefConfig = { ...DEFAULT_CROSSREF_CONFIG };
  let currentFootnoteContents: Map<number, string> = new Map();

  const popoverEnabled = opts.popoverEnabled !== false;
  const getPopoverId = () => `pandoc-popover-${popoverCounter++}`;

  // --- Source preprocessing ---
  // Strip {#type:label} from math block lines before KaTeX parses them.
  // e.g. "$$ E=mc^2 $$ {#eq:einstein}" → "$$ E=mc^2 $$\n{#eq:einstein}"
  const originalParse = md.parse.bind(md);
  md.parse = (src: string, env: unknown) => {
    const preprocessed = src.replace(
      /(\$\$[^$]*\$\$)\s*(\{#(?:fig|tbl|eq|sec|lst):[a-zA-Z0-9_][\w-]*\})/g,
      "$1\n$2",
    );
    return originalParse(preprocessed, env);
  };

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

  // --- Core rule: extract footnote content for popovers ---
  // Runs after footnote_tail (which assembles footnote tokens from env.footnotes.list)
  // Uses escapeHtml instead of md.renderInline to avoid re-entrant core rule execution
  md.core.ruler.after("footnote_tail", "pandoc_footnote_content", (state: StateCore) => {
    currentFootnoteContents = new Map();
    const list = (state.env as { footnotes?: { list?: Array<{ content?: string; label?: string }> } }).footnotes?.list;
    if (!list) return;

    for (let i = 0; i < list.length; i++) {
      if (list[i].content != null) {
        // Inline footnote — raw text available directly
        currentFootnoteContents.set(i, escapeHtml(list[i].content!));
      } else if (list[i].label) {
        // Reference footnote — extract first line from source
        const text = extractFootnoteDefinitionText(state.src, list[i].label!);
        if (text) currentFootnoteContents.set(i, escapeHtml(text));
      }
    }
  });

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
    currentCrossrefDefs = scanCrossrefDefinitions(state.src);
    currentCrossrefConfig = extractCrossrefConfig(state.src);

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

    // Transform caption paragraphs (`: Caption {#type:label}`) before stripping definitions
    transformCaptionParagraphs(state, currentCrossrefDefs, currentCrossrefConfig);

    // Strip {#type:label} definition markers from inline content and insert anchors
    stripCrossrefDefinitions(state);

    // Walk tokens to collect cited IDs (skip crossref keys)
    walkTokens(state.tokens, (token) => {
      if (token.type === "pandoc_citation") {
        const citations: SingleCitation[] = JSON.parse(token.content);
        for (const c of citations) {
          if (!isCrossrefKey(c.id)) {
            citedIds.add(c.id);
          }
        }
      } else if (token.type === "pandoc_citation_inline") {
        const data = JSON.parse(token.content);
        if (!isCrossrefKey(data.id)) {
          citedIds.add(data.id);
        }
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

  md.renderer.rules["pandoc_citation"] = (
    tokens: Token[],
    idx: number,
  ) => {
    const citations: SingleCitation[] = JSON.parse(tokens[idx].content);
    return renderBracketCitation(citations, currentBibData, currentCslStyle, popoverEnabled ? getPopoverId : null, currentLocale, currentCrossrefDefs, currentCrossrefConfig);
  };

  md.renderer.rules["pandoc_citation_inline"] = (
    tokens: Token[],
    idx: number,
  ) => {
    const data = JSON.parse(tokens[idx].content);
    return renderInlineCitation(data.id, data.locator, currentBibData, currentCslStyle, popoverEnabled ? getPopoverId : null, currentLocale, currentCrossrefDefs, currentCrossrefConfig);
  };

  md.renderer.rules["pandoc_crossref_caption"] = (
    tokens: Token[],
    idx: number,
  ) => {
    const data = JSON.parse(tokens[idx].content);
    const { captionText, type, label, fullId, number: num } = data;
    const prefix = currentCrossrefConfig
      ? currentCrossrefConfig[CROSSREF_TYPE_TO_PREFIX_KEY[type as CrossrefType]] ?? CROSSREF_DISPLAY_NAMES[type as CrossrefType]
      : CROSSREF_DISPLAY_NAMES[type as CrossrefType];
    const numberText = num != null ? `${prefix}\u00a0${num}: ` : "";
    return `<p id="${escapeHtml(fullId)}" class="pandoc-crossref-caption">${numberText}${escapeHtml(captionText)}</p>\n`;
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
  crossrefDefs?: CrossrefDefinitionMap,
  crossrefConfig?: CrossrefConfig,
): string {
  // If all citations are crossref, render as crossref only
  const allCrossref = citations.every((c) => isCrossrefKey(c.id));
  if (allCrossref) {
    const parts = citations.map((c) => {
      const cr = parseCrossrefKey(c.id)!;
      const num = crossrefDefs ? resolveCrossrefNumber(c.id, crossrefDefs) : null;
      return renderCrossrefWithWarning(cr.type, cr.label, num, crossrefConfig);
    });
    return parts.join("; ");
  }

  // Separate crossref and bibliography citations
  const bibCitations = citations.filter((c) => !isCrossrefKey(c.id));
  const crossrefCitations = citations.filter((c) => isCrossrefKey(c.id));

  if (!bibData || bibData.ids.length === 0) {
    if (crossrefCitations.length > 0) {
      const parts: string[] = [];
      for (const c of citations) {
        const cr = parseCrossrefKey(c.id);
        if (cr) {
          const num = crossrefDefs ? resolveCrossrefNumber(c.id, crossrefDefs) : null;
          parts.push(renderCrossrefWithWarning(cr.type, cr.label, num, crossrefConfig));
        } else {
          parts.push(`<span class="pandoc-citation-warning">@${escapeHtml(c.id)}</span>`);
        }
      }
      const inner = parts.join("; ");
      return `<cite class="pandoc-citation">[${inner}]</cite>`;
    }
    return renderFallbackBracket(bibCitations);
  }

  const { entriesById } = bibData;
  const allBibKnown = bibCitations.every((c) => entriesById.has(c.id));
  const knownCitations = bibCitations.filter((c) => entriesById.has(c.id));
  const tooltipHtml = getPopoverId ? bibliographyTooltipHtml(knownCitations.map((c) => c.id), bibData, cslStyle, locale) : "";
  const popover = buildPopover(tooltipHtml, getPopoverId, knownCitations[0]?.id);

  // Mixed crossref + bibliography
  if (crossrefCitations.length > 0) {
    const parts: string[] = [];
    for (const c of citations) {
      const cr = parseCrossrefKey(c.id);
      if (cr) {
        const num = crossrefDefs ? resolveCrossrefNumber(c.id, crossrefDefs) : null;
        parts.push(renderCrossrefWithWarning(cr.type, cr.label, num, crossrefConfig));
      } else if (entriesById.has(c.id)) {
        parts.push(escapeHtml(renderSingleCitationText(c, bibData, cslStyle, locale)));
      } else {
        parts.push(`<span class="pandoc-citation-warning">@${escapeHtml(c.id)}</span>`);
      }
    }
    const inner = parts.join("; ");
    return `<cite class="pandoc-citation">${popover.wrapInvoker(inner)}</cite>${popover.element}`;
  }

  if (!allBibKnown) {
    // Mix of known and unknown - render what we can, warn for unknowns
    const parts: string[] = [];
    for (const c of bibCitations) {
      if (entriesById.has(c.id)) {
        parts.push(escapeHtml(renderSingleCitationText(c, bibData, cslStyle, locale)));
      } else {
        parts.push(`<span class="pandoc-citation-warning">@${escapeHtml(c.id)}</span>`);
      }
    }
    const inner = `(${parts.join("; ")})`;
    return `<cite class="pandoc-citation">${popover.wrapInvoker(inner)}</cite>${popover.element}`;
  }

  // All known - render using citation-js
  const text = renderCitationGroup(bibCitations, bibData, cslStyle, locale);
  return `<cite class="pandoc-citation">${popover.wrapInvoker(escapeHtml(text))}</cite>${popover.element}`;
}

function renderCrossrefWithWarning(
  type: CrossrefType,
  label: string,
  number: number | null,
  config?: CrossrefConfig,
): string {
  if (number != null) {
    return renderCrossref(type, label, number, undefined, config);
  }
  return renderCrossref(type, label, undefined, "pandoc-crossref-warning", config);
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
  crossrefDefs?: CrossrefDefinitionMap,
  crossrefConfig?: CrossrefConfig,
): string {
  const crossref = parseCrossrefKey(id);
  if (crossref) {
    const num = crossrefDefs ? resolveCrossrefNumber(id, crossrefDefs) : null;
    return renderCrossrefWithWarning(crossref.type, crossref.label, num, crossrefConfig);
  }

  const entry = bibData?.entriesById.get(id);
  if (!bibData || !entry) {
    return `<cite class="pandoc-citation pandoc-citation-inline pandoc-citation-warning">@${escapeHtml(id)}</cite>`;
  }

  const langOpt = locale ? { lang: locale } : {};
  const subset = new Cite([entry]);
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
  const entries = collectEntries(citations.map((c) => c.id), bibData);
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
  const entries = collectEntries(ids, bibData);
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
    return divsToSpans(linkifyUrls(html));
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
    element: `<span popover="hint" id="${id}" class="pandoc-citation-popover" style="position-anchor: --${id}">${tooltipHtml}</span>`,
  };
}

function renderSingleCitationText(
  citation: SingleCitation,
  bibData: BibliographyData,
  cslStyle?: string | null,
  locale?: string,
): string {
  const entry = bibData.entriesById.get(citation.id);
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

  // Determine which entries to include (membership set, order ignored here)
  const { entriesById } = bibData;
  const includeIds = new Set<string>();
  for (const id of citedIds) {
    if (entriesById.has(id)) includeIds.add(id);
  }

  if (nocite.includes("*")) {
    for (const id of bibData.ids) includeIds.add(id);
  } else {
    for (const id of nocite) {
      if (entriesById.has(id)) includeIds.add(id);
    }
  }

  if (includeIds.size === 0) return "";

  // Walk bibData.ids to preserve load order — matters for CSL styles
  // (numeric / appearance) that respect input ordering in the bibliography.
  const orderedIds: string[] = [];
  for (const id of bibData.ids) {
    if (includeIds.has(id)) orderedIds.push(id);
  }
  const entries = collectEntries(orderedIds, bibData);
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

/** Collect CSL entries for the given ids using the O(1) entriesById index. Skips unknown ids. */
function collectEntries(
  ids: Iterable<string>,
  bibData: BibliographyData,
): Array<{ id: string }> {
  const seen = new Set<string>();
  const entries: Array<{ id: string }> = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const entry = bibData.entriesById.get(id);
    if (entry) entries.push(entry);
  }
  return entries;
}

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

/**
 * Replace <div> with <span> so the HTML is valid inside <p>.
 * Used for popover tooltip content that appears inline.
 */
function divsToSpans(html: string): string {
  return html.replace(/<div(\s|>)/g, "<span$1").replace(/<\/div>/g, "</span>");
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

/**
 * Extract the first line of a footnote definition from source text.
 * Matches `[^label]: content` and returns the content portion.
 */
function extractFootnoteDefinitionText(src: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^\\[\\^${escaped}\\]:\\s*(.*)$`, "m");
  const match = re.exec(src);
  if (!match) return null;
  return match[1].trim() || null;
}

/** Pattern matching a caption line: starts with `: ` and contains {#type:label} */
const CAPTION_RE = /^:\s+(.+?)\s*\{#(fig|tbl|eq|sec|lst):([a-zA-Z0-9_][\w-]*)\}\s*$/;

/**
 * Detect paragraphs matching `: Caption text {#type:label}` and transform
 * them into pandoc_crossref_caption tokens.
 */
function transformCaptionParagraphs(
  state: StateCore,
  crossrefDefs: CrossrefDefinitionMap,
  crossrefConfig: CrossrefConfig,
): void {
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== "inline") continue;
    const inlineToken = tokens[i];
    const content = inlineToken.content;

    const match = CAPTION_RE.exec(content);
    if (!match) continue;

    // Verify this inline is inside a paragraph (open, inline, close)
    const pOpen = i - 1;
    const pClose = i + 1;
    if (
      pOpen < 0 || pClose >= tokens.length ||
      tokens[pOpen].type !== "paragraph_open" ||
      tokens[pClose].type !== "paragraph_close"
    ) continue;

    const captionText = match[1];
    const type = match[2] as CrossrefType;
    const label = match[3];
    const fullId = `${type}:${label}`;
    const num = resolveCrossrefNumber(fullId, crossrefDefs);

    // Replace all three tokens (paragraph_open, inline, paragraph_close) with a single caption token
    const captionToken = new state.Token("pandoc_crossref_caption", "", 0);
    captionToken.content = JSON.stringify({ captionText, type, label, fullId, number: num });
    captionToken.map = tokens[pOpen].map;

    tokens.splice(pOpen, 3, captionToken);
    // Adjust index since we replaced 3 tokens with 1
    i = pOpen;
  }
}

const CROSSREF_ATTR_RE = /\{#(fig|tbl|eq|sec|lst):([a-zA-Z0-9_][\w-]*)\}/g;

/**
 * Strip {#type:label} definition markers from inline tokens
 * and insert invisible anchor elements for link targets.
 */
function stripCrossrefDefinitions(state: StateCore): void {
  for (const blockToken of state.tokens) {
    if (blockToken.type !== "inline" || !blockToken.children) continue;

    const newChildren: Token[] = [];
    let changed = false;

    for (const child of blockToken.children) {
      if (child.type !== "text") {
        newChildren.push(child);
        continue;
      }

      CROSSREF_ATTR_RE.lastIndex = 0;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = CROSSREF_ATTR_RE.exec(child.content)) !== null) {
        changed = true;
        const before = child.content.slice(lastIndex, match.index);

        if (before) {
          const textToken = new state.Token("text", "", 0);
          textToken.content = before;
          newChildren.push(textToken);
        }

        // Insert an anchor for the definition
        const anchorToken = new state.Token("html_inline", "", 0);
        anchorToken.content = `<a id="${match[1]}:${match[2]}"></a>`;
        newChildren.push(anchorToken);

        lastIndex = match.index + match[0].length;
      }

      if (!changed) {
        newChildren.push(child);
      } else if (lastIndex < child.content.length) {
        const textToken = new state.Token("text", "", 0);
        textToken.content = child.content.slice(lastIndex);
        newChildren.push(textToken);
      }
    }

    if (changed) {
      blockToken.children = newChildren;
      // Update combined content
      blockToken.content = newChildren
        .map((t) => (t.type === "html_inline" ? "" : t.content))
        .join("");
    }
  }
}
