# D02/D07 — Act I earned entry and chapter-boss power

Status: GD-DESIGN-REVIEW APPROVE; TD/producer plan READY, security PASS,
2026-10-22. Numeric boss tuning is accepted for implementation as a provisional
target; actual whole-route victory remains unproven. This is an Act I slice
of the unchanged C0–C4, seven-class, five-act, 30–50 active-hour objective.

## Controlling choices

Keep `floor(100 * L^2.5)` level costs and current production kill XP unchanged
for this screen. A single tour's XP ceiling is insufficient evidence of bad
ARPG pacing: repeated victorious farming is part of the game. The retained
Den clear yielded 1650 XP in 97.86 combat seconds, about 60,699 XP/combat-hour;
this is one observation, not a measured campaign rate. Choose L12 as the
initial Andariel entry target and L14 as the maximum later tuning envelope.
These are design targets, not earned levels or acceptance claims.

Start from the genuine claimed L6 save, not a synthesized L12 character:
`../evidence/fixtures/p04a10-den-claimed-earned.json`, SHA256
`b022aa436d30b9102528995f6f5c2419000f682df84d18d6c18321547e2faa35`.
Its cumulative XP is 13230; exact L12 cumulative XP is 146949. No unearned
Cain/Countess/Charsi/Blood Raven quest awards enter the budget.

## Finite production-service acquisition pilot

1. Restore all six saved domains exactly in process-local production stores.
   Spend the existing Den skill point on Ice Blast. Keep the earned gear,
   fielded Inner Sight Rogue, and Frost Nova / Fire Bolt farming order.
2. Attempt at most 100 complete Den manual challenges, stopping immediately
   at L12 or the first nonvictory. Use seed 2223645302 and ordinals 41–140 in
   order, once each. No retries, seed search, partial-wave farming, idle ticker,
   direct XP grants, equipment replacement, respec, or resource refill.
3. Between completed runs, spend each earned skill point on Ice Blast. For
   each earned level, spend two stat points on Vitality and three on Energy.
   The L12 milestone point also goes to Ice Blast. Preserve every earned item
   and currency, including recoverable backpack overflow.

This labels a reconstructed production-service continuation; it does not
prove native browser acquisition or real-time idle operation. The actual
eligible active-idle path must be measured separately if selected for C1.
All encounters use the production planner, resolver, playback and exactly-once
settlement. Full challenge wins, actual XP/merc XP, legal points, item/currency
deltas, remaining resources and combat seconds must be recorded. Never count
an installed or abandoned next wave as a clear. Record failure without tuning
the harness or continuing from a defeated result.

## Boss tuning boundary

Use the existing Catacombs `chapterBoss` JSON fields for the selected final
power package. `hp` remains base HP multiplied by the unchanged global eight;
`atk`, `def`, and optional `magicResist` are final overrides. Preserve the
existing resolved L19, skills, resistances, drop table, XP, guard waves, boss
identity and all other maps. TD selected this surface instead of adding an
unneeded level API; see execution ledger. The previously accepted equipment
band through L19 remains valid. This is explicit balance tuning, not a claim
that the old ×8/+5 semantics were accidentally applied twice.

GD selects final HP1200 (base150), ATK90, DEF40 and explicit MR15. The current
package is final HP17600 (base2200), ATK150, DEF200 and derived MR54. This
reduces the first boss's flat mitigation and resource demand for the L12
entry band without changing skill formulas or global monster families. These
numbers are a proposed challenge target, not measured earned victory.

After reaching L12, attempt one full Blood Moor, Cold Plains, Burial Grounds
and Dark Wood in that order, skipping only areas already canonically cleared.
Stop at the first nonwin; retain a L14 ceiling. This covers the whole authored
Act I route rather than using an otherwise accessible Den-to-boss shortcut.
After this earned entry exists, freeze and execute one complete Catacombs
service attempt against the old power package, then one against the reviewed
new package from identical earned input. New target order: Frost Nova / Ice
Blast. No boss-only state, guard skipping, healing between waves or loot from
a failed boss finances entry. A screen success permits native continuation;
it does not accept C1, seven-class balance or final campaign pacing.

## Verification and review

Before changing runtime data, add a failing real-data planner/factory test for
the reviewed boss package. Preserve unchanged synthetic ×8 tests, all other
bosses, Catacombs guard output, loot eligibility and loss/draw/no-duplicate
settlement controls. Run focused checks, full engine/unit, types, lint and
production build at final source; avoid repeating broad checks without a
changed source or unresolved concern. Native follow-on must use genuine
earned exports and prove Andariel, equipment, quests, Save/Continue and mobile.

The previous goal turn was a status-only answer (no progress toward the
implementation). This card resumes execution; no checkpoint is accepted by
writing this document.

## Measured entry and next screen

The first frozen service pilot completed61consecutive full Den challenges,
earning133990XP and3344items, to L12/cumulative147220 in6857652combatms
(1.905hours). Blood Moor then cleared; Cold Plains W3 drew at60seconds.
The second pilot restored the exact pre-route L12 checkpoint and selected
Frost Nova2/Ice Blast8. Blood Moor cleared again; Cold Plains W3 drew with
one38HP survivor, compared with three survivors totalling996HP before.
Both stopped; neither reached Catacombs. Rewards on the drawn wave were zero.

Choose one earned-level extension within the existing L14 envelope: restore
the same L12 checkpoint; attempt at most30complete Den manual runs, consecutive
ordinals102onward, same seed, Frost Nova/Fire Bolt for acquisition. Stop at
L13 or first nonwin. Spend only the newly earned skill point on Frost Nova3;
retain Ice Blast8. Spend the earned stats2Vitality/3Energy. Then select
Frost Nova/Ice Blast and attempt the four uncleared route maps at fixed
ordinals102–105, once each, first nonwin stops. This separates additional
earned preparation from changing a seed after a loss. No gear change, refill,
respec, direct XP grant or assumed quest rewards are permitted. Preserve all
previous failures. Stop launching if earned XP crosses L14; never clip XP.

The approved L13 extension was executed once:24 full Den wins earned50740XP
and reached cumulative197960. Blood Moor cleared; Cold Plains W3 again drew
at60000ms, with one champion Zombie at68HP. Its wave awards were zero and
the run stopped. Neither additional earned level nor Nova3 demonstrates a
route solution. No more farming extension or boss launch is qualified by this
result. Next inspect the actual wave's cadence, targeting, mitigation and
resources before choosing another change. See [executed evidence](../evidence/p01-act1-earned-entry.md).
