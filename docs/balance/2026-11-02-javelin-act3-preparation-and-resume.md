# Earned Javelin Act III preparation and partial continuation

Private v1 remains incomplete. The retained Amazon is now level 28 at normal
ordinal 358. Great Marsh and Flayer Jungle are cleared, with Khalim's Brain
and Heart retained. Kurast Bazaar wave four remains the next unfinished gate.
The complete retained chain contains 358 admissions, 1,459 waves and twenty
defeats; no final balance cell is accepted.

## Changes and evidence

The first earned Act III continuation preserved the twenty-one Act II actions,
cleared Great Marsh and recovered the Brain. Flayer Jungle wave four then
killed the level-24 hero in 5,580 ms despite full 439 Life and 298 Mana at entry.
Actual Doom Ape physical attacks were 253/379; there was no Enrage status.
The old raw-240 probe already reached the armor floor for that hero, and the
level-28 training boundary was scheduled later, before Durance.

BUG-565 adds a verified partial Act III route. It validates successful ordered
prefixes, live quest/item/receipt state, earned Act III access and prior actual
clears before preparation. Fresh and resumed routes share the same unfinished
suffix. Earlier encounters, quest Starts, recoveries and Claims are retained.
Interrupted assembly/Claim/orb boundaries are covered through action ten;
the pre-Durance callback and resulting profile remain supported.

BUG-566 moves the existing target-28 Great Marsh preparation to Flayer entry.
Its 120-admission/8,000,000-combat-ms and three-consecutive/ten-total-loss bounds
remain. Gear forecasts use physical 379/568.5 at 95/5 weighting and all five
elemental channels at raw 240. This is a direct-hit selection model, not a
control or win-rate model. Production gameplay, JSON data, rewards and all
2,091 original provenance inputs are unchanged; campaign authority 14 binds
the maintained tooling changes.

The ordinal-300 continuation performs 56 training admissions, earning level 28
with 53 wins and three defeats in 2,239,015.044 combat ms. It then wins all six
Flayer waves and recovers the Heart once. Bazaar waves one–three win; wave four
loses after entering with 219/498 Life following wave-three attrition. It faces
level-39 champions with Attack 416. Four of the five Lightning Strike damage
events in that wave are dodged; this observation does not establish a population
failure rate. No additional farming, replay of completed quest actions, manual
resource fill, socket action, reset, grant or seed override occurs.

That continuation totals 58 admissions, 290 waves, four defeats, 1,231,300 XP
and 2,303,351.044 combat ms in 44.735 seconds of wall time. Every economy,
training, recovery, quest, export/readback and source audit passes. The earlier
Act III continuation also has no audit errors. Combined new Act III evidence
adds 60 admissions, 299 waves and five defeats to the retained Act II checkpoint.

## Verification and next action

Fifteen focused regressions fail before the fixes: nine positive resume cases,
five mitigation cases and the preparation boundary. All 106 affected checks
then pass (58 Act III route, 16 Javelin progression, 32 survival selection).
Scoped strict types pass. Explicit lint initially finds two test-file style
errors; after correction all five changed files pass lint. No unaffected act,
build, broad unit suite, browser run or CI job is replayed.

A read-only in-memory comparison of actually owned gear finds that relaxing
Mana capacity to a 150 reserve changes no hero selection. Its first diagnostic
attempt omitted the logical clock and fails preflight on timestamp alone; that
failed driver and receipt are retained. The corrected comparison passes with
zero income. It supplies no justification for a reserve-only change or another
seed-only attempt.

Next inspect the authored Act III level progression (Bazaar area 35/champions
39 versus hero 28), owned gear eligibility and wave-three physical attrition.
Declare an evidence-backed progression/equipment adaptation before resuming the
exact ordinal-358 save with twenty-one Act II plus four Act III actions.
Do not repeat the opening, Brain/Heart recovery or accepted area coverage.
Fresh acquisition reliability, fourteen-build/five-act population/holdout balance,
economy/fairness, 30–50 active-hour pacing, retry/manual/idle, G0–G7, soak,
review and later owner playtest remain open. Browser works; CI is excluded;
no user decision is pending.

Shared evidence is retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
the earned and prepared Act III continuation policy/driver/result/journal sets,
source authority 14, red/green receipts, Bazaar comparison attempts and
`p15-javelin-act3-preparation-diagnosis-v1.json`. Cleanup and check receipts are
in `p15-javelin-act3-preparation-artifacts-v1.json`. Root retains this packet and
the active claimed worktree until their full-v1 consumers finish.
