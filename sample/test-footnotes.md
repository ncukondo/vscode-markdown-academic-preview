---
bibliography: refs.bib
---

# Pandoc Footnote Test

## Reference Footnotes

This is a simple footnote[^1]. Here is another one[^note].

[^1]: This is the first footnote content.

[^note]: This is a named footnote with more detail.

## Inline Footnotes

Inline footnotes are convenient^[This is an inline footnote — no separate definition needed.] for short notes.

Another example with formatting^[Inline footnotes can contain **bold** and *italic* text.].

## Multiple Footnotes

First point[^a], second point[^b], third point[^c] — numbered sequentially.

[^a]: Supporting evidence for the first point.

[^b]: Additional context for the second point.

[^c]: Further reading on the third point.

## Multi-Paragraph Footnote

This claim requires a detailed explanation[^long].

[^long]: First paragraph of the footnote.

    Second paragraph with additional detail. Multi-paragraph footnotes
    use indentation (4 spaces) for continuation.

    Third paragraph concluding the note.

## Footnotes with Citations

Research shows significant results[^cited].

Inline footnote with citation^[See @smith2020 for the original study.].

[^cited]: Based on findings by @smith2020 and related work [@johnson2019, p. 42].

## Combined with Other Features

The formula H~2~O^[Water — the universal solvent.] is essential.

Einstein's E = mc^2^ is famous^[First published in 1905.].

As noted in [@smith2020]^[This citation also appears in the bibliography.], the results are clear.

## Duplicate References

This fact is referenced twice[^dup] in different places. Later, the same note[^dup] appears again.

[^dup]: This footnote is referenced from two locations.

## Edge Cases

Empty paragraph after footnote marker to test spacing:

Text before[^edge]. Text after.

[^edge]: Edge case footnote.
