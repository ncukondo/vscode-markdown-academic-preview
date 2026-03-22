import { escapeHtml } from "../renderer/escape-html";
import { CROSSREF_DISPLAY_NAMES, type CrossrefType } from "./types";

export function renderCrossref(
  type: CrossrefType,
  label: string,
  number?: number,
): string {
  const displayName = CROSSREF_DISPLAY_NAMES[type] ?? type;
  const escaped = escapeHtml(label);
  const text =
    number != null ? `${displayName}\u00a0${number}` : `${displayName}: ${escaped}`;
  return `<span class="pandoc-crossref">${text}</span>`;
}
