import { describe, it, expect } from "vitest";
import { readExtensionSettings } from "./settings";
import type { ConfigGetter } from "./settings";

function createMockConfig(values: Record<string, unknown>): ConfigGetter {
  return {
    get<T>(key: string): T | undefined {
      return values[key] as T | undefined;
    },
  };
}

describe("readExtensionSettings", () => {
  it("returns empty settings when all defaults", () => {
    const config = createMockConfig({
      defaultCsl: "",
      defaultBibliography: [],
      searchDirectories: [],
      cslSearchDirectories: [],
    });
    const settings = readExtensionSettings(config);
    expect(settings.defaultCsl).toBeUndefined();
    expect(settings.defaultBibliography).toBeUndefined();
    expect(settings.searchDirectories).toBeUndefined();
    expect(settings.cslSearchDirectories).toBeUndefined();
  });

  it("reads defaultCsl string", () => {
    const config = createMockConfig({ defaultCsl: "ieee" });
    const settings = readExtensionSettings(config);
    expect(settings.defaultCsl).toBe("ieee");
  });

  it("reads defaultBibliography array", () => {
    const config = createMockConfig({
      defaultBibliography: ["/path/to/refs.bib"],
    });
    const settings = readExtensionSettings(config);
    expect(settings.defaultBibliography).toEqual(["/path/to/refs.bib"]);
  });

  it("reads searchDirectories array", () => {
    const config = createMockConfig({
      searchDirectories: ["/lib/bibs"],
    });
    const settings = readExtensionSettings(config);
    expect(settings.searchDirectories).toEqual(["/lib/bibs"]);
  });

  it("reads cslSearchDirectories array", () => {
    const config = createMockConfig({
      cslSearchDirectories: ["/lib/csl"],
    });
    const settings = readExtensionSettings(config);
    expect(settings.cslSearchDirectories).toEqual(["/lib/csl"]);
  });

  it("reads popoverEnabled boolean", () => {
    const config = createMockConfig({ popoverEnabled: false });
    const settings = readExtensionSettings(config);
    expect(settings.popoverEnabled).toBe(false);
  });

  it("reads popoverEnabled true", () => {
    const config = createMockConfig({ popoverEnabled: true });
    const settings = readExtensionSettings(config);
    expect(settings.popoverEnabled).toBe(true);
  });

  it("omits popoverEnabled when undefined", () => {
    const config = createMockConfig({});
    const settings = readExtensionSettings(config);
    expect(settings.popoverEnabled).toBeUndefined();
  });

  it("ignores empty arrays", () => {
    const config = createMockConfig({
      defaultBibliography: [],
      searchDirectories: [],
    });
    const settings = readExtensionSettings(config);
    expect(settings.defaultBibliography).toBeUndefined();
    expect(settings.searchDirectories).toBeUndefined();
  });
});
