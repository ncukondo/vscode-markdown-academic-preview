import "@citation-js/plugin-csl";
import { Cite } from "@citation-js/core";
import type { BibliographyData } from "../resolver/bibliography";

const DEFAULT_TEMPLATE = "apa";
const CUSTOM_TEMPLATE_KEY = "__markdown-academic-preview-bib-custom__";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { plugins } = require("@citation-js/core") as {
  plugins: {
    config: { get(name: string): { templates: { add(name: string, xml: string): void } } };
  };
};
const cslConfig = plugins.config.get("@csl");

/**
 * Convert plain-text URLs in bibliography HTML into clickable links.
 * Skips URLs that are already inside an <a> tag or an HTML attribute.
 */
export function linkifyUrls(html: string): string {
  // Split on HTML tags to avoid modifying URLs inside attributes
  return html.replace(
    /(<[^>]*>)|(https?:\/\/[^\s<>"]+)/g,
    (match, tag: string | undefined) => {
      // If it's an HTML tag, leave it as-is
      if (tag) return match;
      // It's a bare URL in text content — wrap it
      const cleanUrl = match.replace(/[.,;:)]+$/, "");
      const trailing = match.slice(cleanUrl.length);
      return `<a href="${cleanUrl}">${cleanUrl}</a>${trailing}`;
    },
  );
}

export interface BibliographyRenderOptions {
  bibliographyData: BibliographyData;
  citedIds: string[];
  nocite: string[];
  cslStyle: string | null;
  locale?: string;
}

export function renderBibliography(options: BibliographyRenderOptions): string {
  const { bibliographyData, citedIds, nocite, cslStyle } = options;
  const knownIds = new Set(bibliographyData.ids);

  // Collect all ids that should appear in the bibliography
  const idsToInclude = new Set<string>();

  // Add cited ids that exist in the bibliography
  for (const id of citedIds) {
    if (knownIds.has(id)) {
      idsToInclude.add(id);
    }
  }

  // Handle nocite
  if (nocite.includes("*")) {
    for (const id of bibliographyData.ids) {
      idsToInclude.add(id);
    }
  } else {
    for (const id of nocite) {
      if (knownIds.has(id)) {
        idsToInclude.add(id);
      }
    }
  }

  if (idsToInclude.size === 0) {
    return "";
  }

  // Build a Cite instance with only the entries to include
  const allData = bibliographyData.cite.data;
  const selectedData = allData.filter((entry: { id: string }) => idsToInclude.has(entry.id));
  const selectedCite = new Cite(selectedData);

  let template = DEFAULT_TEMPLATE;
  if (cslStyle) {
    cslConfig.templates.add(CUSTOM_TEMPLATE_KEY, cslStyle);
    template = CUSTOM_TEMPLATE_KEY;
  }

  try {
    const html = selectedCite.format("bibliography", {
      format: "html",
      template,
      ...(options.locale ? { lang: options.locale } : {}),
    }) as string;

    return linkifyUrls(html);
  } catch {
    return "";
  }
}
