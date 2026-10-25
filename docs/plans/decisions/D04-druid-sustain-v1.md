# D04 — Feral Rage and Hunger hit recovery

Local implementation contract for reproduced BUG193. Root remains sole writer;
independent design/QA and earned balance remain open. This repair does not
change the full private-v1 objective or credit either skill before verification.

## Explicit v1 reconciliation

Feral Rage's vague life increase means immediate life recovery, not maximum-life
capacity. Its speed means attack speed, never movement. Hunger steals life from
its own direct hit. Both remain their existing single physical attacks with
unchanged authored damage/growth, mana, cooldown, unlocks, rank20 caps and full
prerequisites. Learned Werewolf remains Feral's prerequisite; neither attack
silently requires a separately paid form. Both work in human/wolf/bear form.

The missing tuning is newly authored, provisional v1 data, not an existing D2
coefficient or earned-balance claim:

| Parameter | Feral Rage | Hunger |
| --- | --- | --- |
| Direct actual-HP-loss fraction restored | 10% | 50% |
| Self attack speed per landed damaging Feral hit | +5%, additive per stack | None |
| Self speed cap / refresh duration | 5 stacks /8000ms | None |
| Enemy Bleed | 10% final hit/s, existing3s/cap1 | None |

Only existing damage growth scales with rank; these new fractions do not gain
implicit per-rank growth. Feral's secondary Bleed becomes its explicit ordinary
primary on-hit Bleed, with `statusEffect.dotPctOfDamage`; the self speed has its
own `feralRage` tuning. Hunger's inert enemy marker is removed. Both use explicit
`onHitRecovery.lifeFraction`; no global fallback or basic-hit drain is added.
Feral Bleed uses the preceding Maul reference; other new numbers are provisional.

## Settlement and timing

The ordinary attack must hit and remove positive enemy HP after all mitigation,
absorption and overkill clipping. Restore floor(actualHPRemoved*fraction), capped
at the caster's missing life. There is no minimum-one heal, extra payment,
recovery roll, mana recovery or healing from subsequent Bleed/basic/aura damage.
Existing target-death/orb and surviving-target reflection settlement runs first;
recovery uses the latest surviving caster state. Lethal reflection cannot be
reversed. Full-life casters emit no zero heal; actual positive restoration uses
the existing heal event and playback. Damage/shield splitting remains unchanged.

A qualifying Feral hit also grants one self speed stack, including at full life.
Each qualifying hit refreshes the complete8000ms interval; cap5 still refreshes.
Existing expired stacks do not count. At expiry, speed returns to its other
composed sources. Raw base stats never mutate; speed adds with paid forms and
auras before existing cadence/clamps/Chill. Existing scheduler reconciliation
preserves pending action progress at expiry. Misses, zero actual-HP removal,
unaffordable/invalid casts and later periodic damage grant no recovery or stacks.
Bleed itself retains ordinary shared on-hit/mitigation/floor/refresh semantics.

## Native lifecycle and authority

Capture fresh valid Feral allocation/configuration independently at each wave.
Only the living original player hero with current eligible Feral configuration
can obtain/use its self speed; bare markers, enemy/merc/summon roles, invalid
ranks, wrong source and malformed clock intervals grant none. Deep copies and
immutable tuning preserve original inputs and deterministic replay.

Actual speed stacks and remaining duration carry through the existing qualified
next-wave clock rebasing, without another cast/payment or a new8s grant. New
allocation, prerequisite loss, removal/reorder and class changes apply next wave;
loss of valid Feral configuration removes carried speed. Replays keep their
original captured rank/resources/statuses. Fresh runs/imports have no stacks;
Save22 retains allocations and combo only, with no transient combat field.

## Ordered proof

1. Preserve original native six-case RED at `d9f2e6a` and file BUG193 before fixes.
2. Add schema RED for missing/contradictory metadata, foreign IDs and invalid
   finite tuning. Author strict schema and typed immutable data/effect contracts.
3. Prove rank1/2/20 literal hits, actual HP recovery and Feral Bleed; first-hit
   speed onset, repeated-stack cap/refresh, exact expiry and pending-action phase.
   Verify mitigation/overkill/absorption, floor/caps, full/dead caster, misses,
   affordability/CD, reflection, no periodic/basic drain and no extra RNG roll.
4. Prove native class/unlock/full prerequisites/MAX aliases, any paid form,
   copied/rebased stacks, next-wave changes, immutable replay, positive playback
   and exact Save22/import behavior. No genuine campaign action.
5. Explain actual current/next/MAX/unlearned hit/recovery/speed/Bleed in both
   locales. Production en/zh desktop/mobile public allocation/configuration,
   actual heal and positive stack playback, exact five-domain Save-close-Continue
   and five-size geometry are required before bounded functional credit.
6. Engine/full tests, typecheck/lint, clean explicit `VITE_E2E=false` build and
   bridge scan. Freeze source/build/Git/genuine through full checks, verify actual
   committed HEAD blobs, retain original failures and clean exact owned artifacts.
   `validate:data` is absent; actual schema/data tests supply validation.

Security check: pass. First-party game-data/runtime/UI repair with no credentials,
permissions, CI, dependency, network/export or agent-workflow change. Plan review:
ready after requiring actual-HP overkill clipping, post-reflection survival,
explicit Feral Bleed, finite residual wave carry and native next-wave authority.
These are author self-reviews, not independent acceptance. C2-C4/fullG0-G7,
earned all-class builds/pacing/economy/endgame and complete mobile/a11y/PWA/
performance remain open. No push, PR, merge, deployment or campaign action.
