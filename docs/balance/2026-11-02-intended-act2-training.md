# Intended Act II training selection — 2026-11-02

Current result: [owned-offense companion weapons](../plans/decisions/P15-intended-merc-weapon-offense-v1.md)
complete Bone Act II from authenticated pre552: one admission/six victories,
35470XP,69items,163767.8350515464combat ms, no training or salvage. Native Seven
Tombs claim unlocks Act III; terminal32/next553. Independent first-pass readback
`p15-intended-tomb-weapon-v1-readback-v1.json` reconciles exact native export,
ordered custody/economy, points, quest/cache rewards, clocks/seeds, party carry,
mercXP and prepared suffix bounds without replay. Prayer gets26602XP; Rogue0.
All production/campaign frozen inputs match. Affected selector/prefix20 checks,
scoped strict types and explicit lint pass. Earlier histories/costs remain;
exhausted555 is not extended. BUG608/full population/pacing acceptance remain
open; formal balance0/210. Next use per-area preparation for Act III.

## Previous learned-recovery result

Recorded result: [learned draw recovery](../plans/decisions/P15-intended-draw-curse-recovery-v1.md)
clears Arcane at level 28 and completes four native quest actions. The shared
controller carries spent attempt 403 into its existing three-attempt limit;
Arcane 404 wins on the first remaining attempt. It then earns level 32 through
147 training admissions and reaches the Tomb boss on attempts 552–554, all draws.
The training draw at 460 triggers the existing persistent Dark Wood fallback.
Total: 151 new admissions, 815 waves, 811 victories, four draws, 1,955,780 XP,
8,122 acquired / 7,620 salvaged items, 12,983,626.97945068 combat ms and
157,697.933925 wall ms. This does not establish human active-hour pacing.

Independent `p15-intended-draw-recovery-v1-readback-v4.json` reconciles the exact
native export, ordered custody/economy, paid points, quest graph/settlements,
clock/ordinal/seed, party carry, merc XP/levels and carried retry bounds.
Prayer earns 1,466,799 XP; Rogue earns none. No new sockets are inserted:
310 native socket-transfer refusals and 22 stash-retrieval refusals preserve
custody/materials and are justified by backpack capacity. Failed readers are
retained; the successful audit corrects transfer-success and zero quest-merc-XP
assumptions without replaying combat. Affected implementation checks, scoped
strict types and explicit lint already pass; no broad suite was repeated.

All three recorded Tomb boss observations are preserved in
`p15-bone-tomb-observed-waves-v1.json` and analyzed in
`p15-bone-tomb-turn-economy-v1.json`. Duriel's 25,600 Life ends at
21,270 / 3,832 / 4,973; hero damage is 764 / 657 / 831 and Prayer damage is
3,566 / 21,111 / 19,796. With nearly full party Life/Mana, the remaining finding
is damage within the timer. Next inspect the declared corpse/curse identity's
boss rotation and lawful owned offense; no production tuning is justified yet.
Terminal level 32 / next ordinal 555 is exhausted and must not be extended.
Earlier 141-training and Arcane-control admissions were not replayed; all
ancestor/comparison costs remain. BUG608 and formal balance 0/210 remain open.

## Previous prepared suffix result

[Checked prepared suffix](../plans/decisions/P15-prepared-act2-suffix-v1.md)
passes88distinct affected cases and final scoped types/explicit lint. From the
authenticated pre-Arcane28/403 checkpoint, all three existing native route attempts
end in boss draws:18waves/15wins/3draws,42900XP,144acquired/98salvaged items,
580068.3726708074combat ms. One known exact control plus two new retries; no
training or new sockets. Independent v2 exact native export/custody/economy/
points/quest/clock/seed/party/mercXP and detailed parent-control readback passes
without replay. Hero/Prayer finish all draws full Life; Summoner216/1445/312Life.
Terminal28/next406 stays terminal; no Arcane clear, Tomb entry or quest action.
The existing retry policy is exhausted for this branch. BUG608/full acceptance
remain open; next examine recorded damage/utility/curse/equipment strategy.

The preceding owned-socket result remains retained:

Current follow-up: [shared owned sockets](../plans/decisions/P15-intended-owned-sockets-v1.md)
sustain141training admissions and earn28, then win five Arcane waves before a
boss draw. Total142admissions/711waves/710wins/one draw,1774780XP,
6978acquired/6498salvaged items,22paid insertions and13415809.389607545combat ms.
Independent v2 native export/ordered custody/socket/economy/points/quest/clock/
seed/party/mercXP readback passes without replay. Hero and Prayer finish the draw
at full Life; Summoner216Life/two Flayers172/421remain. Terminal28/next404,
no Arcane clear or new quest action. BUG608/full retry/population acceptance stay
open; formal balance0/210. Native pre-Arcane28/ordinal403 checkpoint is retained
for a declared bounded retry comparison without repeating training. Historical
failures below remain evidence and must not be extended.

BUG-607 is fixed locally. Intended Act II preparation now honors the existing
`cleared-level-margin-v1` policy. It selects the highest full-challenge enemy
maximum within hero level minus2 among already cleared Act I/II areas and
re-evaluates before every farming admission. Ties use the area ID. With no
eligible source, preparation stops before admitting. At22, Dry Hills(max20) is
eligible; Far Oasis(max22) becomes eligible at24; Lost City(max26) at28.

