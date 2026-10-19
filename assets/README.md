# Typeface

`NotoSansCJKjp-Thin.woff2` is Noto Sans CJK JP Thin (weight 100), distributed under the SIL Open Font License 1.1 in `OFL.txt`.

Source: https://github.com/notofonts/noto-cjk/blob/main/Sans/OTF/Japanese/NotoSansCJKjp-Thin.otf

The official OTF was converted to WOFF2 with fontTools; glyphs were not subsetted or modified. The same loaded font raster is used for rendering and collision geometry. This file is served locally; gameplay does not contact a font provider.

## Pixel UI font

`DotGothic16.woff2` is DotGothic16 Regular, by Fontworks Inc., under the SIL Open Font License 1.1 in `DotGothic16-OFL.txt`.

Source: https://github.com/google/fonts/blob/main/ofl/dotgothic16/DotGothic16-Regular.ttf

The official TTF was converted to WOFF2 with fontTools without changing the glyphs. It is used for UI text. World glyphs use the Thin font above rasterized to a 32-dot, binary-alpha sprite to retain thin strokes across a broad kanji repertoire; that exact sprite also defines collision geometry.
