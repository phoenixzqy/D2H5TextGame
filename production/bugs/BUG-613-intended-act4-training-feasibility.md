# BUG-613 — Make intended Act IV preparation feasible without losing productive farms

Status: open. Severity: High. Found: 2026-11-02. Owner: root (campaign preparation/QA).
Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus accumulated changes; production authority80, frozen121 campaign inputs.
Environment: WSL/Linux deterministic native harness; browser, viewport and locale do not affect this controller. Intended necromancer-bone (Corpse and curses).

## Reproduction

1. Use the retained authenticated prepared pre1232 export and frozen `p15-intended-act4-offensive-v1` plan/driver.
2. Carry the original102 training admissions, all three original quest Starts and the original admission/combat/wall ceilings.
3. Plains1232 draws;1233 wins and earns Fallen Angel Claim. River preparation starts at totalXP22786490 and requires level56 (totalXP36383607).
4. Observe Plains training draw1343,19 consecutive learned-offensive-curse training wins1344–1362, then draw1363. Admissions1364–1433 all train Dark Wood.
5. The200-entry River preparation allowance expires at level51/next1434. River is never admitted.

Expected: preparation uses earned cleared sources and a prospectively feasible policy; failure at a stronger source should not discard all other productive cleared sources. Costs and exhausted runs remain immutable.
Actual: the required13597117XP is not earned;200 training entries produce4559940XP. Durance previously won109/109 entries for3381390XP, but a Boolean fallback permanently restricts selection to Dark Wood. The final70 Dark Wood entries produce571200XP.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
- `p15-intended-act4-offensive-v1.json`, `.journal.jsonl.gz`, `.native-export.json`: terminal bounded run,202 new admissions/200 training,1116 victories/3 draws,level51/next1434.
- `p15-intended-act4-offensive-v1-readback-v2.json`: independent exact native save/custody/economy/quests/clock/seed/party/recovery/budget reconciliation; no combat replay.
- Fixed seed custody is in the frozen report/journal; this source-selection defect depends on the retained outcomes, not selecting another battle seed. Native run seeds advance under the original frozen plan.

Affected systems: shared Act III/IV campaign preparation and its independent audit (`tests/campaign/challenge-area-preparation.ts`); root/QA owns the test controller. No production capacity or combat failure is established by this report.

## Diagnosis and next action

`preparationTarget` requires the full challenge maximum; `trainingSource` requires a two-level margin. Runtime lines161–177 and audit lines294–301 reproduce persistent Dark Wood fallback after a failed recovery. Those policies can compound, so changing fallback alone is not yet a progression fix.

First derive a conservative native source/count/level XP upper bound for the200-entry allowance without running combat. Keep actual multiplier1 and earned clear eligibility. Then choose a coherent prospective correction against the real five-act reachability/pacing requirement. Do not lower a target merely to obtain a pass, increase spent allowances, revive1434/original1235, grant XP, or change production XP/balance speculatively. All earned failures remain evidence; full privatev1 and formal balance0/210 stay open.

Security check: pass; authorized local repository/generated evidence only. No credentials, install, network, CI, publication or protected player-save mutation. Worktree and packet remain retained through umbrella review; root owns cleanup.

## Structural bound and retained-state boundary, 2026-11-03

The zero-combat `p15-act4-training-feasibility-v1.json` projection proves a
generous upper bound of11280000XP for200entries, below13597117 required.
It includes every previously cleared source eligible below56, assumes every
wave contains20 enemies at the full challenge maximum and every admission wins.
Even that upper bound requires242entries. More farming under unchanged targets
cannot resolve this mismatch; D02 progression/pacing remains open.

The opt-in ranked fallback implementation has red/green source-selection and
forgery coverage. Additional constructed boundary cases prove exclusions and
spent costs survive a wall continuation and retain the three-consecutive-nonwin
limit. A new retained-state case fails: an unknown policy is rejected on creation
and audit but `enterArea` silently uses legacy behavior, allowing mutation.
Reject it at the runtime boundary before allocation/admission. Evidence:
`p15-ranked-fallback-boundary-red-v1.log/-exit.json` (one failed/two passed).

## Source-selection correction verified, 2026-11-03

The optional `ranked-cleared-v1` policy is implemented in the shared controller.
Failed sources are excluded during current route preparation; recovered wins
and same-source stance carry remain lawful, route wins reset exclusions, and
continuation reconstructs them from retained outcomes. Unknown policies now
fail at creation, retained-state runtime entry and audit before allocation or
admission. Omission preserves legacy behavior; no existing driver/profile opts in.

All74 affected constructed cases pass (24ActIV/50ActIII). After equivalent
validator/callback cleanup, four targeted boundary cases, scoped strict types
and explicit lint pass. The original boundary RED and initial lint failures
remain retained. No earned campaign replay, target/budget change or new native run.
Evidence:`p15-ranked-fallback-affected-v1`, `-boundary-green-v1`, `-types-v2`,
`-lint-v2` logs/exit receipts in the same packet.

The source-selection defect is locally fixed; this bug remains **open** because
preparation feasibility/pacing is unresolved. [D02 exact reference and pacing
analysis](../../docs/balance/2026-11-03-d02-xp-reference-and-pacing.md) establishes
the correct90-level reference and recorded source income without combat. At the
observed Durance rate, the original13,597,117XP gap is18.77combat-hours by
arithmetic quotient, not a future income guarantee. Select chapter levels and
rewards together before another bounded screen; preserve terminal1434/1235.

## Shared reward correction and prospective count feasibility, 2026-11-03

[Selected kill XP policy](../../docs/design/kill-xp-policy.md) is implemented
with validated JSON and shared production rewards. Costs/cap90, historical
exports, initial completion references14/32/47/61/82, preparation targets/caps,
margin and retry bounds remain unchanged.39focused cases, scoped types/lint and
actual Chromium mobile startup/import pass. Historical linear-reward income
above remains valid only for its frozen source.

`d02-cleared-source-feasibility-v1.json` authenticates actual preparedpre1232
at49/totalXP22,719,660 and independent preparation readbackv3. Already-cleared
Durance is eligible; all13ordinal count phases have at least51original enemies.
At minimum source level42 this is76347XP per complete victory;179conditional
wins fit the13,663,947XP gap to56 within200. No native admission, combat replay
or save mutation occurs. This changes the next action from unselected tuning
to one declared new-authority comparison with opt-in ranked fallback, inherited
102training/612victories, original3Starts/ceilings/full256060.07459ms wall expense.

Status remains **open**: actual bounded survival/feasibility and economy/pacing
are unproven. Do not revive1235/1434 or renew allowances. Implementation and
artifact references: [D02 report](../../docs/balance/2026-11-03-d02-kill-xp-implementation.md).

## Earned Act IV feasibility verified, 2026-11-03

The [declared shared-XP comparison](../../docs/balance/2026-11-03-intended-act4-kill-xp-completion.md)
now clears all three areas/quests through Diablo and earns ActVaccess at61/1429.
River114 and Chaos77 training entries fit the original200-per-area caps; all
original costs and ceilings are carried. Ranked fallback and learned recovery
are used lawfully. Independent readback verifies exact save/custody/economy/XP,
quests/points/merc/party/clock/seed and retry/fallback/bounds without replay.
Original exhausted1235/1434 stay immutable. No allowance renewal or XP grant.

Observed Act IV feasibility is resolved for this one build. Status remains
open solely for the broader earned pacing/economy qualification associated
with the reward correction; this result does not certify14populations or
30–50active-hour pacing. Next ActV uses the actual terminal export.
