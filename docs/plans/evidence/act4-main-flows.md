# Act IV: Izual, Hellforge and Diablo functional delivery

2026-10-23. Local branch `feat/playable-foundations`; final validation revision
`e6474b7564024e4e528a439c480b29f2dcef041b`. All three main flows implement the
[compact Act IV contract](../decisions/D11-compact-act4-contract.md).
This is constructed-fixture functional evidence; earned campaign acceptance
remains open.

## Resulting behavior

Fallen Angel requires the qualified original Izual encounter and living hero.
Its separate once-only Claim grants9000hero/6750mercXP and2skill points.
Hellforge requires the qualified original Hephasto victory before recovering
the actual bound Hammer. Explicit Shatter consumes both that Hammer and the
retained actual Mephisto Soulstone atomically, with no XP. Separate Claim pays
7000hero/5250mercXP, the strict one-pick ilvl56 Hellforge cache and3gem shards.

Terror's End requires the three ordered seal actions and a new eligible
original Diablo victory after them. Early Diablo clears retain ordinary
income and the existing Act V availability, without quest credit or later
backfill. Claim grants25000hero/18750mercXP and the strict ilvl61 five-pick
Diablo cache once. Main quest totals are41000hero/30750mercXP and2skill points,
separate from ordinary combat income and level-up awards.

Source-bound items, receipts and original-member admission persist through
save16 with literal historical validation and no inferred historical rewards.
Product commits include `783b780`, `c86be6c` and `1180e80`; transaction and
admission coverage includes `862a712`.

## Validation

| Check | Result |
| --- | --- |
| Full `npm test -- --cache=false` |9678tests/338files PASS;239.65s|
| `npm run test:engine` |4501tests/123files PASS;63.60s; subset of full suite|
| Typecheck; full lint and engine purity |PASS|
| Production build with `VITE_E2E` unset |PASS at409f091;760files/four emitted JS chunks pass debug-token scan|
| Final production browser matrix |10/10PASS;629.494s; retry0, skipped0, unexpected0, flaky0, global errors[]|
| Post-run frozen integrity |2545tracked source files and760build files unchanged; HEAD/status unchanged|

The production build is attributed to `409f091`. All seven paths changed
between that build and final `e6474b7` are tests or documentation; production
source is unchanged. Exact changes and hashes are recorded in
`corrected-freeze.json` and `corrected-final-integrity.json` in diagnostics.

Browser cases cover en and zh-CN at360×640,412×915,640×360,1280×800 and
1920×1080. They import the exported prior A3 constructed-power Guardian save
with actual retained Soulstone and no A4 progress, then use actual UI starts,
native Izual/Hephasto/Diablo encounters, Recover, Shatter, serial seals and
Claim. They assert exact deterministic cache/XP/currency changes, preserved
prior gear identities, zero XP from actions and duplicate refusal. Actual
Save→close→new-page Continue checks exact player/inventory/map/mercs/formation
at claimed Izual, both Forge inputs owned, Forge consumed/unclaimed, seals
with no backfill, Diablo unclaimed and all three claimed stages.

Final report retains70JSON and50PNG inline attachments, all independently
checked. Both-language360×640 consumed-item screenshots were visually inspected.
The Node-side Vite oracle printed WebSocket port warnings; captured browser
console/page errors remained empty and all assertions passed. The oracle
never introduces a browser debug bridge.

The first desktop attempt exposed an invalid harness assumption that optional
unclaimed `rewardClaimed` must be literal false. `409f091` corrects it to
not-true while retaining exact completion/proof/reward assertions; the next
desktop run passes2/2. Full-suite failures were four stale Act III-only data
expectations, corrected in `54d2648` without changing product validators.
[BUG103](../../../production/bugs/BUG-103-act4-browser-unclaimed-flag.md) and
[BUG104](../../../production/bugs/BUG-104-act4-data-expectations.md) retain the
original failures. Independent QA approves source and final evidence with
security PASS; the reviewer ran no tests.

## Remaining acceptance and evidence ownership

This does not close fullP14/F10/C2, a fresh earned Act IV clear, manual
screen-reader acceptance, balance/pacing or any fullG0–G7 gate. Fresh evidence
remains the genuine310-victory Act I clear and partial Act II ending at an
actual Radament draw. C0/C1 remain narrowly accepted; C2 underway; C3/C4 open.
Act V integration, seven classes/213skills, economy/crafting/endgame and the
30–50active-hour fresh first-clear target remain in the full goal.
Suite-time budgets remain exceeded.

Root retains required diagnostics at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-a4-delivery-lsw5xgtt`.
`retained-evidence/` preserves final and prior reports, original failure
screenshots/context/traces and selected mobile PNGs. Input provenance/hash,
logs, manifests and integrity/cleanup receipts remain until A4 and umbrella
consumers finish; root owns their eventual removal. `cleanup.json` maps old
report attachment prefixes to their preserved locations. All six exact
task-owned disposable build/browser/collection directories were removed;
remaining[]/failures[] and preview4359closed. Shared caches/tools are preserved.
No push, PR, merge or deployment was performed.
