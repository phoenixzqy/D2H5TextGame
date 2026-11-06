# P15 — Ordinary spear progression

Date: 2026-11-03 (local). BUG661 is fixed locally in retained uncommitted source.
Private-v1 acceptance remains open.

## Result and scope

Four two-handed metal, affixable spear bases fill the missing family progression:
Trident10 (10–24), Military Fork24 (22–48), War Fork35 (32–62), Mancatcher52
(50–95). Socket maxima2/3/4/5 follow existing equipment curves. Both locales
supply names; the existing staff icon proxy is reused. Starter Spear and War
Pike's polearm family remain exact. No engine/schema/save changes.

61 additive ordinary loot picks across28 tables cover the declared finite10–122
source envelopes. Weights reuse the earlier per-family allocation and remain
provisional economy tuning. This establishes availability, native materialization,
equip/mastery and persistence; it does not prove earned acquisition, Act IV
viability, 30–50-hour pacing or formal balance acceptance.

Decision: [P15 spear](../decisions/P15-spear-progression-v1.md).
Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-spear-progression-v1`. Root retains it and human2 through umbrella review and
owns eventual exact cleanup/release.

## Automated verification

151 distinct affected unit cases pass across the retained runs:

- Spear content62: every supported table level, boundary rejection, strict
  schemas, isolated native reward materialization for every tier intersection,
  damage rolls/rarities/socket maxima and bilingual art references.
- Equipment4: atomic underlevel rejection, lawful two-hand shield displacement,
  native Attack upgrade, noncompounding Spear Mastery/critical chance and custody.
- Affix39, ActII eligibility8, complete predecessor-delta1, catalog37.
- Final scoped strict types and explicit lint of all seven affected TS files pass.

`green-corrected-content-catalog` retains107 passing cases; earlier equipment4,
affix39 and predecessor1 are not repeated. The original expected ladder RED is
retained in `red-ladder`; `red` is a launcher-option failure, not regression proof.
Earlier failures remain: offhand expectation corrected from undefined to native
null; critical bonus uses native fractional0.1; maxSockets is required explicitly
for TypeScript. Stale catalog85/metal40 expectations omitted previous ranged/
throwing additions; historical74/metal31 sets remain literal while independent
progression deltas produce totals100/49. ActII historical comparison independently
excludes the already-added sword rows. See `test-corrections.md` and original logs.

## Browser evidence and limits

Four distinct Chromium cases pass across two reports: original desktop en/zh-CN
and mobile zh-CN, plus isolated mobile en. No test/source change between reports.
The original mobile-English attempt timed out at character-creation→Settings:
trace shows a document reload at `/town` before Settings click and a return to the
empty title screen. Cause is unproven; retained trace and final-frame capture
preserve the setup failure. It is not counted as a pass or claimed fixed.
Only that failed case was rerun; the isolated case passed in19.36s.

Public controls import constructed owned level60 gear, equip starter and upgrade,
export/save/reload, and verify exact equipment/backpack/currency/map preservation,
77 native Attack gain and exact restored derived stats. Both languages load art;
no browser warnings/errors or horizontal overflow in passing cases. This fixture
is not an earned campaign. `browser.json`, `browser-mobile-en.json` and eight
hashed captures in `captures.json` retain results. All eight captures were
inspected: bilingual names/icons, bounded scrollable modals and visible actions
at1280×800 and360×640. Other viewport/a11y/umbrella acceptance remains open.
Screenshot montage attempt found no Pillow; no install or montage was created;
individual captures were inspected directly.

## Preservation, review and cleanup

`verify-preservation.py` independently builds exact expected JSON from authenticated
preimages plus literal four-base/eight-name declarations and the declared loot
intersections. `preservation.json` passes: all11 preimage hashes,96→100 bases,
all38 tables equal exact predecessor plus61 declared appended picks in28 tables,
and all old locale values unchanged. Campaign source/profile hashes and both
retained Double Throw exports remain unchanged (SHA256
`7091185addcaf28a06ba9e6630fd160391bfb87935ec37aa1b9be2dcab88244c`).

Root review: additive content fixes the missing family without altering mastery,
retyping polearms or gifting campaign items. Reward tests isolate picks and make
no acquisition-rate claim. Security check passes for local authored data; no
permission/network/dependency/export-behavior change. Independent umbrella review
and formal economy/balance acceptance are still required.

Both browser launchers and Playwright PIDs are absent; each launcher reports Vite
closed. Exact task-owned types/browser configs and Vite cache were archived as
needed, removed and absence verified in `cleanup.json`. Logs, source preimages,
reports, trace, captures and scripts remain required evidence at the exact packet
above, owned by root. No unrelated process/cache cleanup; no campaign replay,
renewed attempts, full suite, install, new agent, CI, commit, push or publication.

Counts remain14 intended ActI clears /3 five-act Normal completions / formal0/210.
BUG656/BUG659 ActIV throughput, BUG592 large-save performance, remaining build
viability, economy/pacing, offline/PWA/endgame and final integration/review/soak/
later owner playtest remain open. No pending user answer or external blocker.
