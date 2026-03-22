# Pandoc Citation Preview

A lightweight VS Code extension that renders Pandoc-style citations (`@key`, `[@key]`) directly in the built-in Markdown Preview — **no Pandoc installation required**. It uses citation-js to parse bibliography data from BibTeX / CSL-JSON files and generates formatted citations and reference lists entirely within VS Code.

![Demo](images/screen-record.gif)

## Features

### Citation Preview

Renders Pandoc citation syntax directly in the Markdown preview.

- **Bracket citations**: `[@smith2020]`, `[@smith2020, p. 10]`, `[@smith2020; @johnson2019]`
- **Inline citations**: `@smith2020`, `@smith2020 [p. 10]`
- **Author suppression**: `[-@smith2020]` renders only the year
- **Prefix / suffix**: `[see @smith2020, p. 10]`

### Interactive Bibliography

- Click a citation to jump to the corresponding bibliography entry
- Hover over a citation to see the full reference in a popover
- DOIs and URLs are automatically rendered as clickable links

### Citation Autocomplete

Type `@` in a Markdown file to get citation key suggestions from your bibliography. The completion list shows author, year, and title — selecting an item displays the full formatted reference.

### Insert Citation Command

Use the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run **Pandoc Citation: Insert Citation** to search and insert one or more citations via a quick picker.

### Editor Hover

Hover over a citation key in the editor to preview the formatted reference in a tooltip.

### Bibliography Rendering

Renders the reference list using CSL styles (default: APA).

- Supports BibTeX (`.bib`), CSL-JSON (`.json`), and YAML (`.yaml`/`.yml`)
- Inline references via YAML frontmatter `references:` field
- `nocite` support for including uncited entries

## Usage

### 1. Specify a bibliography file in YAML frontmatter

```markdown
---
bibliography: refs.bib
---

According to @smith2020, ...

## References

::: {#refs}
:::
```

### 2. Multiple bibliography files

```yaml
---
bibliography:
  - refs.bib
  - extra.json
---
```

### 3. Inline references

You can define references directly in YAML frontmatter and cite them in the same document:

```markdown
---
references:
  - id: smith2020
    type: article-journal
    title: "Article Title"
    author:
      - family: Smith
        given: John
    issued:
      date-parts:
        - [2020]
---

According to @smith2020, this approach works well.

More details can be found in [@smith2020, p. 42].
```

This is useful for self-contained documents that don't need an external bibliography file.

### 4. Custom CSL style

```yaml
---
bibliography: refs.bib
csl: chicago-author-date.csl
---
```

### 5. nocite

Include entries in the bibliography without citing them in the text:

```yaml
---
bibliography: refs.bib
nocite: "@*"
---
```

To include specific uncited entries:

```yaml
---
bibliography: refs.bib
nocite: |
  @smith2020
  @johnson2019
---
```

### 6. Bibliography placement

By default, the bibliography is appended at the end of the document. To control placement, use the Pandoc `refs` div:

```markdown
## References

::: {#refs}
:::

## Appendix

Additional content after the bibliography.
```

## Extension Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `pandocCitationPreview.enabled` | boolean | `true` | Enable/disable the extension |
| `pandocCitationPreview.defaultBibliography` | string[] | `[]` | Default bibliography file paths (loaded in addition to YAML frontmatter) |
| `pandocCitationPreview.defaultCsl` | string | `""` | Default CSL style name (e.g. `"ieee"`) or file path |
| `pandocCitationPreview.searchDirectories` | string[] | `[]` | Search directories for bibliography files |
| `pandocCitationPreview.cslSearchDirectories` | string[] | `[]` | Search directories for CSL style files |
| `pandocCitationPreview.locale` | string | `""` | Locale for citation rendering (e.g. `"en-US"`, `"ja-JP"`, `"de-DE"`) |
| `pandocCitationPreview.popoverEnabled` | boolean | `true` | Enable citation popover tooltips in the preview |
| `pandocCitationPreview.completionEnabled` | boolean | `true` | Enable citation key autocomplete when typing `@` |

### File path resolution

Bibliography and CSL file paths are resolved in the following order:

1. **Absolute path** — used as-is
2. **Relative to the markdown file** directory
3. **Search directories** — `searchDirectories` / `cslSearchDirectories`
4. **Workspace root**

## Supported Citation Syntax

| Syntax | Description |
|--------|-------------|
| `@key` | Inline citation (Author Year) |
| `[@key]` | Bracket citation (Author Year) |
| `[@key, p. 10]` | With locator |
| `[@key1; @key2]` | Multiple citations |
| `[-@key]` | Suppress author |
| `[see @key]` | With prefix |
| `[see @key, p. 10]` | With prefix and locator |
| `@key [p. 10]` | Inline with locator |

### Supported Locators

page, chapter, section, volume, figure, part, line, note, verse, book, column, folio, opus, sub verbo

## Supported Bibliography Formats

| Format | Extension |
|--------|-----------|
| BibTeX | `.bib` |
| CSL-JSON | `.json` |
| YAML | `.yaml`, `.yml` |
| Inline | YAML frontmatter `references:` |

## Requirements

- VS Code 1.80.0 or later
- No external dependencies required (Pandoc is **not** needed)

## License

MIT
