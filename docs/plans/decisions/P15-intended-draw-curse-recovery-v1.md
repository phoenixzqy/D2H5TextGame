# P15 — Use a learned offensive curse after an intended route timeout

Status: implemented and independently reconciled; earned Arcane clear and subsequent owned-offense Tomb completion; population acceptance open.
Date:2026-11-02. Owner:root.

The shared prepared suffix exhausts three Arcane attempts with full-Life hero/
Prayer. Independent readback retains all costs and exact observations. Recorded
turn analysis finds16defensive casts in each draw; Prayer supplies4083–4804boss
physical damage while hero supplies146–321total boss damage. Already learned
Amplify is a lawful offensive tradeoff. Four isolated engine battles verify one
exact control, then the same curse replacement on all three observed states.
All three variants clear in26629.639751552797/27985.639751552793/
19416.819875776397ms with full-Life hero/Prayer. Complete native observations
remain in `p15-bone-arcane-offensive-curse-v1.json`. No policy is accepted by those
isolated waves and no new seeds or earlier routes were selected/replayed.

Add optional `drawRecoveryPolicy: learned-offensive-curse-v1`, enabled only on
the intended Bone profile. At a native route admission, pass the previous settled
wave to the common combo-preparation boundary. After a draw in the same area,
with hero alive, native defeat return and immediately preceding admission ordinal,
select already learned/declared Amplify as the sole curse and put it first.
Retain CE/Wall/Teeth order, actual native cost/duration/effects, all skill/stat
ownership, gear and existing retry limits. This is a declared evaluation strategy,
not an automatic gameplay feature or combat-engine/data change.

This original route-only policy provides no recovery on training, victory, defeat, dead hero, missing/foreign/stale prior
wave, disabled policy, missing combo policy or unlearned/undeclared Amplify. A new
area or default boundary restores normal defensive selection. Preserve existing
Far Oasis preference. Record recovery source/selected curse with the priority
journal so an independent reader can derive the choice from settled history.
Do not add another area-specific override, coefficient adjustment or seed hack.

Validation: affected native combo/paid-effect/conservation and negative cases,
existing intended growth/area curse cases, scoped strict types and explicit lint.
Then declare a bounded earned suffix from the retained native pre-retry checkpoint
28/ordinal404, carrying authenticated ordinal403draw. This avoids repeating that
known admission and all141training admissions. The exhausted three-draw result
stays terminal and retained as comparison history. Full-area results, training to
Tomb32 and native quest/economy carry need independent readback before conclusions.

Checkpoint resume must carry the authenticated preceding route attempts and their
settled waves into shared retry accounting. A pre404 start after the403draw has
only two Arcane attempts left; it must not receive a fresh three. Reject missing,
stale, malformed or exhausted carry before any mutation. The continuation audit
must expose carried attempts separately from new admissions and verify their
terminal wave, contiguous ordinals, native XP and target-level custody. Preserve
all original three-draw comparison history. A suffix starts without replaying
403 or earlier training.

Plan review: revise→ready after adding explicit retry carry; change is one shared preparation strategy and one runner hook,
with an explicit opt-in and actual previous-wave custody. Current native bounds
remain. Security check: pass; authorized local repository/evidence only, no install,
network, publication, credentials, CI or protected saved-game writes. Required
packet remains through umbrella review; root owns cleanup/worktree release.
Full private v1 stays active; formal balance0/210.

## Verified result

The opt-in, previous-wave handoff and pre-mutation retry carry are implemented.
Affected regression cases, scoped strict types and explicit lint pass. The
bounded continuation uses `p15-intended-draw-recovery-v1-plan-v2.json`, restoring
the authenticated pre-404 save and carrying the spent 403 attempt and six waves.
Arcane 404 clears on the first remaining attempt. Four native quest actions read
the journal, claim Arcane, visit the Tomb and insert the owned Staff.

The continuation earns level 32 in 147 training admissions, then Tomb 552–554 all
draw at their sixth, boss wave. The training draw at 460 triggers the existing
persistent Dark Wood fallback. Total: 151 new admissions, 815 waves, 811 victories,
four draws, 1,955,780 XP (including 7,000 quest XP), 8,122 acquired / 7,620 salvaged items,
12,983,626.97945068 combat ms and 157,697.933925 wall ms. Terminal 32 / next 555 is
exhausted and must not be extended. The original three Arcane draws remain
comparison history; 403 and the earlier 141 training admissions were not replayed.

Independent `p15-intended-draw-recovery-v1-readback-v4.json` reconciles the exact
native export, ordered custody, currencies/materials, points, quest graph and
settlements, clocks/ordinals/seeds, party carry, merc XP and retry bounds. Prayer
earns 1,466,799 XP; Rogue 0. There are no new socket insertions: 310 native unequip
refusals and 22 stash-retrieval refusals are independently justified by full
backpack custody and preserve state. Earlier failed readers are retained; their
assumptions about successful transfers and zero quest merc XP were corrected,
without replaying combat or changing production behavior. Launcher exited 0 and
its exact cache is absent.

`p15-bone-tomb-turn-economy-v1.json` examines all three recorded Tomb boss waves
without running combat. Duriel starts at 25,600 Life and ends at 21,270 / 3,832 / 4,973. Hero
damage is 764 / 657 / 831; Prayer damage 3,566 / 21,111 / 19,796. Offensive recovery helps,
but it does not clear the boss. The party finishes nearly full Life/Mana, so
the next investigation is the declared corpse/curse build's boss damage and
lawful owned-offense/rotation tradeoffs. These observations do not authorize a
coefficient change or establish intended-population/pacing acceptance.

## Subsequent owned-offense completion

The shared weapon-selection change resolves the retained Tomb timeout without
changing curses or production combat. From authenticated pre552, the earned
suffix wins all six waves and claims Seven Tombs/unlocks Act III. It uses no draw
recovery and no training. Independent native export/custody/economy/points/quest/
clock/seed/party/mercXP readback passes in
`p15-intended-tomb-weapon-v1-readback-v1.json`. Terminal32/next553 is available for
Act III; exhausted555 remains terminal. All ancestor/comparison failures and
costs remain retained. BUG608/population/pacing and formal0/210 remain open.

The separate opt-in [training draw recovery decision](P15-intended-training-draw-recovery-v1.md)
extends the evaluation strategy to healthy training timeouts. Its explicit
stance evidence and original shared admission/loss limits are independent of
this original route-only policy; historical results above remain unchanged.
