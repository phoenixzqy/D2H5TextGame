# BUG-505 — Barbarian's invested paired attacks ignore weapon progression

Status: fixed locally; later-act coefficient balance pending. Severity: High for build viability.
Environment: human2/WSL/Node24, current private-v1 source.

Both retained earned level12 Barbarian builds stop at Burial Grounds104W3.
Double Swing9 deals1857 total direct damage; Double Throw8 deals1150. Both
draw60s with living heroes and unspent mana. Their hero has158Attack, but
the casts use only flat40–60/+4 or50–75/+5 per rank. The DamageEffect's
opt-in Attack contribution is absent, so equipment/core Attack does not
improve these invested skills against increasing ordinary Defense.

Reproduction: `src/engine/combat/fixtures/barbarian-act1-attack-frontier.json`
retains exact native parties, resources, enemies and seeds for both failures.
Regression: `src/engine/combat/barbarian-attack-frontier.test.ts`.
Sources: p15-earned-act5-barbarian-double-swing-v1 and
p15-earned-act5-barbarian-double-throw-v1 in the root-owned evidence packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

Expected: legal weapon/attribute progression contributes to the invested
paired physical attacks without requiring another flat-damage increase or
an enemy nerf. Rank1, strike/target rules, flat rank growth, costs, cooldowns,
prerequisites and damage mitigation remain the controlling existing behavior.

Implemented narrow fix: JSON-authored additional Attack per strike of
`20% × (rank − 1)`. Rank1 adds zero, rank2 adds20%, rank20 adds380%.
Reuse the existing shared Attack/damage pipeline and constrain the schema
to these two identities plus its already approved Multiple Shot identity.
The coefficient is provisional pending later-act/matched-level/holdout
balance; exact earned continuation and final broader certification remain
required. No seed override, free points/items, timer extension or source
combat monkeypatch is part of this change.

Validation: exact red reproduction failed8/passed2; corrected focused green
passed144/144 in five files. Both paired skills now clear the retained Burial
Grounds wave. Rank1/2/20, mitigation, registration and narrow schema identity
checks pass. Scoped source/driver type and lint checks pass; earlier passing
cases were not rerun for external script corrections.

Native successors: Double Swing clears remaining15/15 ActI waves and Claims
Sisters without farming. Double Throw clears Burial/Dark Wood, then retains
Catacombs107W4 and108W4 physical-burst defeats. Three owned Eld weapon sockets
raise Attack158→383; six owned El armor sockets add90Defense. Catacombs109
then wins6/6, Andariel4.116s,335.08HP. Actual once-only Sisters Claim unlocksII.
No extra acquisition, free item/point/XP grant, seed override or source tune.

Retained four-report readback independently rederives8admissions/38waves/
36wins/2defeats,70,980XP,309added/5,946removed owned items and9native socket
insertions. It accounts for each merc's actual XP/level change and validates
native admission seeds, playback time, point totals, old clears/Den Claim,
item payloads/materials/currencies, quest Claim and exact save lineage.
Report: `p15-barbarian-act1-readback-v3.json` in the root-owned packet above.
Later acts and final balance/fresh integration remain required.
