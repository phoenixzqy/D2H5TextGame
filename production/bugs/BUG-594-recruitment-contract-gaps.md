# BUG-594 — Implement the documented recruitment rarity and pity contract

Severity: High. Status: mechanics implemented and locally verified; acquisition/funding and independent acceptance remain open.
Owner: root / engine-dev / frontend-dev / content-designer.
Affected plan: F07 / P13 / D10, then P15 acquisition and funding.

Latest: live100-shard upgrades, natural-stat/signature effects, bilingual star
controls and sequential reveal/Skip are implemented. The final focused checks
and public earned browser roundtrips are in
[star/reveal evidence](../../docs/plans/evidence/2026-11-02-recruitment-stars.md).
The dated paid-recruitment section below describes the earlier stage, not
current missing star/reveal code. F07/P13 remain open for broader acceptance.

## Reproduction

Working source authority34, 2,106 inputs; source hash
`aef085ff643770b4e80209ba6761bbda370fe38bf8958354f04c4bb64c701d21`.
Node/Vite SSR native production modules; engine-only, no browser/locale dependence.
Both zh-CN/en share the banner and roller. No store, payment or save is mutated.

1. Load `loadMercPool()` from `src/data/loaders/mercs.ts`.
2. Call native `rollMany(createRng(180), pool.rates, 0,
   pool.pity.ssr.threshold, 10)`: all ten rarities are R.
3. Call the same native function with seed54 and count50: no SSR occurs and
   final pity is50.
4. Inspect the authored banner: SSR/SR/R10/30/60%, SR/SSR thresholds30/90.
   Payment uses `rollMany` with only the saved SSR counter; it never supplies
   or persists an independent SR counter.

## Expected

Reconcile and implement the existing locked `docs/design/gacha-spec.md` contract
through the ordinary recruitment transaction: base SSR/SR/R2/13/85%, independent
persistent10/50 pity guarantees, documented resets and uniform tier pools.
Clarify the spec's conflicting next-pull versus Nth-pull wording in the concrete
implementation contract before adding state. Preserve old earned roster/wallets
and historical counters explicitly. F07 also requires the still-unaccepted
duplicate/shard/star behavior; a rate edit alone must not claim completion.

## Actual

Rates differ; SR pity is not implemented even at the authored30 threshold;
SSR uses90. Native seeds prove the advertised10/50 floors absent. Existing
payment/route/cost work preserves its narrower transaction behavior, but its
acceptance notes explicitly leave full rarity/pity/duplicates unaccepted.
`GachaScreen` displays the live rates/SSR threshold, so this is a design/feature
gap, not a claim that those visible percentages disagree with the actual roll.

## Evidence

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`bug594-recruitment-contract-repro-v1.ts`, runner, JSON and run log. Reproducer
also proves all authority34 inputs restored and the canonical earned checkpoint
hash unchanged. Relevant source: `src/data/gacha/banner-config.json`,
`src/engine/gacha/roller.ts`, `src/stores/gachaActions.ts`, `src/stores/metaStore.ts`.
Prior scope: BUG155 and `docs/plans/p13b-earned-mercenary.md` leave full
recruitment mechanics unaccepted. D10 preserves prices10/90, not the current
rarity/pity deviations. No ratified exception is located in those contracts.

## Next implementation and workaround

Write a concrete F07 contract for Nth-pull boundaries, legacy-counter migration,
independent SR/SSR save ownership and duplicate/star economics. Add authored
banner validation, implement native state/transaction/UI paths and meaningful
boundary/rollback/persistence cases. Then measure acquisition distributions.
Do not replace cross-session SR pity with a local ten-pull-only guarantee,
retroactively award shards, reset historical wallets, or certify funding against
unimplemented mechanics. Ordinary deterministic hire remains usable; it does
not fulfill the gacha contract. No user answer or external blocker is required.

Security check: local first-party engine/data only; no external instruction,
network, publication, credential or permission action. No grants/earned state
changes, installs, commits or pushes occur during reproduction.

## 2026-11-02 implementation progress

The ordinary paid action now uses authored2/13/85% rates and independent10/50
Nth-draw guarantees. SSR keeps its original owner. Version33 adds
`meta.recruitmentState` (SR misses, ordinal and last100 receipts) and
`mercs.recruitmentProgress` (canonical merc shards/stars). Frozen32 catalogs
include all current51 quests, four new physical identities and six ranged
item bases; native earned32 migration adds only empty new fields/version33.
Legacy89 misses are preserved until the next paid draw, which guarantees SSR.
New-model pulls thread ownership within batches and give15/5/2 duplicate shards.
History and shard publication share the existing wallet/roster lease and rollback.
Shards/stars remain earned across dismissal; no historical grants are inferred.

The recruitment screen exposes both counters, persistent timestamped history,
copy controls, actual duplicate receipts and full base/pity disclosure in both
locales. A pure explicit star-spending plan exists, but NO live star-upgrade
action, natural-stat/signature-rank projection or star UI is accepted yet.
The existing reveal is immediate; full sequential animation/skip acceptance
also remains. F07 and funding/acquisition acceptance stay open.

215 affected cases pass:164engine/data/save and51store/UI. Real Chromium desktop
1280×800/en and mobile360×640/zh-CN import the authentic earned32 source through
Settings, export the exact33 migration, pay90 for a ten-pull, copy ten receipts,
preserve original actors/items, flush Save and reload/export exactly; history
survives. Neither context has browser errors or horizontal overflow. Browser
artifact `bug594-browser-recruitment-v3.json` is authoritative; v1/v2 are retained
harness-selector failures, not product failures. The canonical earned source is
unchanged. No combat/campaign or economy simulation is replayed.

The first combined definition run exposed a stale test repair value(.6) after
correcting the authored R rate to.85; it now restores the authored value. Earlier
new-module RED reports contain zero assertions; actual save rollout RED had
nine failed assertions. Global typechecking also exposed fixture version pins
and two pre-existing campaign mock return-type errors; those test fixtures are
updated without rerunning their campaign paths. Final check results belong in
`docs/plans/evidence/2026-11-02-recruitment-v33.md` and the continuing packet.
