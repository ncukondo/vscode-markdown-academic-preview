import type MarkdownIt from "markdown-it";
import { pandocCitationPlugin } from "./plugin";
import type { PluginOptions } from "./plugin";
import * as fs from "fs";

export function activate() {
  return {
    extendMarkdownIt(md: MarkdownIt) {
      const options: PluginOptions = {
        readFileSync: (filePath: string) => fs.readFileSync(filePath, "utf-8"),
        existsSync: (filePath: string) => fs.existsSync(filePath),
      };
      return md.use(pandocCitationPlugin, options);
    },
  };
}