The admission audit derives selection from each recorded entry level and prior
clear custody. It cannot use later live-map clears or count the current victory
as a prior clear. Historical profiles without the policy retain their earlier
selection/retry/fallback behavior. This changes evaluation preparation only;
production combat/data and player controls are unchanged.

Both original defect cases reproduced RED. All37 affected Act II cases pass,
including changing source after growth, no-source refusal, consistently forged
unsafe/uncleared/lower-ranked/wrong-act sources, historical retries and budgets.
Final scoped strict types and explicit lint pass. The four forgery cases alone
were rerun after correcting a readonly fixture assignment. Failed check receipts
remain. No full suite, unrelated campaign, browser replay or build was needed.

## Bounded earned comparisons

Both comparisons start at the authenticated conditional Lost City successor22,
nextNormal262, with16 completed Act II quest actions. They seek earned28 before
one Arcane admission, with200training/201total admissions,24million combat ms,
360s wall and first-nonwin stop. Neither reaches Arcane. Both terminal histories
and all ancestor costs remain; neither terminal branch may be extended.

| Policy | Admissions / waves | Wins / nonwins | Earned XP | Acquired / salvaged items | Combat ms |
| --- | --- | --- | --- | --- | --- |
| Latest cleared Lost City | 2 /10 | 9 /1draw | 26200 | 63 /41 | 231912.19195404762 |
| Corrected lower-level Dry Hills | 2 /9 | 8 /1defeat | 16810 | 60 /45 | 117786.32916818483 |

The first comparison farms enemies above the hero's level. Its second challenge
draws against Greater Mummies while hero survives with ample Mana; BUG-607 fixes
that selection defect. The corrected comparison selects Dry Hills at22 both
times and obeys the margin. Its second challenge loses: Prayer dies in wave3,
hero carries77Life into wave4 and dies after9720ms. Wave3's caster damage is the
main immediate loss of Life; low Mana is not implicated. BUG-608 records the
remaining survival/progression finding without claiming a population failure
rate or applying speculative combat tuning.

Independent journal readers reconcile both exact native exports, ordered item
custody, XP/currency/material economy, paid points, quests, clocks, ordinals,
native seeds and living-party Life/Mana carry without replaying combat. The
corrected reader verifies both recorded source selections and full challenge
maximum20 within entry22 minus2. Arcane remains unentered; Staff prefix16 and
quest state are unchanged. Both terminate22/nextNormal264 in separate branches.

## Source and artifacts

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- `p15-act2-safe-training-policy-freeze-v1.json`:2142 exact production77 inputs,
  113campaign inputs; two changed paths since area-curse freeze, eight cumulative.
- `p15-act2-safe-training-red-v1.json`, `green-v1.json`, `green-v2.json` and final
  `types-v3-exit.json`/`lint-v3-exit.json` (all with the same prefix).
- `p15-intended-arcane-prepared-v1-readback-v2.json`: original draw reconciled.
- `p15-intended-arcane-prepared-v2-readback-v1.json`: corrected-selector defeat
  reconciled; report SHA256
  `5e67cec6b4616bfbd4c6df9ae4c50e93f50aa85b3aec5664d6a761ecc35d008a`.

A launch preflight incorrectly used Vitest's aggregate passed count for a
filtered run; it stopped before launching or admitting. Its retained receipt
records zero admissions; the corrected gate counts actual assertion statuses.
All consumers are terminal, exact owned Vite caches absent. Required evidence
and the worktree remain with root through umbrella review; root owns cleanup.

Next inspect the wave3 caster damage/recovery and attainable owned-defense
tradeoffs before a new single-variable policy/tuning diagnostic. Full private
v1 remains unfinished; formal balance acceptance **0/210**. Fourteen earned
populations/holdouts/fairness, acquisition/funding/economy/recruitment/Hell,
retry/manual-idle,30–50active-hour pacing,BUG592/performance,G0–G7,soak/review and
later owner playtest remain. Browser works; CI excluded; no pending answer or
external blocker.

## Follow-up: persistent fallback and defensive priority

BUG609 is locally fixed: a training loss persistently falls back to prior-cleared
Dark Wood until route victory, retaining the full maximum<=entry-level-minus2
constraint. All40 affected Act II cases and scoped types/lint passed. This is
the full controller's recovery policy; the external first-nonwin diagnostics
below deliberately stop earlier and do not test that complete recovery path.

The defensive-priority follow-up yields4admissions/18waves/17wins/one defeat,
39360XP,143acquired/133salvaged items and290617.11340206186combat ms. Three Dry
Hills farms finish; ordinal265 loses wave3. Terminal22/nextNormal266, no Arcane
entry or new quest action. Independent readback also verifies native merc XP:
Prayer29519XP, remains21; Rogue0XP, remains17. Exact export/custody/economy/
points/clocks/seeds/selections/party carry pass without combat replay.

Eleven affected priority assertions pass (44 unselected), scoped types/lint pass.
A separate two-battle exact-control comparison moves Teeth before Wall; both
lose (14100ms/13living enemies versus19200ms/nine). The swap is rejected; no
profile/production tuning was made. All terminal diagnostics remain terminal.

Production77/2142 and113campaign inputs were independently rechecked before
successor edits. `p15-defensive-curse-artifact-closure-v1.json` hashes the retained
fallback, defensive-priority, readback and paired-wave evidence plus the previous
closure. All diagnostic consumers are terminal and their owned caches absent.
Next evaluate owned empty-socket preparation; BUG608/full acceptance remain open.
