# BUG-571 — Duplicate Javelin farm preparation exhausts evidence budget

- Severity: Medium; automated campaign preparation/evidence, not combat failure.
- Status: Duplicate preparation fixed and measured; interrupted Act V resumption remains open.
- Owner: campaign training/admission preparation, root sole writer.
- Source authority17; production/data unchanged.

## Reproduction and measurements

The exact944 Act V continuation earns52 and stops at next ordinal1195 when the
190MiB journal limit refuses another gear diagnostic. All251 admissions/1506
waves are victories, all earned XP/items and13 quest actions remain, and all
completed audits pass. The unfinished55 stage retains249 farms and
26,868,865.951combat-ms; resumption must conserve its original600/43,200,000
allowance and every prior failure/settlement. Do not raise or reset its bounds.

The shared training helper equips after every farm, and the Javelin native
admission path equips again before the next farm. No combat or reward occurs
between these adjacent preparations. The native entry also owns level/skill
growth and capacity handling. Three isolated preparation samples from verified
Act IV save944 cost625.6/557.4/545.9ms, including232.2/204.4/214.4ms of recorder
work. Each writes21 rows/154627 compressed bytes/2863406 raw bytes and produces
the same native successor hash. No combat, reward or admission was added.

Expected: entry-owned gear preparation runs before every actual admission;
training need not perform a redundant after-attempt gear selection. Final
target-earned preparation still runs before returning to the route. Generic
callers without entry preparation retain their existing callback behavior.

## Planned correction

Add an explicit optional `gearPreparedOnEntry` mode to Javelin training, default
false. In that mode omit only the redundant after-attempt gear callback. Wire
the maintained native runner's Javelin training to true. Later external resume
drivers opt in after verifying their admission path owns native grow/equip.
Keep the final equip, native allocation, actual owned-item selection, bounds,
loss retention, capacity refusals, recorder failure and source freeze semantics.

Verify constructed native gear/point progression at successive admission
boundaries matches the legacy policy, the new owned upgrade is equipped before
the next admission, final earned preparation is retained, and diagnostic volume
falls. Profile the same preparation work before/after without combat. No earlier
act/build or broad test replay. Resume the actual interrupted Act V separately,
using authenticated partial quest and training history rather than new Starts
or replenished training budgets.

Plan review: ready; explicit ownership preserves existing callers and avoids
stateful caches or changing game formulas, loot, equipment, combat or log codec.
Security check: pass; local helper/runner changes only, no network, dependency,
credential, permission, CI or publication action.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Native Act V result/journal and `p15-javelin-preparation-profile-v1` contain the
terminal failure, earned successor, CPU profile and bounded sample receipts.

## Verification and outcome

The explicit default-false entry-owned mode is implemented; the maintained
Javelin admission path opts in. Existing callers retain the old behavior and
the final target-earned equip remains. A native constructed progression case
fails before (identical diagnostic volume); all20 affected checks pass after,
including matching every entry/final state and using a newly acquired upgrade
before the next entry. Scoped strict types and explicit lint pass. A style-only
assertion cleanup is checked again by the single affected case/types/lint.

Three paired no-combat samples from verified save944 retain exactly the same
native save. Median adjacent preparation time falls1060.086→525.114ms (50.47%),
compressed bytes309254→154727 (49.97%), rows42→22. These are preparation samples,
not an end-to-end or population claim. Authority18 binds the maintained helper/
runner/test changes; all2091 original production inputs remain unchanged.

The level52/ordinal1195 native successor is not replayed. A further partial
Act V route and training continuation must authenticate its58 retained actions,
249 completed farms and26,868,865.951 training combat-ms. Only351 farm admissions
and16,331,134.049 combat-ms remain. Journal capacity, losses and original attempt
history must not be reset or misreported. No final balance acceptance is claimed.
