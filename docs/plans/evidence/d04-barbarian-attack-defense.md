# D04 — Concentrate Defense, Berserk conversion and Stun

2026-10-25; root sole writer/reviewer. Locally fixed/verified in
`9e4de157`; exactly Concentrate, Berserk and Stun receive bounded functional
credit. Independent design/QA and earned balance remain open.
[Contract](../decisions/D04-barbarian-attack-defense-v1.md),
[BUG219](../../../production/bugs/BUG-219-concentrate-missing-defense.md),
[BUG220](../../../production/bugs/BUG-220-berserk-missing-attack-conversion.md).

## Delivered behavior

Concentrate grants paid personal Defense before its existing single Physical
attempt, including on misses. JSON tuning is provisionally5%per rank for1000ms;
ranks1/2/20 grant5/10/100%. The bonus adds to existing temporary Defense through
ordinary mitigation and never mutates base stats or restores HP/MP. Exact
inclusive-start/exclusive-expiry timing, source-bound copied potency and fresh
native authority prevent unauthorized casts, stacking or active recasts. Rank
and priority edits affect future casts; paid residual Defense retains its rank
until expiry across waves. Save22 persists configuration, not transient power.

Berserk adds the JSON100%snapshot Attack contribution to its existing
80–120/+8-per-rank base, converting the whole hit to Arcane through the existing
attack-scaled damage primitive. Magical dodge/MR/Arcane resistance and Arcane
increases apply; ordinary Defense/Physical resistance and Physical increases do
not. It remains one20MP/CD2 attempt, with no second Physical hit.

Stun preserves its45–65/+4-per-rank Physical attempt,8MP/CD2 and on-hit1s
control (boss0.5s). Misses do not stun. Actual scheduled enemy actions are
interrupted, rather than merely displaying a marker. All three preserve their
existing unlocks, prerequisites, rank caps, costs and cooldowns. Current/next/MAX
descriptions in both locales show actual behavior; Concentrate uses the blue
positive combat chip and removes it with playback state.

## Causal and native proof

Native rank1/2/20 ×seeds7/19/41/97 cover actual HP/MP, one payment and immutable
deterministic replay. Concentrate's protected landed incoming attacks change
from100HP to95/89/1 at ranks1/2/20, then return to100after expiry. Rank2's89
comes from the existing IEEE-754 floor of110.00000000000001 Defense; no runtime
mitigation formula changed. Rank20 seed41 misses its attack but still grants
Defense, expiring exactly2700ms despite subsequent Stun. Hasted actions occur
at500cast/1000basic/1500cast, respecting the1s stance/cooldown.

Increasing Berserk's snapshot Attack100→1100 increases every paired landed
Arcane hit by1000, with matching hit/miss outcomes. Actual50%Arcane resistance
and10MR reduce HP loss, while10000Defense/75%Physical resistance/Physical
increases leave it unchanged. Stun covers ordinary/boss exact expiries, landed
damage ranges, missed controls and real action interruption.

Malformed and foreign Concentrate payloads, incorrect class/unlock/transitive
prerequisites, rank overflows and modified registry effects grant no authority.
Tests exercise current-recording immutability, next-wave native allocation and
no-refill carry, residual paid rank1Defense despite later rank2/priority removal,
and real save validation/import with only persistence I/O faked. HP/MP and living
active-status playback agree with recorded outcomes and ordinary runBattle.

## Validation and browser proof

Focused83tests/5files, engine7849/294, typecheck, full repository lint and
production build pass. Final full15241tests/700files/two existing skips pass:
708.22s Vitest/709.920s wrapper. The retained first stopped run is not a pass.
All1190`src/`files and761build files are frozen and hash-verified; other runtime
configuration is unchanged from the recorded base. Actual precache guard checks
all emitted JS/CSS and entry assets against755unique worker URLs.

