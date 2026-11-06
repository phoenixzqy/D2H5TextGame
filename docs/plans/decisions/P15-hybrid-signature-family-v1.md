# P15 — Four hybrid signature action/numeric rows

Type: bounded catalog repair/provisional tuning;2026-10-30. BUG415/BUG087.
Root sole writer, existing claimed private-v1 worktree; advisers read-only.
Existing authorization covers this routine implementation. CI excluded;
Chromium works. No dependencies, publication or save-format change.

## Exact change

Remove only generic Weak/StrongMelee/WeakRanged entries, preserve signature
order and every other field. Add explicit ordinary point curves:

| monsters/ suffix | Attack/growth | Remaining native skills |
| --- | --- | --- |
| act2.infidel | 40/6.25 | monster-charge, monster-enrage |
| act2.saber-cat | 35.2/5.5 | monster-leap-attack |
| act3.thorned-hulk | 40/6.25 | monster-thorns-aura |
| act5.frozen-terror | 40/6.25 | monster-frost-aura |

These extend existing provisional heavy/agile role coefficients; no numerical
balance signoff. Inventory becomes78authored/33pending, all111acceptances
unaccepted. All ordinary delivery remains melee. SaberCat's WeakRanged was
already unreachable behind CD1WeakMelee; removing both does not implement a
throwing identity. No runtime, skill payload, schema or locale changes.

## Actual native behavior and exclusions

Infidel1620ms: Charge,Enrage marker,ordinary,Charge,ordinary,ordinary.
Saber1460ms: LeapAttack,ordinary,ordinary repeat. Hulk1820ms: oneThorns marker,
then ordinary. Frozen1620ms: FrostAura/ordinary alternating. Appended elite
skills may fill gaps; ManaBurn exposes ordinary physical attacks.

Enrage and ThornsAura are one-time marker buffs with no native speed/damage/
reflection effect. Preserve them honestly; actual enrage/reflection needs
separate implementation. FrostAura is an active all-enemy cold15–25/CD3 attack
with Chill, not passive pulses/Freeze. Preserve75%coldresist. Charge/LeapAttack
already use validated immutable physical payloads. Keep all payload bytes,
RNG, statuses, timings, target rules and formulas unchanged. Exclude six other
nonboss curse/arcane/corpse rows and27boss/special definitions.

## Native consumers and acceptance

Infidel/SaberCat have no literal authored consumers in current complete source
inventory; do not infer no dynamic use. Hulk has seven ActIII literal waves.
Frozen: Eldritch challengeL63 oneOverseer+threeFrozen allboss; NihlathakL71
oneWarpedShaman+fourFrozen allboss. Exact ThroneW2 source act5-tod-w2-e1 has
fourBaalMinions+twoFrozen L75elite; retain provenance/quest proof. Glacial
modifier has sixL90trashFrozen acrossW2/3/4, absent fromAshen. Frozen Attack
684/764/653/596 respectively. Source/action checks are not earned viability.

Meaningful native RED before mutation: literal lists/level/tier curves, exact
cadence/signature/ordinary damage, actual ManaBurn, nonattack/factory RNG,
immutable replay/plain parity, elite precedence, all-target FrostAura and
listed native consumers. Update the older Frozen priority fixture to ordinary
without losing endpoint/status/damage assertions. No payload repairs.

Freeze one2200fights/arm diagnostic: fourtrash atsynthetic20/20/30/60, four
Frozen components atnative63boss/71boss/75elite/90trash, unchangedL12Tainted/
DarkArcher/Disfigured controls.11specs×2starting-stat unequippedBasicBarbarian/
FireBolt1Sorceress×100seeds0–99=22cells. Native60s/1000actions,600swall/
256MiBcompressed. Full raw/metrics/hash/source reconciliation, subject-action
histograms, team damage/status/periodic events, net-versus-cumulativeHP,
A/B/A/plain parity,600exact unchanged controls. Pair normalization only enemy
skillOrder/Attack/Range, never simulated. Exactly fourlist/pair structural
changes; all other source bytes identical. One new test plus old priority test
may differ only with explicit hashes. All22cells and victory-censored TTK n
reported. No retry/tuning/favorable seeds/reward/pacing/earned acceptance.

## Plan, root cause and security review

Ready: addresses generic suppression in authored lists, with exact native
contexts, source/proof/rosters, marker limitations and melee delivery explicit.
No selector workaround or identity redesign. Independent read-only design
adviser recommends the bounded four; root accepts provisional role curves.
Security: pass, local JSON/native tests/owned diagnostics only, no credentials,
network, permissions, dependencies or publication. Finish with related checks,
types/scoped lint, independent QA/evidence review and exact disposable cleanup.
Raw failures/receipts and existing claim retained through umbrella acceptance.
