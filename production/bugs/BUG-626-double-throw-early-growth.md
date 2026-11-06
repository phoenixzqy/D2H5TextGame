# BUG-626 — Strengthen Double Throw's pre-unlock attack allocation

Status: Fixed/verified for the declared earned Act I route. Severity: Medium. Owner: root (campaign build policy). Population/holdout acceptance remains under BUG611.

## Accepted native reset policy — 2026-11-03

[Recorded result](../../docs/balance/2026-11-03-double-throw-native-reset.md):
the single prospective native trial completes Act I at13,118admissions/
354waves/352victories, retaining both losses and existing bounded recovery.
Swing5 develops the pre-unlock attack; native Akara reset at12 refunds13actual
ranks, reduces only free skill uses3→2, and reallocates into Throw. No healing,
currency spend or unrelated domain change from reset. Catacombs117wins all six
original waves at Throw10. Five campaign-policy/test files retained;2151
production inputs unchanged. Ten affected checks, scoped types and explicit
zero-warning lint pass. Separate complete save/journal/economy/reset readback
passes without replay. BUG611 remains open for representative growth, holdouts
and balance; this one earned route does not establish population acceptance.
Earlier rejected trials below retain their original dispositions.

## Attack-before-Howl candidate — 2026-11-03

The retained recovery-first draw spends13Howl and13Throw actions while ending
281/282Life and130Mana with one enemy74Life. Test a new policy that places Howl
after Double Throw/Double Swing/Bash, retaining paid recovery first and the
early Swing bridge. Howl remains learned and available when preceding actions
cannot cast. Native recovery usefulness/payment/cooldown and all production
skills/stats remain unchanged. This is a new bounded fresh trial, not an
extension of either rejected campaign. Root plan/security review: ready/pass.
First reproduce attack displacement in a constructed native rotation; verify
affected paid allocation/rotation checks, scoped types/lint, then exactly one
prospective ActI campaign under unchanged limits. Adopt only on independently
reconciled ActI completion; otherwise restore both policy/test files exactly.
Frozen plan/backups: root packet `p15-throw-control-v1-*` / `-before-*`.
No gameplay success or population acceptance is claimed before the result.

## Attack-before-Howl trial rejected and restored — 2026-11-03

The single prospective run stops at level12 without boss entry:110admissions,
316waves/313victories. Den acquisition reaches12; Burial Grounds105W3 defeats
the hero, then bounded Cold Plains recovery109W3 draws. Independent journal/
terminal-save/source/economy/clock/allocation reconciliation passes. Recovery
readback verifies868unique paid bodies,8793Life/3740Mana restored and1736Mana
spent. Its first reader assumed unlearned attacks were projected in skillOrder;
that assumption is corrected in retained v2 without replaying combat.

Nine affected regressions/scoped types/explicit lint pass, but the frozen ActI
completion criterion fails. Both policy/test files are restored to exact prior
bytes;2151production and130campaign inputs match the baseline manifest. Exact
temporary type config is absent and all four recorded process IDs are terminal.
Rejected candidate/receipts/readers remain in root packet under
`p15-throw-control-*`. BUG626 remains open. No extension/replay or tuning follows.

The final draw casts Throw32times at rank2 with111Attack, yet its79Defense
champion survives136/608Life. The candidate also retains Swing5/Bash4 early
investments. Next inspect native one-time skill-reset affordability and
reallocation at Throw unlock before any further skill coefficient change;
this is a question for source inspection, not an accepted new policy or trial.

## Reproduction

Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, working production tree
`8bf6b59060bf9920a8f97a7fa0cc5236780c43938816ce81fdf315b9cdf315a0`.
Environment: native Node campaign; browser/viewport/locale not applicable.
Creation timestamp: `1793469600000`; production chooses admission/wave seeds,
not a supplied engine seed.

1. Start `barbarian-double-throw-intended-v1` with level-training execution and
   bounded Act I recovery; earn level 6 and claim Den.
2. Continue bounded Den acquisition with normal native points and owned gear.
3. Inspect level-7 ranks and the retained losses at ordinals 47, 48 and 49.

Expected: before Double Throw unlocks at 12, the recommended policy develops
its actual multi-target attack with available native points. Double Throw
still receives its unlock point at 12; all ranks remain legal and earned.

