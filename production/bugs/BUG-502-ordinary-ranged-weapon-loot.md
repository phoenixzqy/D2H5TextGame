# BUG502 — Restore ordinary campaign ranged weapon upgrades

Status: Fixed locally; targeted data/loot checks and native acquisition verified.
Severity: High — the ordinary Bow weapon-upgrade path is absent after level10.
Owner: Root (content/game design); private-v1 P15, local only.

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, dirty current-source
private-v1 worktree. Environment: Node24.21.0 deterministic native campaign
harness in WSL; browser/viewport/locale are not involved in this data path.
Exact native1465 Izual wave seed: `2839233830`.

1. Inspect the positive equipment entries loaded from
   `src/data/loot/treasure-classes.json` and resolve their actual item bases.
2. Select ordinary campaign trash/champion/unique/mini/boss/quest tables.
3. Look for positive bow/crossbow entries beyond the starter bow's level10 cap.
4. Inspect the earned Bow level40 export and new Act IV acquisition rewards.

Expected: ordinary campaign weapon loot includes eligible ranged upgrades,
so a Bow build can improve its weapon through the same basic loot loop as
melee builds. Normal/magic/rare quality, finite level eligibility and actual
equipment requirements remain enforced.

Actual: the only ordinary ranged entry is the training bow in Act I trash,
levels1–10. Non-starter bows/crossbows occur only as unique/set entries in
Treasure Goblin loot. All30 tables with weapons were inspected. The new Act IV
span earns4651 items and zero ranged weapons. The level40 hero still equips
its earned level3 training bow with18Attack. Native1465 survives Izual60s but
leaves13017 of38410 boss HP; mana remains102. This identifies an upgrade-path
defect, without proving that a particular new weapon will win that encounter.

## Evidence and next change

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`p15-bow-ranged-loot-gap-v1.json` binds the table audit, exact source/data
hashes, earned weapon,4651 acquisition items and retained Izual metrics.
`p15-bow-act4-level40-continuation-v1.json` is the unchanged earned successor,
next1466 with35 successful canonical actions. Prior rewards are immutable.

Restore ordinary ranged loot at the content source before tuning Multiple
Shot again. Record the new weight/quality/level policy; account explicitly for
the historical D08 tests that assert unchanged predecessor loot pools/seeds.
Their historical preservation claims cannot describe intentionally retuned
current loot. Preserve the old evidence and replace stale current-contract
expectations with meaningful checks for the accepted new policy. Run only
affected loot/schema checks, then acquire new gear from native1466 onward.
No replay of old farming, Acts I–III, Starts/Claims or socket costs.

Possible alternate sources include special Goblin/gacha rewards; these do
not restore the missing ordinary weapon path. Full balance/pacing acceptance
and the remaining build matrix remain open.

## Resolution — 2026-10-31

Six tiered bases and120 append-only ranged picks across28 ordinary tables
restore the upgrade path. Source weights/rarities/envelopes are documented in
`docs/plans/decisions/P15-ranged-weapon-progression-v1.md`. The95 affected
loot/schema/preservation checks pass. Historical D08 component checks retain
their original semantics; current-source assertions cover the declared delta.

The old1466–1477 acquisition retained107 items but sampled one frozen-clock
seed (BUG503). Keep those rewards; do not count them as independent samples.
The corrected clock-aware continuation resumes1478. Three new acquisitions
earn a native Siege Crossbow with58Attack; the normal equipment service
equips it.1481 clears Plains W1–W4, draws against Izual49 (43619 initial HP,
21173 remaining; hero431HP/259MP). Next1482/level40/35actions is retained.
This closes the missing-loot defect; Izual balance and campaign acceptance
remain open. See `docs/plans/evidence/p15-ranged-loot-clock.md`.
