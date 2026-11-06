# Original UI remaster artwork

Generated with the repository image-gen script and the existing Pollinations.AI image API.
Model: Sana (the provider no longer exposes Flux on its legacy anonymous endpoint).
All prompts, seeds, source hashes and optimized derivative hashes are recorded in the append-only generated manifest.

The artwork borrows a dark-fantasy material vocabulary without copying franchise logos, typefaces, icons, UI silhouettes or source images. The user references inform material and contrast only.

Unmodified API source images, including rejected variants, live under `docs/art/ui-remaster-sources/` and are excluded from application deployment. The API burns a small Pollinations footer despite `nologo=true`; accepted shipping crops exclude that footer. Attribution remains here.

## Accepted shipping files

| Material | Shipping file | Size | Bytes |
|---|---|---|---|
| stone | `public/assets/d2/generated/ui-materials/ui.remaster.stone.webp` | 1024 × 480 | 40,088 |
| leather | `public/assets/d2/generated/ui-materials/ui.remaster.leather.webp` | 1024 × 480 | 37,964 |
| iron | `public/assets/d2/generated/ui-materials/ui.remaster.iron.webp` | 1024 × 480 | 21,184 |
| button-red | `public/assets/d2/generated/ui-materials/ui.remaster.button-red.webp` | 1024 × 480 | 32,074 |
| frame | `public/assets/d2/generated/ui-materials/ui.remaster.frame.webp` | 532 × 359 | 4,178 |
| header | `public/assets/d2/generated/ui-materials/ui.remaster.header.webp` | 730 × 96 | 6,356 |
| sanctuary | `public/assets/d2/generated/ui-backgrounds/ui.remaster.sanctuary.webp` | 1024 × 542 | 17,182 |

## Derivation and integration

All WebP derivatives use Pillow, quality 82, method 6. Crop rectangles use `[left, top, right, bottom]` coordinates in the actual served image. Source and derivative SHA-256 values are in the manifest.

- **stone**: `docs/art/ui-remaster-sources/ui.remaster.stone.v1.jpg` → crop `[0, 0, 1024, 480]`.
- **leather**: `docs/art/ui-remaster-sources/ui.remaster.leather.jpg` → crop `[0, 0, 1024, 480]`.
- **iron**: `docs/art/ui-remaster-sources/ui.remaster.iron.jpg` → crop `[0, 0, 1024, 480]`.
- **button-red**: `docs/art/ui-remaster-sources/ui.remaster.button-red.v1.jpg` → crop `[0, 0, 1024, 480]`.
- **frame**: `docs/art/ui-remaster-sources/ui.remaster.frame.jpg` → crop `[248, 108, 780, 467]`. Clear center rectangle `[40, 40, 491, 318]` to transparency; use `border-image-slice: 40` without `fill`, or a decorative overlay.
- **header**: `docs/art/ui-remaster-sources/ui.remaster.header.v1.jpg` → crop `[155, 100, 885, 196]`.
- **sanctuary**: `docs/art/ui-remaster-sources/ui.remaster.sanctuary.jpg` → crop `[0, 0, 1024, 542]`.

Stone, leather, and iron are cover surfaces, not guaranteed seamless tiles. Use a dark gradient overlay where live copy needs more contrast. The crimson leather is the action-button material; add original geometric framing in CSS. The header is an ornamental cropped strip for horizontal bands. Sanctuary is a subdued shell background; its source is generated for this remaster rather than reused zone art. Keep text as translated live DOM text.

## Art review

- Stone v0 rejected: long legacy scene preamble yielded a character portrait. Sana scoped material preamble fixes the subject priority; v1 accepted.
- Button red v0 rejected: plate interpreted as a perspective tray. V1 explicitly requests flat crimson leather and is accepted.
- Header v0 rejected: band interpreted as an armguard. V1 is an orthographic carved panel; its top decorative band is accepted as the header strip.
- Frame v0 accepted by selecting the inner original carved frame, retaining all four corners and clearing its center.
- Stone, leather, iron, crimson leather and sanctuary inspected individually. Final shipping montage inspected for no text leakage, no watermark, coherent palette and usable negative space.

## Reproduction

For accepted sources, run the existing image-gen CLI using each source record’s category, id, subjectId, variant, subject and descriptors from `public/assets/d2/generated/manifest.json`. Preserve the exact preset v4 from this commit. Rejected trial records also preserve their original full prompt and source URL; stone variant 0 predates the scoped preset and must use that recorded URL to reproduce its request. Provider output is subject to model availability; actual served dimensions can differ from requested dimensions. Reapply the documented crop and WebP encoding; do not overwrite historical manifest records.
