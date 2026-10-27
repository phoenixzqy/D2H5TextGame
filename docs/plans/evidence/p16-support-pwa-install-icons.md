# P16/P17 — Optional support disclosure and valid installation icons

Status: local fixes, fresh whole integration and verified retention/cleanup
complete. Independent/full-v1 acceptance remains open.
Root sole executor/author. [Exact receipts/hashes](fixtures/support-pwa-install-icons/checkpoint.json).
Pre-change bug reports committed d34c13e7 before product changes.

## Optional support (BUG317 / F20)

1037886f replaces the always-visible32px coffee link with native default-closed
details/summary. Existing translated supportDev label,44px-plus disclosure/link,
visible keyboard focus, protected external-link attributes and version outside
hidden content. No custom toggle state or persisted preference.

Corrected baseline en/zh-CN360px captures reproduce visible link/no disclosure.
The first Chinese selector guessed the wrong translated label and timed out;
original failure retained separately. Prototype11existing Settings tests pass;
byte-identical committed source11/onefile9.360s, scoped types8.723s and explicit
lint8.291sPASS. No framework-mirroring test added for native details behavior.

Ordinary final production20/20contextsPASS: en/zh-CN ×360×640,412×915,640×360,
1280×800,1920×1080, without and with ordinary fresh-character creation. Native
Enter/Tab/Space, pointer, return-to-Settings collapsed,44px-plus unclipped controls,
link center hit-test, no document overflow, no bridge and no external requests.
All20character closed/open original PNGs individually viewed/hashed; no-character
and prototype captures remain scoped DOM/geometry evidence. Current footer scroll
positions clip other panels above; no whole-app a11y/contrast/zoom acceptance.
Service workers are blocked for this UI harness; its known Playwright SW-block
warning is excluded from product error arrays, and no offline claim follows.

Actual developer support destination was asked asynchronously and remains
unanswered. Existing generic homepage is unchanged; no invented profile URL or
external activation/purchase/power flow. FullF20 remains unaccepted.

## Installation icons (BUG318 / F16)

Both declared PNG files contained SVG XML, byte-identical to their existing SVG
siblings. Production served image/png and Chromium failed actual decoding for
both192/512. Empty CDP installabilityErrors also occurred in the broken build;
that API alone is insufficient. Corrected baseline waits for actual activated
worker/controller before recording both decode failures. The first audit's
ready-while-activating observation and initial192decode failure remain retained.

b17552a6 renders unchanged existing SVG artwork into actual192×192/512×512PNG
with standard local bundled Chromium SVG/canvas. No AI generation, new asset
design, external resource or SVG-source change. Both output originals viewed;
source/prior/output hashes and exact method retained. Existing production
precache guard now requires both PNG URLs and valid PNG signature/IHDR/dimensions.
Its original-build RED precedes promotion; final emitted-build GREEN passes.
This header check is not a complete PNG decoder; actual browser decode is also
required and passes for both final PNGs with correct MIME/dimensions.

Ordinary final build12.447sPASS, VITE_E2E unset;762files/sixJS chunks, bridge scan
clean,758precache records/756distinct URLs all resolve. Both source/built PNGs
exact. Existing chunk/art-manifest warnings remain. Browser manifest has no
parse errors, worker activated/document controlled, both icons decode. No
beforeinstallprompt event observed here; desktop OS/Android installation,
maskable safe-zone review, Lighthouse/fullG6/P17 remain open. No save/PWA caching
strategy/dependency/permission or telemetry change.

## Integration, retention and remaining scope

Frozen8fc0ae32 fresh full19935tests/940files/two existing opt-in skipsPASS,
1006.924s; full types136.582s and lint/purity237.917sPASS. All2693repository
inputs,769external build/config/script inputs and HEAD remain exact through
all three original terminal receipts, then independently rehashed. Original
handles81483/89503/78951 are consumed; childPIDs3021999/3021998/3021997 are
absent. This freshly integrates all four changed product paths. Full unit
runtime exceeds the repository budget; no performance/whole-v1 gate follows.

All1691regular archive members were read back and byte-verified before exact
cleanup of1691files and32directories including rawroot. Remaining[]/failures[];
raw task is absent, scoped processes are terminal, shared dependencies/caches,
worktree/source/history and genuine campaign fixture are preserved. Root retains:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-support-disclosure-1rp6gaoa-raw.tar.gz`
- Adjacent `-raw-manifest.json` and `-retention.json` sidecars.

Archive SHA256: `2b7dba14c8f36585b33299866321dc7e1ba978a349837e62c1854c5ad90e33e9`.
Root removes these exact retained paths after independent/full-v1 consumers
finish. Historical raw-root command paths can be reconstructed from archive
members; no active raw task or disposable build is left. The previous inventory
archive remains root-owned for its separate consumers.

Genuine compressed/raw hashes remain exact: L33,Ancients/Rite claimed,next402,
Baaluncleared.211bounded/oneunverified/onereview remain; Cobra/ColdMastery,
C2–C4/fullG0–G7, earned builds/pacing/economy/endgame, whole-app mobile/a11y/
performance/soak and independent/human acceptance remain open. No genuine
campaign/replay or remote action. Full private-v1 objective and umbrella claim
continue; no independent self-approval.
