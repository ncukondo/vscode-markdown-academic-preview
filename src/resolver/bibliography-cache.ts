import {
  loadBibliographySync,
  type BibliographyData,
} from "./bibliography";
import type { CslReference } from "../metadata/yaml-extractor";

export interface BibliographyCacheOptions {
  statSync: (path: string) => { mtimeMs: number };
  readFile: (path: string) => string;
}

interface CacheEntry {
  bibData: BibliographyData;
  fileMtimes: Map<string, number>;
  inlineRefs: CslReference[];
}

export class BibliographyCache {
  private entry: CacheEntry | null = null;
  private options: BibliographyCacheOptions;

  constructor(options: BibliographyCacheOptions) {
    this.options = options;
  }

  load(params: {
    bibliographyPaths: string[];
    inlineReferences: CslReference[];
  }): BibliographyData {
    const currentMtimes = this.getMtimes(params.bibliographyPaths);

    if (
      this.entry &&
      this.areMtimesEqual(this.entry.fileMtimes, currentMtimes) &&
      this.areInlineRefsEqual(this.entry.inlineRefs, params.inlineReferences)
    ) {
      return this.entry.bibData;
    }

    const bibData = loadBibliographySync({
      bibliographyPaths: params.bibliographyPaths,
      inlineReferences: params.inlineReferences,
      readFile: this.options.readFile,
    });

    this.entry = {
      bibData,
      fileMtimes: currentMtimes,
      inlineRefs: params.inlineReferences,
    };
    return bibData;
  }

  invalidate(): void {
    this.entry = null;
  }

  private getMtimes(paths: string[]): Map<string, number> {
    const mtimes = new Map<string, number>();
    for (const p of paths) {
      try {
        mtimes.set(p, this.options.statSync(p).mtimeMs);
      } catch {
        mtimes.set(p, -1);
      }
    }
    return mtimes;
  }

  private areMtimesEqual(
    a: Map<string, number>,
    b: Map<string, number>,
  ): boolean {
    if (a.size !== b.size) return false;
    for (const [path, mtime] of b) {
      if (a.get(path) !== mtime) return false;
    }
    return true;
  }

  /**
   * Cheap equality check for inline references. Avoids JSON.stringify on every
   * render — for typical documents both arrays are empty, and we short-circuit.
   * Falls back to a structural comparison only when both arrays have content.
   */
  private areInlineRefsEqual(
    a: CslReference[],
    b: CslReference[],
  ): boolean {
    if (a === b) return true;
    if (a.length === 0 && b.length === 0) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i];
      const bi = b[i];
      if (ai === bi) continue;
      if (ai.id !== bi.id) return false;
      // Different reference for same id — assume content may have changed.
      // Falls through to a structural comparison via JSON only for changed entries.
      if (JSON.stringify(ai) !== JSON.stringify(bi)) return false;
    }
    return true;
  }
}
