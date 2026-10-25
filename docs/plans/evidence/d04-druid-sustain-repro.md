# D04 — Feral Rage and Hunger native reproduction

BUG193 is reproduced at `d9f2e6a`, Node v24.21.0, seed7. This packet establishes
missing advertised behavior; it does not implement a fix, settle tuning, or
give either skill functional credit. Root is the sole author/reviewer.

## Actual native result

The script projects a legal level30 Druid through `playerToCombatUnit` with
exact class, ranks, complete prerequisites and the actual skill priority. It
then runs the actual registered attacks through `runBattleRecorded`. Synthetic
isolation sets wounded life5000/max10000, exactly one cast's mana, zero recovery,
crit and target mitigation, attackSpeed100, and a held10000HP living target.
A caster hold beginning1701ms permits exactly one paid hit at1700ms. Separate
Feral Rage cases permit the next action to observe its actual cadence.

| Attack | Rank | Actual hit | Mana paid / remaining | HP restored | Next Feral action gap |
| --- | --- | --- | --- | --- | --- |
| Feral Rage | 1 | 46 | 3 /0 | 0 | 1700ms |
| Feral Rage | 20 | 122 | 3 /0 | 0 | 1700ms |
| Hunger | 1 | 61 | 11 /0 | 0 | Not a Hunger promise |
| Hunger | 20 | 156 | 11 /0 | 0 | Not a Hunger promise |

All legal-priority, actual one-hit and exact-payment controls pass. Four
positive-life-recovery expectations and two Feral speed expectations fail.
The runner records real terminal exit1 in5.058s; the full original log/result
and script are retained. This expected RED is not a passing test gate.

Both locales advertise a Feral life/speed effect; Hunger explicitly steals
life. Feral's vague life wording requires a design reconciliation between
recovery and capacity. This reproduction directly records the absence of
healing, while the absent Feral speed and Hunger recovery are unambiguous.
Neither this ambiguity nor new numeric defaults should be silently resolved
inside a runtime patch.

## Root finding and next contract

The generic adapter creates physical damage and a `feral-rage` or `hunger`
status on the enemy. These markers have no caster-life or speed consumer and
neither skill authors the required tuning. Feral's secondary Bleed is also
dropped by the adapter; this is a separate source finding requiring actual
causal coverage before any claim of repair. Fixed damage/growth, ordinary
costs/cooldowns and native class/rank/prerequisite ownership already work in
the tested cases and must be preserved.

Before implementation, record explicit JSON-owned recovery, successful-hit,
speed stacking/refresh/expiry and lifecycle rules, and reconcile player copy.
Prove actual HP/cadence, mitigation/overkill, misses/resources, full/dead caster,
reflection and wave/replay/save boundaries. No implicit global drain, free
healing, new form prerequisite or unrelated skill behavior is authorized by
this reproduction. Independent design/QA and earned class/build balance stay
open. Both inventory rows remain unverified.

## Retention and limits

[Manifest](fixtures/druid-sustain-repro/manifest.json),
[original result](fixtures/druid-sustain-repro/native-red-result.json),
[original log](fixtures/druid-sustain-repro/native-red.log),
[original source](fixtures/druid-sustain-repro/native-repro.ts.txt) and
[cleanup](fixtures/druid-sustain-repro/cleanup.json) retain seven exact,
byte-verified raw files, the terminal receipt, six affected-source hashes and
the native audit. All seven task-owned temporary files were removed and the
scratch directory is absent; remaining paths/failures are `[]`. No server was
started, shared cache removed, game source edited or campaign action taken.

The genuine Ancients401 save remains L33/XP149261/23682gear/nextNormal402/
Nightmare0, with Baal uncleared, at decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
The preceding Druid attack batch's full13405/582/two existing skips and
engine6955/242 apply to unchanged runtime source; this repro does not broaden
that acceptance. Skill counts remain137unverified/74bounded-functional/one
engine-only/one review-needed. C2-C4/fullG0-G7/privatev1 remain unfinished;
the umbrella goal/worktree continue, root sole writer, local only.
