# Inline YAML Metadata Test

Testing references defined directly in a YAML block within the document body.

## Citation Before Definition

Citing a reference defined below: [@inline-article]

The following YAML block defines the references:

---
references:
  - id: inline-article
    type: article-journal
    title: "Inline Reference Management"
    author:
      - family: Garcia
        given: Maria
    container-title: "Digital Scholarship Quarterly"
    issued:
      date-parts: [[2024]]
    volume: "8"
    page: "50-65"
  - id: inline-book
    type: book
    title: "The Art of Scholarly Writing"
    author:
      - family: Brown
        given: David
    publisher: Academic Press
    issued:
      date-parts: [[2021]]
---

## Citations After Definition

Citing a book: [@inline-book]

Citing both: [@inline-article; @inline-book]

## References

::: {#refs}
:::
