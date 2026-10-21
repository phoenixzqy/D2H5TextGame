# BUG-058 — Grant paid Frozen Armor defense and retaliatory Chill

Status: Reproduced; runtime fix pending.
Severity: High — the active player buff spends mana without its advertised effects.
Owner: engine-dev; root implements, producer/QA independently review.

## Reproduction

Runtime commit `9bdfdbc`, plus independently reviewed Stage B reproduction tests.
Node24.21.0/Linux, Vitest engine project; browser, viewport and locale do not
apply to this pure engine reproduction. These are explicit engine fixtures,
not earned gameplay or campaign evidence.

1. Run `node_modules/.bin/vitest run src/engine/combat/frozen-armor.test.ts src/engine/skills/registry.test.ts`.
2. Seed7: give the exact authored/canonical player Frozen Armor skill rank1 or20,
   10MP and a combo entry. A real cast occurs at1700ms; explicit future stun and
   poison close the fixture after the cast. Check the captured rank, mana and
   cooldown. Repeat with zero/invalid allocation and bare marker controls.
3. Seed7: cast at900ms with attackSpeed200, then take a fixed100 fire hit at1700ms
   against defense20. Compare rank1, rank20 and unprotected controls.
4. Inspect pre-paid snapshot fixtures across all seven direct damage types,
   Melt/Inner Sight composition, lethal wearer ordering and canonical Chill
   refresh/cadence. Periodic fixtures remain separate from direct damage.

Expected, per [D05](../../docs/plans/decisions/D05-frozen-armor-v1.md): only an
allocated eligible paid cast captures immutable combat-only potency. Rank1/20
consume7/5MP and grant3%/60% ordinary defense. The same resolved, capped maximum
valid alias rank controls eligibility, cost, cooldown and potency. Bare exact
markers grant no effects and do not block the first legitimate paid cast.
The fixed100 fire hit deals79/68 instead of80. Landed direct positive damage
chills the living attacker once, after offensive statuses and before ordinary
deaths, without an extra RNG draw. MR and periodic rates remain unchanged.

Actual: only a marker is added, with no paid snapshot, defense or retaliation.
Unallocated/invalid combo entries still cast and spend mana; bare markers block
the valid cast. Aliases use first-positive/fallback rank1 rather than the shared
resolver. Fixed100 fire deals80 even with a paid-snapshot fixture; defense21
with Melt/Inner Sight deals88 instead of82. Chill cadence remains1700→3400
instead of1700→3700, and900→1800→2700 instead of900→2600 below the clamp.

## Evidence and root cause

Genuine prepatch RED:41 failed/77 passed,118 tests, exit1 in2.434s, with no
deadline/cap stop, cleanup signals or survivors. Frozen RED combat test SHA256
`f20b431cee68e923227f8436119b3bf2def4cf625d023af1e3f3b0e24cfef0cf`;
registry SHA256
`f26fa48d8c8b99bd79b067c0122f44718bec5a12ec1c7a70ef63e386d27a90cb`.

The entire unaffected2498-byte prepatch recording is preserved, with SHA256
`7ca6d4c9d59d6d74ad9b50e86895acc855f8dccc6f241ddb1e4827f8e4b5c91a`
excluding its evidence file's final newline. It includes all events, clocks,
delays, teams and outcome, including intentional stun/poison scaffolding.
The independent exact-literal parity freeze precedes runtime changes.

Root-owned RAW:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frozen-armor-wtwinptx`.
Reproduction evidence is `focused-b-red.log`, `focused-b-red-report.json` and
their command/process metadata; full control is
`stage-b-unaffected-prepatch-recording.json`. Preserve these until durable
evidence archiving and independent review finish, then root removes exact
task-owned artifacts.

`effectsForSkill` has no exact paid-snapshot metadata. `effectiveSkillLevel`
falls back to rank1 and picks the first positive alias; the generic buff gate
trusts markers. The buff handler adds only a marker. Shared direct defense
ignores the captured bonus, and direct-hit closure has no deterministic Armor
Chill. Fix those origins together, reusing canonical status handling. Native
wave configuration invalidation remains a separate required Stage C increment.
No workaround provides the advertised effects. No save migration, general buff
framework, campaign, balance or coverage claim is part of this report.

## Native wave-boundary reproduction (Stage C)

Stage B engine behavior is fixed in `ed05766`; native allocation invalidation
remains reproduced before its patch. In Node24.21.0/Linux, run the dedicated
`src/stores/combatHelpers.frozen-armor.test.ts` against that commit. Its exact
prepatch frozen SHA256 is
`18f6f807efe67384a2147e496cf3202dc42c81ab30873262633c6e196b4ae1ed`.
Browser/viewport/locale do not apply to these native integration fixtures.

Use real Blood Moor, seed7/challenge ordinal0, production paid rank20 Armor,
explicit equipped fixture gear and a registered finisher. Start, drain actual
events, then advance or explicitly replay after removing allocation. No paid
snapshot or winning outcome is fabricated. A labelled marker-representation
supplement adds aliases only to an already genuinely paid result.

Expected: at every playWave boundary, zero/missing allocation strips the paid
snapshot and exactly the authored/canonical/hyphen markers from new hero input.
Unrelated and actual mercenary markers, stored replay baseline, prior recording
and original resource carry remain intact. Restoring positive allocation during
replay restores the original paid baseline, without resource/reward duplication.
Actual: spread-based fresh configuration retains the old snapshot and markers
regardless of the new allocation. The first failing assertions confirm that
retention; positive-rank, equipment and genuine lifecycle controls pass.

Genuine RED:10 failed/10 passed,20 tests, exit1 in4.395s. No deadline/cap stop,
cleanup signal or survivor. Evidence: `focused-c-red` log, JSON report and
command/process metadata in the root-owned RAW above. `playWave` refreshes
stats/skills but does not invalidate the carried armor when allocation resolves
to zero. Fix that boundary on the newly constructed input only; never mutate
the carry baseline. Owner: engine/store developer; producer/QA review read-only.
No gameplay retry, campaign, balance, browser or reload acceptance is claimed.
