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
  inlineRefsKey: string;
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
    const inlineRefsKey = JSON.stringify(params.inlineReferences);

    if (this.entry && this.isValid(this.entry, currentMtimes, inlineRefsKey)) {
      return this.entry.bibData;
    }

    const bibData = loadBibliographySync({
      bibliographyPaths: params.bibliographyPaths,
      inlineReferences: params.inlineReferences,
      readFile: this.options.readFile,
    });

    this.entry = { bibData, fileMtimes: currentMtimes, inlineRefsKey };
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

  private isValid(
    entry: CacheEntry,
    currentMtimes: Map<string, number>,
    inlineRefsKey: string,
  ): boolean {
    if (entry.inlineRefsKey !== inlineRefsKey) return false;
    if (entry.fileMtimes.size !== currentMtimes.size) return false;
    for (const [path, mtime] of currentMtimes) {
      if (entry.fileMtimes.get(path) !== mtime) return false;
    }
    return true;
  }
}
