---
bibliography: refs.bib
references:
  - id: doi-only
    type: article-journal
    title: "Article with DOI Only"
    author:
      - family: Tanaka
        given: Kenji
    container-title: "Nature Communications"
    issued:
      date-parts: [[2024]]
    volume: "15"
    page: "1234"
    DOI: "10.1038/s41467-024-00000-0"
  - id: url-only
    type: webpage
    title: "Web Resource with URL Only"
    author:
      - family: Suzuki
        given: Aiko
    issued:
      date-parts: [[2025]]
    URL: "https://developer.mozilla.org/en-US/docs/Web"
  - id: both-doi-url
    type: article-journal
    title: "Article with Both DOI and URL"
    author:
      - family: Kim
        given: Minjae
    container-title: "PLOS ONE"
    issued:
      date-parts: [[2023]]
    volume: "18"
    page: "e0290000"
    DOI: "10.1371/journal.pone.0290000"
    URL: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0290000"
  - id: no-link
    type: book
    title: "Book with No DOI or URL"
    author:
      - family: Sato
        given: Yuki
    publisher: "Iwanami Shoten"
    issued:
      date-parts: [[2022]]
nocite: |
  @wilson2018
---

# DOI / URL Link Test

Sample to verify that DOI and URL fields are automatically rendered as clickable links in the bibliography.

## DOI Only

Entry with only a DOI field: [@doi-only]

## URL Only

Entry with only a URL field: [@url-only]

## Both DOI and URL

Entry with both fields: [@both-doi-url]

## No Link

Entry with neither DOI nor URL: [@no-link]

## BibTeX with DOI/URL

wilson2018 from refs.bib is included via nocite (has both DOI and URL).

## CSL-JSON with DOI

See `test-csljson.md` for entries from refs.json.

## References

::: {#refs}
:::
