# P15 — Corpse-and-curses staged physical-support growth

2026-11-03. Type: progression-policy correction. Implementation candidate;
first-clear, singleton, campaign, population and pacing acceptance remain open.

## Problem and choice

The intended identity explicitly uses early Teeth, later real-corpse explosions,
and curses plus hero/mercenary physical attacks for opening kills and bosses.
Its old fixed2Vitality/3Energy stat policy never transitions to that later role.
Energy changes mana capacity, not spell damage. At71 it has235Energy/25Dexterity;
the retained failures include substantial unspent mana. Strength and Dexterity
provide the same `max(Str,Dex)` attack contribution, while Dexterity also improves
attack speed and physical dodge. Strength alone is therefore the wrong repair.

Preserve the original allocation through23. At the existing Decrepify unlock24,
change each newly allocated five-point block to2Vitality/3Dexterity. The threshold
is the authored late-curse unlock, not a retained encounter, seed or observed
win. Keep the two identities per class, actual earned ranks, mercenary, equipment
and every skill/cost/damage/mitigation rule. This is a declared preparation
policy, not an automatic player build or a new spell coefficient.

## Exact allocation and payment

Only the canonical corpse-and-curses growth JSON gains an optional stat stage.
Its inherited opt-in decoy preparation receives the same stat stage. Existing
profiles without stages retain their original single native batch allocation.
For a staged profile, count already invested points above the JSON class
starting stats. Number each new five-point block from that count: its effective
level is `min(heroLevel, 2 + floor(investedPoints/5) + blockIndex)`. Use the last
authored stage eligible at that level, or the original distribution. Sum all
blocks and publish once with native `allocateStatPoints`; hold any remainder.
This keeps batched earned levels consistent with sequential preparation. Extra
quest-funded blocks use the current stage once the hero level is reached.
Existing manual or historical investments are preserved, not reclassified.

At71,350actual allocated points become144Dexterity/140Vitality/66Energy:
core15Strength/169Dexterity/155Vitality/91Energy. Early23remains exactly
15/25/59/91;24becomes15/28/61/91. No point, rank or level is granted. A historical
Energy character remains unchanged until an explicit real town stat reset is
paid. Demonstrate that conversion only on a disposable earned-save restoration:
consume one actual remaining stat-reset use through `prepareTownRespec` and
`executeTownRespec`, then reallocate the actual refunded350points. Wishstones
remain unchanged while a free entitlement is available; skill-reset uses remain
unchanged. Native derived-stat recomputation can clamp current life/mana when
maxima shrink; subsequent investment never heals either resource.

## Acceptance and scope

- Four behavioral RED cases precede the policy change. Sequential1–71, batched
  earned levels, actual paid refund/reallocation, idempotence and unchanged other
  identities must pass with complete unrelated-domain conservation.
- Reuse existing passing skill/combat/browser evidence. Select only directly
  affected allocation/profile cases, scoped strict types and explicit lint.
- One zero-combat earned level71 reset must independently reconcile the whole
  save, actual payment,350points, recomputed core/derived stats, resource clamps,
  unchanged equipment/currency/quests/ordinals and idempotence.
- No battle, retry, training, old seed/wave, controller restart or closed-family
  allowance renewal. No native route or formal balance cell is accepted here.

Plan review: ready. The level threshold follows the existing identity/unlock;
chronological point blocks avoid a batch-only current-level allocation bug.
Existing investment is never rewritten by ordinary growth; conversion uses
native town payment. Mana capacity is deliberately traded for physical support;
actual sustain, survival, boss/pack performance and fairness remain unproven.
Security check: pass for authorized local profile, test and first-party paid
state preparation; no credential, install, network, CI, permissions or publication.
Root retains human2 and required evidence through umbrella review and owns
eventual cleanup/release.


## Delivery result

The campaign implementation is verified: four behavioral RED cases, six focused
new/profile GREEN cases, two corrected existing growth checks, scoped strict
types and explicit lint. The [earned preparation report](../../balance/2026-11-03-corpse-hybrid-stat-growth.md)
records exactly one Malah stat reset, 350 refunded/reallocated points and actual
stat allowances 3 to 2; no skill-reset use or currency is spent. The whole-save
reader independently reconstructs reset payment and derived arithmetic using
native equipment aggregation as a declared input. Attack 222 to 294, attack
speed 145 to 289, physical dodge 25% to 53.8%, mana capacity 806 to 616; current
Life/mana remain 130/87 and all unrelated state stays exact. Idempotence passes.

Retain the original wrong-field driver failure and receipt-only currency-key
reader failure. A zero-reset/zero-allocation projection and corrected read-only
reader complete verification within the original combined wall ceilings. Actual
reset count remains one; no combat/admission/training, controller restart or
closed-family allowance renewal. Preparation delivery does not close BUG-611
or establish earned progression/population/pacing acceptance. Act V remains
13/19 and formal balance 0/210 accepted; private v1 remains active.
