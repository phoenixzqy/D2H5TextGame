# P16a01 — Mobile combat readability

2026-10-21. Scoped implementation accepted after independent final review.
Full P16/G5/C0–C4/G0–G7/private v1 remain open.

Below 1024px, combat teams now stack in their existing three-column formation.
Names wrap at 14px/20px, portraits use 64px height, HP tracks use 6px, and the
wave/clash separator uses 48px. Mobile identity appears above a wrapping toolbar
with 44px targets and 8px gaps. At 1024px the previous desktop battlefield,
typography and cell minima return. The desktop toolbar's 44px minimum is an
approved delta. Feedback pulses in place, with reduced-motion support.

Only presentation classes and the layout comment change in CombatScreen.
Independent UX/TD source review confirms unchanged DOM/tab order, handlers,
disabled states, formation grouping/cell mapping, first stacked representative,
resource calculations, engine/store/save behavior and localized labels.
[Contract](../p16a01-combat-readability.md) and
[BUG-056](../../../production/bugs/BUG-056-mobile-combat-readability.md).

## Causal checks and correction

Producer, QA and UX/TD independently reviewed the concrete tests before freeze.
Browser spec SHA256 is
`c7bfb76ef6e5a54a94cb8e66e2bc206ef53c9f55041f4f82651e6f354286930f`.
No test changed after freeze. Synthetic locale render controls cover a fourth
formation row, explicit positions, first-of-two stacked summons/+1 and unchanged
inputs, alongside existing live-resource/terminal controls.

The genuine pre-fix production RED completes all eight sizes and W1 Flee:
577 geometry failures, 13.517s case/26.072s process. At 360px inner cards are
20.297px, with 10px truncated names, 4px HP and a 288px separator. At 412px
cards are 28.953px. Visible state and committed saves remain stable; browser
error arrays are empty. BUG-056 precedes the presentation patch.

The first GREEN attempt remains failed: nine English/seven Chinese failures,
all badge-top containment, in 39.330s process. Existing bounce translation
exceeds the top inset by up to 4.53px. This real defect was recorded before
the correction. UX/TD approved changing only bounce to opacity pulse; frozen
containment assertions remain exact. Both failed attempts and original sources
are retained. Final runtime SHA256:
`0c859f356eac0c03d9a6ad6248dd204b2b5c0ab242dc659951a5631a782a2fb8`.

## Final production browser evidence

Four cases pass, zero retries/skips/flakes, 42.382s Playwright/43.643s bounded
process. Each locale has a paused layout/Flee case and a separate fresh-context
native-control case. Production webServer runs the build/test-bridge guard.

| Locale | Layout/Flee | Native controls/return |
| --- | --- | --- |
| en | 14.103s | 15.817s |
| zh-CN | 13.613s | 15.598s |

One ordinary fresh Druid named `ReadabilityProof`, free-hired/fielded actual
starter Rogue, explicit Save and native W1 feedback establish each layout
sample. Only Date is fixed; timers remain native. The same nonterminal paused
sample traverses 360×640, 412×915, 640×360, 915×412, 1023×768, 1024×768,
1280×800 and 1920×1080. Assertions measure actual inner cards, text Range line
boxes/clipping ancestors, HP/badge containment, cells/empty minima, metadata,
toolbar geometry/spacing and main reachability. All 18 cells/10 representatives,
visible HP percentages/MP/log and readonly committed save remain identical
after every resize. Neither document nor main has horizontal overflow.

Both locales measure 86px cards at 360px and 103.328px at 412px; mobile HP is
6px and the separator 48px. Landscape main heights are 187px and 296px.
Occupied cards/names/HP for either team and the log scroll into unobscured main.
Desktop presentation resumes at 1024px. Root and UX/TD inspect final mobile and
desktop screenshots in both locales. The packet includes all numeric samples.

Native control cases open formation and close with Escape without assignment,
toggle/restore Auto, verify exact 2x→4x→1x speed, resume to a natural HP-or-MP
change with changed log, Pause, then Skip on at most three waves/one ordinary
run and return from either terminal result. This is return-control evidence,
not an earned-clear/balance claim. Layout cases Flee from W1. All four browser
warning/error/pageerror arrays are empty.

Chinese effective-font CDP evidence records WenQuanYi Micro Hei, four actual
glyphs on the subarea label; the CDP session detaches. Host-only staging uses
Ubuntu `fonts-wqy-microhei_0.2.0-beta-4_all.deb`, SHA256
`608b93d1acca135f422dca8efed4960a381de0142fd6b81f8a33aa37180e59f1`.
Source/provenance/config/package are retained. An extracted fontconfig symlink
was unlinked without following its system target before execution. There is
no new product font dependency. Some unrelated emoji icons remain host boxes.

## Current-byte validation and limits

Final runtime and unchanged frozen tests pass full unit 3454/166 files in
54.907s, typecheck in 11.211s and lint/purity in 28.774s. The final matrix's
production build/bridge guard passes; existing large-chunk, art-manifest
precache, Browserslist and Node color warnings remain. Earlier focused14/14
and full U/T/L passes precede only the pulse correction and are separately
indexed. No engine code changed; historical P08 coverage is not a new P16
coverage run. The existing full-unit 15s budget remains exceeded.

Bounds remain focused30/unit120/types90/lint90/build210 seconds, browser
pilot150/matrix210 plus2s exact-owned cleanup, 90s/case, 32MiB/log/report and
64MiB total RAW/dist/.vite. Completed attempts have no timeout, signals or
surviving owned processes. Root owns all execution and disposable cleanup;
independent reviewers read only. No push/PR/merge/deployment.

Compact DOM cannot certify hidden stacked occupants/status records. Keyboard
order preservation is source-reviewed; only Escape is runtime-tested. This
does not certify full accessibility/contrast/screen-reader behavior, safe-area
hardware, performance, campaign progression, pacing, final balance or full P16.

## Durable packet

[Packet](fixtures/p16a01-combat-readability/packet.json) indexes all 111 safe
regular RAW records, 17,352,171 bytes, 11 command records and 1125 observed
PID/birth identities verified absent/nonlive. The adjacent 8,669,458-byte archive
preserves all frozen/original/final sources, failed attempts, full JSON reports,
geometry, screenshots, host font package/config/provenance and process evidence.
Root verifies each RAW/archive size and hash without extracting archive paths.
Packet SHA256 `226470f73846b6b99207c167f4aafa7b29b6a8611e24853a6a522124cb1e34fa`;
archive SHA256 `53b9715a911f36de70c79a9a2eda86890758e0f367f17d857b6f1b998e687cce`.
Archive snapshots precede this paragraph and final review/cleanup notes.
Original checkout remains untouched; the umbrella worktree claim continues.

## Final independent review

Developer root, UX/TD and independent producer/QA approve the bounded result.
Producer/QA independently verify all111 RAW/archive records, frozen/current
source hashes and1125 nonlive process identities. QA recomputes1406 recorded
browser constraints; producer independently reconciles all16 geometry samples,
15JSON attachments and four selected screenshots. All readers release before
commit/cleanup. [Final review](fixtures/p16a01-combat-readability/final-review.json)
is explicitly post-archive. Exact disposable cleanup follows the local commit;
no full P16/accessibility/campaign/balance/private-v1 acceptance is inferred.
