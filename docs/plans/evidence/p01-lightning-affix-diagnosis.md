# P01e03 — Reconcile the native Den Lightning failure with production services

Status: diagnosed baseline, no runtime change,2026-10-22. Input head `8460668`;
production source still `2f7df8a`. BUG-081 remains open. C0–C4/G0–G7/full v1 open.

One approved external Vite SSR process reused the existing production-path
`startEarnedRun`/`playEarnedWave` services. It decoded the exact retained native
`den-tracked-earned.json` with production `decodeSave`, populated process-local
stores only and proved complete six-domain equality before starting. Date fixed
1792497600000, Den seed2223645302/ordinal40, pity0/manual. No import/persistence or
browser state writes, added acquisition, registry replacement, tuning or seed sweep.
W1thenW2maximum, first refusal/nonwin stops; unexpected W2win would abort, not W3.

[Exact diagnostic source](fixtures/p01-lightning-affix-diagnosis.mjs.txt) and
[bounded machine evidence](fixtures/p01-lightning-affix-diagnosis.json) retain input/
script/runtime hashes,591complete recorded events,23resource ledgers, native
comparisons, source continuity and command receipt. One invocation exit0/4.184s,
60s hard process timeout, no retry. Runtime errors[]; in-process cleanupErrors[].
Original raw2,041,951byte report remains external; its SHA is recorded in fixture.

## Matching scope

Both native rosters/outcomes, all terminal HPpercentages, heroMP and capped log
tails match exactly. W1actual awards270heroXP/202mercXP/4items/133shards match.
W1duration7500ms/171events; W2duration18920ms/420events. Source/data/harness hashes
remain unchanged through completion. Diagnostic openings are cursor0; native
Pause snapshots may follow t0casts. Their values happen to agree in this witness;
this does not strengthen prior browser snapshots into general numeric-carry proof.
Fresh-process item allocator IDs may differ; no global allocator reset was used.
This is reconstructed service evidence, not a new earned browser run.

## Complete resource accounting

| Wave/unit | Opening HP/MP | Damage/recovery | Terminal HP/MP |
| --- | --- | --- | --- |
|W1hero|120/102|8physical; MP+70regen−76casts+18orbs|112/114|
|W1merc|196/79|6physical;3MPorbs at cap|190/79|
|W2hero|112/114|143rawLightning+17other;18HPorbs; MP+167regen−168casts+18orbs|0/131,30overkill|
|W2merc|190/79|48damage;18HPorbs;3MPorbs at cap|160/79|

Independent arithmetic from every actual damage/DoT/heal/orb/mana/death event
reconciles every unit to the authoritative engine outcome. Mana events carry the
committed value; orb cues are not counted twice. No heal event occurred.
ChampionShamanA297HP−142cold−71fire−38mercphysical−10DoT=36HP.
Its active Lightning casts at7653.846/11460/15258.242/18920ms yield hero40,
mercdodge,hero57,hero46. Hero before those hits113/74/16HP respectively.
The stub's2sCD is a minimum; first-usable skill priority, actor scheduling and
control determine actual3.66–3.81s consecutive late casts. No targeting bug is shown.
Lightning is the dominant observed damage contribution; this is no counterfactual
proof that removing it alone changes winner. Other damage/RNG/durability matter.

## Confirmed authority discrepancy and next boundary

Config `elite-affix/lightning-enchanted`→`monster-lightning`→factory append→registry
alias→hardcoded `monster.lightning`: single target40–60/2s/no status. Authored
`monsters.json`: all-enemies40–65/3s/Paralyze. Older `monster-spec.md` §8:
+50%Lightningresist/25%on-hit bolt. Monster level/ATK do not scale this flat stub.
D04MR0/resist0 works as specified; physicalDEF51 is irrelevant to Lightning.
D07preserved current affix skills; this is not a demonstrated composition regression.

Freeze a reviewed Act I affix-only semantics/power decision before runtimeRED/GREEN.
Evaluate endpoint damage/cadence against112HPcarry and234–360championShamanHP.
Keep D07core, D04mitigation, target selection, carry, acquisition and reward services.
Do not blindly register the whole authored monster catalog: that would broaden
Lightning area/status behavior and alter unrelated users. No additional browser
attempt or final pacing/campaign/claim/save/mobile acceptance follows here.

## Retention and cleanup

Exact ROOT:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-first-elite-r7una0p6/lightning-diagnosis`.
Root retains input manifest, raw report, script, log/receipt and later cleanup
receipt through bug/fix consumers, then removes after umbrella finishes.
All restorers, pity/clock restore, abort, server close and source verification
were independently attempted, preserving original errors; all succeeded.
Disposable tmp/cache cleanup follows independent QA and release of all readers.
No remote action; local evidence/bug publication only.
