import { escapeHtml } from "../renderer/escape-html";
import { CROSSREF_DISPLAY_NAMES, type CrossrefType } from "./types";

export function renderCrossref(
  type: CrossrefType,
  label: string,
  number?: number,
  extraClass?: string,
): string {
  const displayName = CROSSREF_DISPLAY_NAMES[type] ?? type;
  const escaped = escapeHtml(label);
  const text =
    number != null ? `${displayName}\u00a0${number}` : `${displayName}: ${escaped}`;
  const cls = extraClass ? `pandoc-crossref ${extraClass}` : "pandoc-crossref";
  return `<span class="${cls}">${text}</span>`;
}
