---
bibliography: refs.bib
references:
  - id: extra-ref
    type: article-journal
    title: "Combining External and Inline References"
    author:
      - family: Lee
        given: Hana
    container-title: "Journal of Mixed Methods"
    issued:
      date-parts: [[2023]]
    volume: "12"
    page: "30-45"
nocite: |
  @wilson2018
---

# Mixed Sources Test

Using both an external .bib file and inline references together.

## Citations from External .bib

BibTeX entry: [@smith2020]

Another BibTeX entry: @johnson2019 argues that...

## Inline Reference Citation

Defined in YAML frontmatter: [@extra-ref]

## Mixed Citations

[@smith2020; @extra-ref]

## Nocite Test

Wilson (2018) is listed in nocite, so it appears in the bibliography without being cited.

## References

::: {#refs}
:::
