---
bibliography: refs.bib
---

# Pandoc Text Formatting Test

## Subscript

Water: H~2~O

Carbon dioxide: CO~2~

Chemical formula: Ca~3~(PO~4~)~2~

## Superscript

Squared: x^2^ + y^2^ = z^2^

Scientific notation: 6.022 × 10^23^

Ordinals: 1^st^, 2^nd^, 3^rd^

## Strikethrough

This is ~~deleted text~~ with strikethrough.

~~Old version~~ New version

## Mixed Formatting

The concentration of H~2~O is 10^−3^ mol/L.

Einstein's equation: E = mc^2^ (~~E = mv~~ is incorrect).

The molecule CH~3~COOH has ~~two~~ one acidic hydrogen (pK~a~ ≈ 4.76).

## Combined with Standard Markdown

**Bold** and H~2~O and *italic* and x^2^ and ~~deleted~~.

- List item with subscript: log~10~(x)
- List item with superscript: 2^8^ = 256
- List item with ~~strikethrough~~

> Blockquote: The pH is −log~10~[H^+^].

## Edge Cases

Single tilde in text: cost is ~$100 (not subscript — contains space).

Single caret: 5 ^ 3 (not superscript — contains spaces).

Escaped tilde: \~not subscript\~

Adjacent: H~2~^18^O (subscript and superscript next to each other)

## Combined with Citations

The study by @smith2020 found that H~2~O concentration affects results.

As shown in [@johnson2019, p. 42], the value is 10^−3^ mol/L.

The ~~original hypothesis~~ revised model [@smith2020; @tanaka2021] fits the data.
