import { CROSSREF_DISPLAY_NAMES, type CrossrefType } from "./types";

export function renderCrossref(
  type: CrossrefType,
  label: string,
  number?: number,
): string {
  const displayName = CROSSREF_DISPLAY_NAMES[type];
  const text =
    number != null ? `${displayName}\u00a0${number}` : `${displayName}: ${label}`;
  return `<span class="pandoc-crossref">${text}</span>`;
}
