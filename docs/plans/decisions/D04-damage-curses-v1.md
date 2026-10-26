# D04 — Iron Maiden, Life Tap and Lower Resist

Prepared2026-10-26 against7883b882; provisional root-author contract for BUG246.
Native RED18failed/12passed precedes production edits. Independent design/QA,
earned builds and balance remain open. Root sole writer/reviewer; no subagents.

## Overview and fantasy

Give three paid Necromancer curses their advertised distinct consequences:
punish Physical attackers, sustain allies hitting a cursed target, and expose
resistant targets. Source copy promises these effects but supplies no numeric
potency/duration. The following constants are explicit provisional author tuning,
not recovered source authority:3000ms for each; Iron Maiden100% reflected
Physical HP loss, Life Tap25% direct HP-loss healing, Lower Resist30percentage
points off all six resistance pools. Independent and earned tuning stay open.

## Native rules and authoring

Preserve all existing all-enemy targets, cap20 and3s cooldowns. Iron Maiden
unlocks12 with Amplify Damage prerequisite,11MP minus0.25/rank (rank20rounded6).
Life Tap unlocks18 after Iron Maiden,9MP minus0.2/rank (rank20rounded5).
Lower Resist unlocks30 after Life Tap,22MP minus0.3/rank (rank20rounded16).
No hit/proc RNG or direct cast damage. Apply to all living hostile tiers with
equal potency/duration; exclude allies/dead bodies. Native authority, resources
and no-live-target guards remain unchanged. Numeric tuning belongs only to JSON;
strict identity-specific schema rejects missing/foreign/contradictory metadata.

Use copied finite paid packets on[start,expiry). Refresh replaces source,
potency and interval without stacking. Cleansing shortens once. Paid curses
survive source absence; fractional/rebased clocks retain exact finite behavior.
Bare, malformed, mismatched, nonfinite, future or expired packets confer no power.
These curses coexist with existing independently authored curses; do not invent
global exclusivity or change Attack/base stats/cadence/targeting/hit/crit RNG.
Packets are transient; learned IDs persist through save22 without migration.

## Iron Maiden

When a cursed attacker removes hostile Physical HP through a direct hit,
reflect floor(actualPhysicalHpRemoved*100/100) as one RNG-free Thorns hit from
the defender to that attacker. No proc on misses, zero HP removal, elemental
shares, existing DoT or reflection. Overkill and absorbed damage do not increase
the basis. Reflect once per settled strike, including composite hits, after
ordinary victim death/orb settlement. A lethal victim hit still qualifies;
the attacking unit must remain alive. Existing ordinary Thorns keeps its own
living-defender rule and adds only while that defender lives.

Use existing Physical resistance/Defense and personal absorption on reflected
damage. No hit/crit roll, recursive reflection or Life Tap on this reflected
settlement; outgoing Weaken/Decrepify never reduce it a second time. Lower Resist
can affect the reflected recipient's resistance through the shared projection.
100Physical HP loss with zero reflected defenses causes100reflected damage.
At50% reflected resistance and10Defense this is40; actual reflection may kill
the attacker and must use ordinary death/corpse/reward settlement exactly once.

## Life Tap

After a hostile direct strike removes HP from a cursed defender, restore
floor(actualTotalHpRemoved*25/100) to the surviving attacker, capped to missing
HP, through the existing heal event/settlement. Applies to basic attacks, skills,
mercs/summons, composite/coated hits and direct pulses/counterattacks, irrespective
of damage type. Settle deaths/orbs/reflection first; never resurrect an attacker
killed by retaliation. Killing a cursed defender still qualifies. No restoration
from overkill, absorbed damage, misses, existing DoT, reflection or friendly fire.
No minimum1healing, extra RNG or modification of existing skill recovery.100HP
removed restores25;3HP removed restores0. Capture pre-hit curse eligibility so
victim death cannot erase the already-qualified trigger.

## Lower Resist

Subtract30percentage points from the defender's Physical, Fire, Cold, Lightning,
Arcane and Poison resistance before existing act penalty/clamps and flat
mitigation. Thorns uses Physical resistance. This explicit all-resistance rule
matches current copy; do not silently import a different D2 element whitelist.
Add with Amplify's Physical reduction, Cold Mastery and ambient resistance
projections without mutating base stats.100raw against50% resistance/10flat
mitigation changes40to70. Existing periodic rates are not retuned; newly created
hit-derived DoT snapshots the actual resulting hit with its existing floor.

## Acceptance and implementation order

1. Retain native18RED/12controls and file BUG246 before production edits.
2. Schema/JSON/types -> shared three-curse definition and paid packet -> adapter/
   status -> existing direct damage/resistance/reflection/healing settlement.
3. Strict schema/packet boundaries, copied tuning, exact/fractional/rebased expiry,
   refresh/Cleansing/source absence, recipient tiers, resistance combinations,
   mitigation/shields, overkill/lethal victims, dead attacker/no resurrection,
   DoT/reflection isolation, composite once-only settlement, native payment/RNG/
   purity/replay, and current-recording/next-wave/import must be meaningful tests.
4. Pure unlearned/current/next/MAX previews and truthful en/zh descriptions;
   production desktop/mobile public casts/chips/Save/online+SW offline Continue.
5. Focused/engine/full/types/lint, actual loader/schema checks (validate:data is
   absent), official build/bridge/precache/browser; freeze tested source/build,
   compare actual committed blobs, then credit only the three verified rows.
   Retain raw evidence and verify exact task cleanup; preserve umbrella claim.

## Author plan/security review

Plan review:ready after explicitly defining lethal-victim reflection, pre-hit
Life Tap eligibility, post-retaliation survival, actual HP-loss bases and
all-resistance scope. Shared packet validation serves exactly these three
related damage curses; no generic curse framework or unrelated refactor.
Security check:pass; first-party local work, strict finite boundaries and native
authority preserved. No secrets, new dependencies, network/data export or CI
changes. Root-only constraint overrides delegation workflows. Complete independent
acceptance,C2-C4/fullG0-G7/earned builds/pacing/economy/endgame/privatev1 stay open.
