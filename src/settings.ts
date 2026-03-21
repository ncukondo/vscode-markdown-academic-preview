export interface ExtensionSettings {
  enabled: boolean;
  defaultCsl?: string;
  defaultBibliography?: string[];
  searchDirectories?: string[];
  cslSearchDirectories?: string[];
  locale?: string;
  popoverEnabled?: boolean;
}

export interface ConfigGetter {
  get<T>(key: string): T | undefined;
}

export function readExtensionSettings(config: ConfigGetter): ExtensionSettings {
  const enabled = config.get<boolean>("enabled");
  const settings: ExtensionSettings = {
    enabled: enabled !== false,
  };

  const defaultCsl = config.get<string>("defaultCsl");
  if (defaultCsl) {
    settings.defaultCsl = defaultCsl;
  }

  const defaultBibliography = config.get<string[]>("defaultBibliography");
  if (defaultBibliography && defaultBibliography.length > 0) {
    settings.defaultBibliography = defaultBibliography;
  }

  const searchDirectories = config.get<string[]>("searchDirectories");
  if (searchDirectories && searchDirectories.length > 0) {
    settings.searchDirectories = searchDirectories;
  }

  const cslSearchDirectories = config.get<string[]>("cslSearchDirectories");
  if (cslSearchDirectories && cslSearchDirectories.length > 0) {
    settings.cslSearchDirectories = cslSearchDirectories;
  }

  const locale = config.get<string>("locale");
  if (locale) {
    settings.locale = locale;
  }

  const popoverEnabled = config.get<boolean>("popoverEnabled");
  if (popoverEnabled !== undefined) {
    settings.popoverEnabled = popoverEnabled;
  }

  return settings;
}
