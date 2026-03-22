---
bibliography:
  - refs.bib
  - refs2.bib
---

# Duplicate Bibliography ID Test

This file loads two bibliography files (`refs.bib` and `refs2.bib`) that both
contain the entry `smith2020`. The first file should win (consistent with Pandoc).

## Shared ID (smith2020)

Bracket citation: [@smith2020]

Inline citation: @smith2020 found that citation systems vary widely.

If deduplication works correctly, the title shown should be
"A Comprehensive Study of Citation Systems" (from `refs.bib`),
**not** "DUPLICATE -- This should NOT appear" (from `refs2.bib`).

## Unique to refs2.bib (brown2022)

Bracket citation: [@brown2022]

Entries unique to the second file should still load normally.

## Mixed group

Multiple citations including the shared ID: [@smith2020; @brown2022; @johnson2019]

## References

::: {#refs}
:::
