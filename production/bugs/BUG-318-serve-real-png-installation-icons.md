# BUG-318 — Serve actual PNG installation icons

Status: Implemented inb17552a6; actual production PNG decode/precache checks pass; fresh whole integration and independent acceptance pending. Root sole executor/author.
Severity: High — declared installation/favicon icons are undecodable; no player workaround for malformed assets.
Build: c882dfe642e9bdbd5e0f4567e14b7ab261a1e258; ordinary6480ac15 production build.
Environment: bundled Chromium147,360×640,production loopback preview, no character; locale-independent; no engine/RNG dependency.

## Reproduction

1. Serve ordinary production build and open the application.
2. Fetch manifest.webmanifest: icons/icon-192.png and icons/icon-512.png are declared type image/png and corresponding raster dimensions; index.html also declares192PNG as favicon.
3. Decode either URL as an Image.192PNG fails with EncodingError in Chromium; source/built512PNG has the identical defect.
4. Inspect both source/build files: file identifies SVG text. Each .png is byte-identical to its existing matching .svg.

Expected: image/png paths contain decodable actual PNGs at192×192 and512×512; existing artwork and SVG sources preserved.
Actual: both .png resources contain SVG XML and are served under the incompatible PNG MIME type. Existing precache guard only checks JS/CSS/entry membership. CDP getInstallabilityErrors returns[] here despite failed actual decoding, so that API alone cannot prove valid icons or installability.

Evidence: root support-disclosure task `install-prerequisites/report.json`, original audit source, exact source/build signatures and hashes in forthcoming rasterization receipt. The first audit also observed serviceWorker.ready while activating; corrected validation must wait for actual activated/controller state. No installation/Android/Lighthouse acceptance is claimed.
Affected systems: frontend/PWA/assets. Root cause: SVG bytes saved with .png extensions, declared and served as PNG. Workaround: none for the malformed declared icons; ordinary browser play remains available.

## Correction and validation plan

Rasterize the existing matching SVG sources into genuine192/512 PNGs with bundled Chromium's standard SVG/canvas renderer; preserve artwork and .svg sources, no AI image generation or design change. Add a minimal signature/IHDR/dimension/required-precache check to the existing production precache guard. Reproduce the guard failure against the immutable old build before source promotion, then verify both emitted PNGs by actual browser decode, declared dimensions, request MIME type, manifest validity and activated/controller evidence in ordinary production. Keep PWA installation on real desktop/Android, Lighthouse and broader G6 acceptance separate. No saved data, service-worker strategy or dependency changes.

Corrected baseline auditor waits for an activated worker and actual controller, then records both192/512 PNG MIME responses failing image.decode. The old production guard prototype also fails on the192PNG signature, before any product change. `rasterized/receipt.json` preserves exact SVG/prior-PNG hashes, conversion method and both generated PNG hashes; existing SVG artwork is unchanged.

## Implementation checkpoint

Both .png files are now real PNGs at192/512, from unchanged existing .svg artwork. Standard local rasterization receipt records exact source/output hashes. Updated existing precache guard reproduces original RED and emitted-build GREEN; ordinary production actual decoding/MIME/dimensions and activated/controller evidence pass. Real desktop/Android installation, prompt, maskable safe zone, Lighthouse/fullG6 remain unmeasured.

[Scoped evidence and continuing root ownership](../../docs/plans/evidence/p16-support-pwa-install-icons.md). Fresh whole integration/retention pending; no independent/full-v1 acceptance or remote action.
