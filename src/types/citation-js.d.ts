declare module "@citation-js/core" {
  interface CslData {
    id: string;
    type?: string;
    title?: string;
    [key: string]: unknown;
  }

  class Cite {
    data: CslData[];
    constructor(data?: unknown, options?: Record<string, unknown>);
    add(data: unknown, options?: Record<string, unknown>): this;
    set(data: unknown, options?: Record<string, unknown>): this;
    getIds(): string[];
    format(
      format: string,
      options?: Record<string, unknown>,
    ): string | object[];
  }

  export { Cite };
}

declare module "@citation-js/plugin-bibtex" {}
declare module "@citation-js/plugin-csl" {}
