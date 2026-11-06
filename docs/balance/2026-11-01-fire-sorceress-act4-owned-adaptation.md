# Fire Sorceress Act IV: free boss order and owned equipment

Status: bounded owned adaptation qualified; independent acceptance open.
Keep the original group policy, cast FireBall20 alone for Diablo, and equip an
already-owned sword and boots for the boss. Both frozen full-area controls now
win. No production code/data, authoritative save, points/resets, materials,
currency, mercenary ownership or farming changes.

## Retained failures and free order

Source `p15-sorceress-fire-act4-river-continuation-v1.json` is actual48/XP956149.
FireBall20/Meteor13/FireMastery20 remain unchanged, with zero free points and
skill resets. Both original seeds1/8 clear six prefix waves and draw at Diablo,
leaving21084/16460 of44800HP. Heroes survive; mana does not explain the shortfall.

Original AS125 gives1500ms turns. Each boss wave casts27FireBall/13Meteor.
Diablo has75%Fire resistance,460Defense and180flatMR. Most landed Meteor hits
are19–41; retained FireBall normals start at603. Normal FireBall projection is
603–616, critical2400–2436, with the original15%crit/2.69multiplier. Mixed weak/
strong Burn potency is retained under the existing status contract.

Freeze FireBall-only for next bosswave6 by changing the native store order
before settling recorded wave5. Preserve original Meteor-first groups and all
six prefix waves. Two complete free-order controls/14waves take6.663wall seconds:

| Seed | Result | FireBall casts | Boss minimum MP |
| --- | --- | ---: | ---: |
|1|60s draw,11601HP remaining|40|716|
|8|whole-area victory, Diablo55.500s|37|746|

Recurring FireBall gaps are1500ms. Both improve, but the free order alone does
not qualify both cases. Keep that draw and both original failures.

## Owned equipment comparison and native controls

Pure native projections examine121owned/102eligible items, including current
gear, and14partial eligible set families; no complete eligible set is owned.
Source-owned sword `it-59p0r-9pr` and GoblinToe boots `it-3mr56-paf` supply more
critical hits without changing percentage resistances. The projected sword+
ring alternative remains unexecuted; it also loses27Poison resistance.

The current sword carries Diamond effects. Replacing it removes12flatMR.
The complete sword+boots native loadout has40%crit/3.02multiplier,896HP/780MP,
535Defense/0flatMR, versus15%/2.69,888HP/766MP,537Defense/12flatMR. AS125 and
all percentage resistances stay unchanged. These are explicit offensive and
defensive tradeoffs; there is no healing when maximum resources increase.

Apply the two native inventory swaps before settling recorded wave5 and select
FireBall-only for Diablo. Both seven-wave areas clear:

| Seed | Diablo | Final hero life | Boss minimum MP | FireBall casts |
| --- | ---: | ---: | ---: | ---: |
|1|50.208s|552|716|33|
|8|37.500s|256|754|25|

Sample victorious median43.854s; seed1 exceeds50s. Two completed areas/14waves
take6.612wall seconds. Exact original six-wave combat/reward semantics, boss
enemy inputs and life/mana/cooldown entry carry are preserved. Gear increases
maximum pools without filling them.

## Diagnostic corrections and verification

The first gear driver stopped before Diablo on an exact floating-point40%
comparison. Its successor then stopped on an incorrect assumption that the
old sword's12flatMR would survive replacement. Both incomplete attempts retain
their methods/logs and five settled-wave progress records; no full trial or
authoritative save was committed. A reader launched against the second missing
report also failed and remains retained. These were diagnostic errors, not
game defects. Do not claim that those partial prefixes were reused.

Driver `p15-fire-sorceress-act4-owned-v3.ts` checks the complete candidate using
native equipped-stat projection before any battle, then requires exact native
post-equip agreement. Final scoped strict types/focused lint pass. Free-order
reader1 and owned-reader2 separately pass all four completed trials/28waves:
source pins, canonical payload custody/native transfer receipts, zero spend,
unchanged ranks/points/resets/mercs, exact prefix semantics, boss stat deltas,
native carry, events/outcomes/streams/rewards. Mutated owned affixes and boss
mana are rejected. Diagnostic income/state is discarded. Reuse unchanged
210BUG552/112BUG553 checks; no broad suite or earlier-act campaign replay.

No population/recommended-power/within-three/holdout/independent acceptance
follows. Do not extend automatically or rerun these completed cases. Next
FireSorceressV uses retained ordinal1101 sources: seed1 reaches Baal at89/972HP
and draws; seed8 dies at prefixwave4 after184HP entry. Inspect prefix survival,
actual enemy damage/status, mercenary carry and owned defense before applying
an offensive boss swap or prescribing acquisition.

Historical14routes, recipe61/75/68/6,68/70decoded and accepted balance0 remain.
Full213skills/builds/210roles/22areas, holdouts/economy/fairness/30–50active-hour
pacing and final integration/review/owner gates stay open. Browser works; CI
excluded; no pending answer/external blocker. Goal and live human2 claim remain.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Decision `p15-fire-sorceress-act4-owned-decision-v1.json`; closure
`p15-fire-sorceress-act4-owned-artifacts-v1.json`. Root retains required raw
evidence until umbrella consumers finish. Two temporary configs archived/removed,
all five task Vite caches absent, owned processes terminal. No installs, agents,
commits, pushes or publication.
