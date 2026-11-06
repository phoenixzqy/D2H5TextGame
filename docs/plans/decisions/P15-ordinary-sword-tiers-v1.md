# P15 — Restore missing ordinary sword tiers

The locked sword ladder includes War Sword32 (20–32 damage) and Legend Sword60
(45–75), but BUG660 finds both only in treasure-goblin loot. Restore ordinary
availability using existing bases, stats, requirements, art and bilingual names.
This is separate from BUG659's restrictive campaign equipment policy.

Append34 picks across24 ordinary weapon-bearing tables. Intersect War Sword
[32,49] and Legend Sword[60,122] with the finite envelopes recorded for P15
ranged/throwing progression. Empty intersections add nothing. Each pick inherits
its table's ordinary rarity and the existing provisional weightPerFamily
(one eighth of the pre-ranged ordinary weapon weight). The independent JSON
fixture freezes exact rows and bands; no runtime coefficient is added.

Preserve every old entry and table field, including order, weights, level bounds,
picks/material pools/no-drop and all goblin/fixed reward content. No original
base, unique/set, locale, schema or save version changes. Existing eligible pick
probability w/T becomes w/(T+W); these weights remain provisional economy tuning.
No added sword appears below its equip requirement, outside its declared band,
or beyond the source ceiling. Existing Phase Blade picks remain unchanged.

Root owns content and focused tests in retained human2. Before production edits:
retain exact preimages, file BUG660, write failing availability/schema regression.
Then append only declared picks and extend the exact D08+ranged+throwing
preservation comparison with this independent sword delta. Verify native reward
materialization, equip requirement/Attack/mastery/shield custody and browser
presentation/equip/save/reload in en/zh-CN on desktop/mobile. Only affected unit,
scoped type/lint and targeted browser checks run; no broad suite or campaign.

Acceptance is content availability and native use, not earned acquisition odds,
Izual victory or formal balance. Constructed fixtures must be explicit. Preserve
BUG659 terminal export and all spent attempts; no replay, seed search, training,
free earned gifts, renewed route limits or skill/monster tuning. Required evidence
stays under the root-owned packet through umbrella review; remove exact task-owned
configs/cache after recorded processes exit. No agents/install/CI/commit/push.

Security check: pass. Local first-party JSON/test additions, no credentials,
permissions, networking, dependencies, executable data or publication.
Plan review: ready. Finite independent fixture plus exact predecessor comparison
bounds the data delta; native tests prove consumption separately from availability.
Existing art/names avoid a UI/schema expansion. The equipment-policy limitation
remains explicit, so this slice cannot be used to claim an Izual fix. Root
self-review is not final independent acceptance. Previous goal turn was status
only/no progress; this turn continues the full private-v1 objective.