Actual: Double Swing stays rank 1 while Throwing Mastery receives the next
available point. The build stops at level 7 after three consecutive losses;
later waves also exhaust mana and kill the mercenary. Allocation is one
candidate cause, not an established explanation for all losses.

## Evidence and proposed correction

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Original journal: `p15-den-acquisition-native-v1/barbarian-double-throw-intended-v1.json.journal.jsonl.gz`.
Final accounting: `bug625-retained-audit.json` (pass, no combat replay).

Try Double Swing rank 5 before Throwing Mastery rank 1, with Double Throw
rank 1 ahead of that bridge so level-12 acquisition cannot be delayed.
This deliberately moves the early mastery milestone from level 8 to 13;
mastery still reaches its final target. No production skill/stat adjustment.
Use native allocation regressions with/without a constructed Den reward,
then exactly one fresh native Act I campaign under unchanged recovery/budgets.
Retain the canonical candidate only on a reconciled Act I clear; otherwise
restore this profile and record the negative result. Native viability and
population balance cannot be inferred from constructed allocation tests.

Workaround: use another build. BUG611 remains open for population progression.


## Rejected candidate — 2026-11-03

One prospective native trial reaches level 14 / Act I boss, then loses
Catacombs wave 5: 135 admissions, 419 waves / 414 wins. Independent whole-save
and journal reconciliation passes; the declared Act I-clear criterion does not.
The original allocation is restored, with five relevant growth checks passing;
canonical bounded Den acquisition remains enabled. Seven candidate allocation
cases/types/lint pass but do not override the gameplay failure. This issue stays
open; no production tuning or population benefit is claimed.

Rejected source and full readback are retained in the packet above under
`p15-throw-bridge-rejected-*` and `p15-throw-bridge-readback-v1.json`; rollback
receipt `p15-throw-bridge-rollback.json`. No replay or extension of this trial.

## New candidate — paid corpse recovery, 2026-11-03

Read-only inspection of the rejected journal shows wave3/4 attrition leaves
130/372 Life entering Catacombs wave5; hero Mana stays at least46 until death.
The recommended policy never learns existing Find Potion. Its rank1 native
contract consumes one real body/2MP for capped10%Life/5%Mana recovery; empty
supply or no useful gain skips without payment. Shout is already passive.

Try Find Potion1 immediately after Howl1 and put recovery before Howl/attacks,
after late Battle buffs. Combine with Swing5 before Mastery1, reserving Throw1
priority at12. This replaces one pre6 Bash filler investment; the earlier
bridge's deliberate mastery milestone13 remains. Preserve all final targets,
other builds, stats, native recovery/admission limits and production semantics.

Security check: pass; local policy/tests and inspected exclusive evidence
launcher only. Plan review: ready; verify paid allocation/rotation with and
without the real one-time Den claim from constructed completion, then one
fresh Act I trial. Adopt only on independently reconciled Act I completion;
otherwise restore this candidate. No population acceptance or causal claim.
Prospective plan/baselines are `p15-throw-recovery-v1-*` in the same packet.

## Recovery-first candidate rejected — 2026-11-03

The single trial stops at level12: Cold Plains wave3 defeats the hero; its
bounded Den recovery attempt draws on wave3. No boss entry. Independent v2
readback reconciles all111admissions/305waves/301wins,11stat/14skill allocations,
three distinct training intervals, full terminal save and economy. The original
reader's one-training-interval assumption failed; its failure and corrected
reader are retained without replaying combat. Paid-recovery readback verifies
1,134unique body payments,9,598Life/4,068Mana restored and2,268Mana spent.

In the final draw, the hero finishes281/282Life and130Mana (minimum127), with
13Throw/13Howl/12recovery actions and one enemy at74Life. Recovery-first priority
therefore consumes attack opportunities even for small deficits; extra recovery
does not establish viable progression. Eight focused candidate checks had passed,
but Act I completion failed the adoption criterion. Both candidate policy/test
files are restored to exact pre-candidate bytes; rejected copies and receipts
remain under `p15-throw-recovery-*`. Disposable type config removed/verified.
BUG626 remains open. Do not replay or extend this closed trial.
