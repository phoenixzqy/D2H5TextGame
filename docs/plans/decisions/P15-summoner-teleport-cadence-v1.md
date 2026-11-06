# P15 — Summoner defensive cast opportunity

2026-11-05, BUG782. Root sole writer; existing claimed human2 worktree.

## Contract and diagnosis

The canonical Summoner advertises Fire Ball, Frost Nova, Lightning and Teleport.
Teleport is a real one-second +50 percentage-point magical dodge window, with a
three-second cooldown. Its native bar never reaches that skill: shared3/3/2s
attack cooldowns cover every1620ms action. Standalone spell tests do not satisfy
native usability. Summon Adds already uses separate startup/preparation logic.

Set only the Summoner's `skillCooldownOverrides` to canonical
`monster.fire_ball:6` and `monster.frost_nova:6`. Retain Lightning2s,
Teleport3s, the full authored order and the existing startup summon contract.
At native unmodified speed110 the ordinary cycle becomes Fire Ball at1620ms,
Frost Nova3240, Lightning4860, Teleport6480, then repeats after6480ms.
Each attack still lands its existing damage/status/delivery. Each Teleport
window expires1000ms after actual cast; active effects are never recast.

Six whole seconds gives the first two attacks enough recovery to expose the
fourth action (4860ms since Fire Ball,3240ms since Frost Nova). Lightning's
existing2s cooldown already blocks its consecutive use1620ms later. No round-
robin scheduler or global spell tuning is needed. The less frequent attacks
deliberately make room for the authored defensive action; whole-encounter
fairness/duration remains provisional. Slows, controls, death and available
actions may change a priority sequence; short encounters need not show all moves.

This supersedes only the retained cadence clause of
`D11-summoner-durability-v1.md` and
`P15-summoner-earned-elemental-profile-v1.md`. Their adopted life, resistances,
armor, MR, encounter/reward and guards remain controlling. No save-format change.

## Bounded proof and review

New native-factory regression must fail before data changes, then prove all
three elemental damage types, paid Teleport/expiry, startup summon, immutable
input and deterministic recording. Check shared spell definitions are unchanged,
override metadata copied/frozen, schema and the existing Summoner/cooldown tests.
Run only Teleport cases from mixed-archetype files; do not renew completed
campaigns, population/holdout samples or exhausted historical controls.

Browser proof uses constructed input and the actual CombatScreen with projected
native events, both locales/mobile and desktop. It is not earned progression,
population, live pacing or full-v1 acceptance. See the evidence successor.

Plan review: ready; existing data path fixes priority starvation without changing
AI or replacing advertised behavior. Root self-review only; independent
acceptance remains open.

Security check: pass; local JSON/tests/docs only, no credential, permission,
dependency, network or publication changes. Browser works; CI excluded; owner
playtest later. No pending user question.
