# BUG-714 — Give late Holy Bolt an offensive aura investment

Status: Allocation locally fixed with earned Normal completion validation. Independent acceptance remains open.
Severity: Medium (manual allocation is available).
Owners: game-designer/level-designer; root implementation.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
WSL/Node native allocation and retained combat evidence; viewport/locale N/A.
Read, without replaying, Ancient's Way911/wave4, run seed2212147446:
[retained checkpoint](../../docs/plans/evidence/p15-holy-bolt-act4-and-act5-checkpoint.md).

1. Follow `paladin-holy-bolt-intended-v1` targets and aura selection.
2. Max Bolt/Hammer, then invest every available late point in Prayer20.
3. The level52 hero draws at60s, full1061Life/538Mana, with three Frozen Terrors
   alive. The profile never purchases or selects an offensive aura.

Expected: late caster investment can improve damage using existing legal auras.
Actual: the canonical evaluation profile permanently prioritizes more healing
   despite this observed damage-limited encounter. No engine defect established.

## Correction contract

From40, after Bolt20/Hammer20 and before Prayer20, purchase Thorns1, Sanctuary1,
then Conviction20. Keep Prayer1 and select Prayer until Conviction is actually
learned; then select Conviction through the existing native idle action. Later
Prayer20 remains a target. Preserve all earlier targets, core stats, gear,
signature priority, authored coefficients and native point rules. No implicit
reset. A constructed63-rank native reset should yield Conviction19 with no free
points; removing inherited HolyFire1/Zeal1 is an explicit reset consequence.

This allocation slice does not spend the real save's reset or admit combat.
The earlier cadence diagnostic and all exhausted training budgets stay closed.
A separately scoped retained-wave check and earned continuation are required
before any Normal-completion claim.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-holy-conviction-e81aux0m`.
Root retains required evidence/human2 through umbrella review, then owns exact
cleanup/release. No commit yet; full privatev1 acceptance remains open.

## Local result — 2026-11-04

Latest validation: [earned Normal completion](../../docs/plans/evidence/p15-holy-bolt-merc-survival-normal-completion.md).
After one owned mercenary helmet replacement, the same earned Conviction route
wins Ancients913 and first Throne914,15/15waves. Earned growth reaches
Conviction20/Prayer2; exact successor53/next915 includes all Claims, Baal title
and Nightmare unlock. Separate raw readback passes without gameplay replay.
Equipment and earned growth also changed circumstances; this does not isolate
the aura's campaign effect or establish population/independent acceptance.

[Offensive aura and earned frontier](../../docs/plans/evidence/p15-holy-bolt-conviction-act5-frontier.md).
All13selected regressions, scoped types/explicit lint and native retained-wave
control/candidate readback pass. The sole Conviction19candidate clears the prior
wave in52.935s. One genuine free skill reset63ranks/allowance3→2 prepares the
actual52/next912save, preserving gear/stats and all unrelated domains.

After a zero-gameplay driver-boundary correction and passing preflight, actual
Ancients912wins four waves then draws on wave4 with one15,585Life champion.
Hero remains1,059Life/549Mana;38Bolt casts/106,295direct damage. Prayer died
in wave3. Exact terminal52/next913save/rewards/quest graph readback passes.
No Throne/Claim/retry/training, production tuning or Normal-completion credit.
BUG647 retains dense Act V viability; wider balance/full v1 remain open.
Original driver/reader failures and all costs retained, no gameplay replay.
