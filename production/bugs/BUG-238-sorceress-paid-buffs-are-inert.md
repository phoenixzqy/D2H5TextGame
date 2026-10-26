# BUG-238 — Paid Teleport and Enchant are inert

- Status: locally fixed and verified; independent acceptance and earned balance open.
- Severity: High — both advertised paid utilities had no gameplay effect.
- Reproduced at: `d9c7a12c`; Node 24.21.0 / Vitest 1.6.1, native Sorceress adapter.
- Owner: root sole writer/reviewer; independent design/QA and earned balance open.

## Reproduction and expected behavior

Compose a native L30 Sorceress with legal allocations/prerequisites, only
Teleport or Enchant in priority, diagnostic Attack 100/HP 100000 and exactly
one cast's MP, without regeneration. Compare the same cast/payment/action
against its original inert effect. At seed7, ranks 1/20 Enchant emits no Fire.
Across seeds1–64, rank 20 Teleport and its inert control both dodge 5/64 incoming
Fire hits at 2000ms after the 1700ms cast. Neither emits finite paid status state;
both only add permanent `activeBuffIds` markers.

Expected: paid Enchant adds Fire to later weapon hits; paid Teleport changes
magical evasion through the game's no-movement adaptation. Finite timing and
real effects must match the advertised skills. All five native reproduction
tests fail before repair; payment, Physical-roll, replay and input controls
pass before the failed checks. Original `native-red.log` and receipt retain
handle 84463/exit 1/7.43s in this task's evidence packet.

## Root cause and repair

Generic buff adaptation only stored an ID. No damage or dodge consumer read
those markers, leaving the authored coefficients unused. A Fire-spell multiplier
would not implement the weapon-enchantment promise.

[D05](../../docs/plans/decisions/D05-sorceress-paid-buffs-v1.md) replaces the
markers with source-bound finite paid statuses: Teleport grants magical dodge
for 1s, one percentage point per paid rank; Enchant captures Attack/rank for 10s
and adds Fire base of captured Attack × rank × 0.02 to hostile direct Physical
hits. Duration and Enchant coefficient interpretation remain provisional tuning.
The Fire component shares the original hit/crit decision, uses ordinary Fire
mitigation, adds no Burn and closes statuses/death/rewards once. Reflection
counts Physical HP removed only. Both buffs coexist and suppress active recasts.
Paid snapshots carry across waves; fresh/imported runs start unpaid. Native
ownership/prerequisites/payment are validated, old markers grant no power,
and bilingual details/chips state actual effects. Save version 22 is unchanged.

## Validation

95 new tests across six files cover causal effect/payment, ranks 1/2/20, exact
expiry, shared RNG/crit/misses, mitigation, carrier statuses/death/reflection,
spell/periodic/aura/armor/DoT exclusions, refusal/recast/coexistence, schema and
native ownership, immutable carry/reallocation/Attack changes, save/import and
bilingual UI. Engine 8168/305 files, final types, repository/explicit browser
lint, production build/precache/bridge scan pass. Final production browser 8/8
passes: en/zh-CN × desktop/mobile × both skills, 16 exact six-domain save pairs,
eight actual offline fresh-page Continues and 40 geometry checks.

The final quiet full suite passes 16371 tests across 740 files, with two existing
skips, in 682.23s (684.04s process). This is local bounded functional proof;
independent design/QA and earned balance remain open.
[Delivery record](../../docs/plans/evidence/d05-sorceress-paid-buffs.md) retains
original failures, fixture corrections and screenshot limits. No timeout,
assertion, worker setting or discovery scope was weakened. BUG180/237, test
budgets, independent acceptance, earned balance and full private-v1 gates remain
open. The genuine Ancients401 save/Baal state is unchanged; no campaign or
remote action belongs to this repair.

The delivery record links final receipts, source/build/save identity, author
self-review, retained raw diagnostics and exact cleanup. Root owns retained
diagnostics through original-failure review and full-v1 evidence consumers.