Twelve production cases cover all three skills ×en/zh-CN ×360×640/1280×800.
Each creates and exports a real character, publicly imports a declared synthetic
L30/resource helmet/prerequisite fixture, allocates rank1→2, selects the skill,
casts through Enter, pauses/flees and saves/reopens. Twenty-four ordinary
Save-close-new-page-Continue pairs compare player/inventory/map/mercs/formation
exactly. Twelve additional actual offline fresh-page Continues preserve the same
five domains with network disabled. Sixty five-size geometry checks pass, with
no horizontal overflow and the allocation control at least44px. Thirty-six
corrected screenshots are retained; five are individually inspected, including
both mobile current/next panels, Chinese Stun wrapping, the Chinese Concentrate
cast log and desktop Berserk details. Corrected cases have no page exceptions
or console warnings/errors. This does not establish full accessibility or
performance/PWA acceptance.

## Failures retained honestly

The original causal run has six expected REDs (three Concentrate, three Berserk)
and two passing Stun controls. Twenty-four bilingual presentation REDs precede
the prose repair; two positive-chip REDs precede its classification fix.
The first mitigation fixture wrongly expected ratio-based armor; inspection
showed existing flat subtraction, so the fixture was corrected without changing
runtime mitigation. An added haste fixture copied Frenzy's faster timing; the
Concentrate fixture was corrected to its ordinary500ms cadence. Original logs
remain. Six first-lint findings were fixed without suppressions or weakened
assertions. No new test skips were added.

The first full run was deliberately stopped after the focused haste failure;
exit143is not a pass. The corrected full run uses the frozen final inputs.
The first browser attempt timed out on fresh-page navigation because the helper
did not drain Python request logs during hundreds of service-worker cache
requests. The scratch server now suppresses request logs and runs with`exec`
under the helper's lifecycle; no game runtime was changed for that timeout.
Its terminal failure/timeout report and trace/network events are retained.
The original trace's duplicate captured resource binaries are omitted, with its
original hash/member count recorded; the retained extraction is not a complete
interactive Playwright trace. An already-exited old server needed no signal.

Large application-chunk and generated-art-manifest cache warnings remain open.
The excluded art manifest does not invalidate required application caching, but
this batch does not close broad performance or final PWA acceptance.

## Next defect and scope limits

[BUG221](../../../production/bugs/BUG-221-battle-cry-missing-debuff.md) preserves
twelve actual native cases: the paid Battle Cry marker provides no observed
Attack/Defense reduction. Its deliberate terminal assertion is a failure, not
credit or repair. A separate preliminary probe covers48Bash/Whirlwind/Leap
Attack/War Cry cases; it does not grant those skills functional acceptance.

Only root author security/plan/code review is supplied. Synthetic levels,
equipment, fixed Date.now and held actors establish mechanics, not earned builds,
campaign pace or balance. The genuine save decompressed hash stays
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared.
C0/C1 retain their original narrow exits. C2–C4/fullG0–G7, all213skills/two earned
builds per class,30–50-hour pacing, economy/endgame and complete privatev1 remain
unfinished. Umbrella goal/worktree/claim stay active; no remote action.

## Retention and cleanup

The [packet](fixtures/barbarian-attack-defense/packet.json) records final
terminal receipts and a byte-verified raw archive. All1190committed source blobs
match the frozen inputs; build hashes remain exact.
[Author review](fixtures/barbarian-attack-defense/author-review.json),
[browser audit](fixtures/barbarian-attack-defense/browser-audit.json),
[save audit](fixtures/barbarian-attack-defense/save-pairs-audit.json) and
[freeze audit](fixtures/barbarian-attack-defense/freeze-audit.json) are retained.
Inventory117bounded-functional/94unverified/one engine-only/one review-needed;
Barbarian19/30. All213IDs/order and210other rows remain byte-exact.
The raw archive retains214members, with every member hash verified.
[Committed-source audit](fixtures/barbarian-attack-defense/source-delivered.json)
and [cleanup](fixtures/barbarian-attack-defense/cleanup.json) record exact scope.
Cleanup removed976hash-verified task files, including761build files and the
disposable original trace-resource ZIP. All16recorded PIDs are absent, port4503is
closed, scratch is absent and remaining[]/failures[]. Shared caches, source,
evidence, genuine save and the umbrella worktree/claim remain.
