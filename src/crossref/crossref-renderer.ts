import { escapeHtml } from "../renderer/escape-html";
import { CROSSREF_DISPLAY_NAMES, CROSSREF_TYPE_TO_PREFIX_KEY, type CrossrefConfig, type CrossrefType } from "./types";

export function renderCrossref(
  type: CrossrefType,
  label: string,
  number?: number,
  extraClass?: string,
  config?: CrossrefConfig,
): string {
  const displayName = config
    ? config[CROSSREF_TYPE_TO_PREFIX_KEY[type]] ?? CROSSREF_DISPLAY_NAMES[type] ?? type
    : CROSSREF_DISPLAY_NAMES[type] ?? type;
  const escaped = escapeHtml(label);
  const text =
    number != null ? `${displayName}\u00a0${number}` : `${displayName}: ${escaped}`;
  const cls = extraClass ? `pandoc-crossref ${extraClass}` : "pandoc-crossref";
  return `<a href="#${escapeHtml(type)}:${escaped}" class="${cls}">${text}</a>`;
}
