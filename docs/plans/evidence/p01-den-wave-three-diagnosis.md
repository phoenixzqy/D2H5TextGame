# Den wave-three diagnosis

Status: reconstructed production-service evidence at `5be82d3`, not a new earned
browser run or campaign acceptance. The preceding [native witness](p04a09-lightning-den-earned-discovery.md)
won waves1–2 and drew wave3. This reconstruction explains that draw without
changing gameplay, acquisition, skills, equipment, RNG or the native result.

## Execution and provenance

The first diagnostic exited1 after5.189s: W1 combat matched, but awarded map
comparison exposed a missing caller action. Its input save precedes MapScreen's
`setCurrentLocation(1, 'a1-den-of-evil')`. Failed source, report and receipt remain
unchanged. The corrected diagnostic invokes that production caller action and
asserts only currentAct/currentSubAreaId changed; all prior assertions remain.
One corrected invocation exited0 in4.283s, no timeout (55s execution/5s grace).

Frozen [script](fixtures/p01-den-wave-three-diagnosis.mjs.txt),
[runner](fixtures/p01-den-wave-three-diagnosis.py.txt) and
[machine evidence](fixtures/p01-den-wave-three-diagnosis.json) retain bindings to
the input save, all source hashes, both receipts and raw evidence. Corrected raw
SHA256: `0af927044f386ed2ba2cf723ff99dec3ecdd27faf771b051b8ce0326d4c1e403`.
Middleware SSR opens no listening socket; production decode/stores/earned-run
services execute in process. Original and restored store domains match; source
hashes remain unchanged and cleanupErrors is empty.

## Results

| Wave | Winner | Terminal ms | Events | Scheduled action/stunned | Actual awards |
| --- | --- | ---: | ---: | ---: | --- |
|1|player|7500|171|27|270heroXP,202mercXP,4items,133shards|
|2|player|21000|449|71|400heroXP,300mercXP,18items,379shards,1wishstone|
|3|draw|60000|1349|254|none|

All36 unit HP/MP accounts reconcile, as do all4 living-ally inter-wave carry
comparisons. Native terminal roster, HP percentages, hero MP and log tails
match all3waves. W1/W2 player, merc, map, currency and bag counts match; complete
W2 backpack contents match excluding only top-level allocated item IDs. Fresh
process IDs were not reset. W1 full item-content equality is not claimed.

W3 hero HP57−66damage+27orb healing=18. MP137−560casts+516regen+30orbs=123,
minimum117. Merc HP168−195effective damage+27healing=0, with196raw damage and
1overkill; death at57188.311688ms. Actual skill order contains only Frost Nova
and Fire Bolt:20casts each. Ice Bolt is learned but **not slotted**.

Rare leader L7 has855HP,77armor,9MR,55%elemental/30%physical resistance.
It takes171damage:94Frost+15Fire+20merc physical+42DoT, leaving684HP.
All15landed Fire Bolts and20landed arrows deal1. Fire4 maximum before armor is
57×1.01Warmth×2crit×0.45resistance=51.813; even Inner Sight leaves57.75armor.
Arrow results are observed, not a universal bound: crit plus Freeze can cross
armor. A rare-minion Stalker remains at25/389HP;9other enemies die.

The inclusive60000ms deadline ends combat with both sides alive, below the
1000-action cap. No timing, carry, mana, mitigation or targeting contract
violation is demonstrated. This is an encounter/power-budget finding for one
build/seed, not proof that every build fails or a unique tuning prescription.
No BUG or runtime change follows from this diagnostic alone. GD recommends a
Den entry-power/encounter-durability contract before further tuning.

## Evidence recovery and limits

The compact JSON preserves all1969events unchanged and ordered, opening/outcome
teams, actual item/currency/XP awards,36resource-account summaries and every
resource row. Recover a resource row's omitted event as `wave.events[row.index]`.
Repeated combat event arrays and whole store snapshots are omitted only from
the compact publication; complete raw evidence remains externally retained.
This is W1–W3 only: no W4, full Den, quest claim, Save/reopen, mobile or Andariel.

Independent QA found ADEQUATE and GD-DESIGN-REVIEW APPROVE on the raw diagnostic.
Exact publication review is recorded in the ledger. Both task process groups
are absent. After all readers released, root removed only each diagnostic's
`tmp`/`vite-cache` (2files/46bytes total); remaining[]/failures[]. Raw reports,
sources, logs, analysis and receipts remain root-owned under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/lightning-w3-diagnosis`
and sibling `lightning-w3-caller-diagnosis` through design/fix/umbrella consumers;
root removes them when those consumers finish. No remote action.
