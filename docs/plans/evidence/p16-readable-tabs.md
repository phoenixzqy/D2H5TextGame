# P16 — Readable inactive tab labels

Status: shared-component fix and bounded local browser checks complete;
independent/whole-app/production/full-v1 acceptance remain open. Root sole author.
[BUG556](../../../production/bugs/BUG-556-readable-inactive-tabs.md).

Inactive Side/Bounties labels used the dark border color: rgb74/58/42 against
rgb10/10/10, **1.819:1**. The shared `src/ui/Tabs.tsx` inactive state now uses
existing `text-d2-white/70`, **6.576:1** after alpha compositing. Selected gold,
hover, ARIA, keyboard behavior and layout classes remain unchanged. No token,
translation, engine/data/save/API change.

## Verification

The same browser contrast assertion fails all10 before-fix cases and passes
all10 after-fix cases: zh-CN/en ×360×640,412×915,640×360,1280×800,1920×1080.
All30 measured labels meet4.5:1; targets are≥44×44, page width does not overflow,
and ArrowRight/Home change focus/selection and the linked panel correctly.
Zero page errors. Original20 baseline/fixed screenshots and RGB/geometry values
remain; fixed Chinese mobile and English landscape captures were viewed.
Existing Tabs unit1/1, scoped strict types and explicit one-file lint pass.
No combat, earlier-act/full suite, install or new implementation-mirroring unit.

Browser transport is Vite development with ordinary fresh Amazon creation and
navigation. Its development bridge is available but unused; no imported save or
gameplay state injection. Production bundle/PWA/offline, screen-reader/physical
device and whole-app acceptance are still open.

The preceding two-save general audit visits creation/town/skills/inventory/
mercs/quests/map/settings with zero page/HTTP errors. Its first attempt required
production-only bridge absence and stopped before character creation; retained
as setup failure. Its home-labeled geometry can still show the preceding
Settings DOM because navigation was not awaited there; no home acceptance is
claimed. Raw small checkbox rectangles are not sufficient evidence of small
hit areas because labels may provide a larger target.

Readback initially required exact active RGB/heights across separate runs. Two
existing transition-all frames differ below1CSSpx and interpolate selected color.
The corrected reader retains all originals, exact labels/selection/widths,44px
minimum geometry and the unchanged4.5:1 contrast assertion. No UI was replayed.

## Evidence and continuing ownership

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains it for full-v1/independent consumers and removes it when they finish.
`bug556-tabs-before.tsx.txt` preserves original source;
`p16-tab-contrast-{baseline,fixed}-v1.json` and viewport PNGs retain observations;
`bug556-tabs-{unit,types,lint,browser}-v1-exit.json` retain original receipts.
`bug556-readback-v1.json` audits them; `bug556-artifacts-v1.json` is the closure.
One scoped config archived/removed, four exact Vite caches absent, all seven
owned process receipts terminal. Original planning documents pinned by the
preceding fixture closure are archived before the new ledger/runbook update.

`bug556-source-audit-v1.json` authenticates2091 current files and reconstructs
the entire preceding source hash with archived Tabs bytes: exactly one UI path
changed. Current full hash:
`e80f7e5848fd671b225af4c547b1332228acc8eb0fb3b50306a925bee19c0773`.
Data hash stays
`7dccbccb569f547fd595137e50e3f29795e7d0f53cb86dd2347ede8277ff4c1c`.
Historical balance results retain their original pins; no new balance acceptance.
Next native work uses `p15-current-source-run-v1.mjs`, which authenticates this
manifest/archived UI transition and inherited gameplay transitions. Old launcher
and evidence stay immutable. New launcher syntax passes; first runtime remains
unexercised and needs current-audit-aware readbacks.

Recipe overlay3 stays66matched/70unmatched/68boss-review/6missing-source,
ready58/accepted balance0. All skill/build/point/acquisition/pacing/economy/
holdout/integration/PWA/save/endgame/soak/review/owner gates remain open. The
Quests capture also exposes a legacy0Gold reward badge under the no-gold
contract; separate BUG557 tracks that rendering issue. Browser works; CI
excluded; no pending answer/external blocker. Root retains the live human2 claim.
