# D04 — Blade Fury's Physical cone

2026-10-25. Author implementation contract for
[BUG209](../../../production/bugs/BUG-209-blade-fury-line-instead-of-cone.md).
Root sole writer; independent design/QA and earned balance remain open.

The design table and both locales promise a cone hitting multiple enemies.
The actual JSON instead selects line-3. Reuse the existing provisional cone-2
geometry: one apex cell, then three adjacent cells in the next formation row.
This is an explicit numeric adaptation; the source promise specifies no grid
dimensions. Preserve the shared densest occupied-apex selection, row/column
tie order, row-major targets, clipping, overflow, duplicate occupants and
native default positions. Four cells are not a four-enemy cap.

Preserve Physical40–60/+4 additional rank,15MP once,1s cooldown,unlock18/cap20
and Blade Sentinel prerequisite. One accepted action throws the blade spread;
each selected enemy receives one independently rolled ordinary attack.
The existing multiple-hit promise refers to multiple enemies. This contract
does not invent repeated attempts per enemy, channel timing or persistent traps.
Keep ordinary miss/critical/Defense/resistance, absorption/reflection/death,
native learning authority, immutable input and exact recording replay. Do not
copy Fire Blast's Fire/Burn, Dragon Claw's critical bonus or weapon Attack scaling.
No new combat loop, dependency, saved field or version.

Extend closed schema ownership to actual Physical Blade Fury separately from
Fire Blast's required Fire/Burn identity. Keep both authored and legacy builder
registrations consistent. The pure display model exposes the shared shape for
the two actual owners. Dynamic prose must select Blade Fury by identity, while
the shared shape row describes geometry. Both locales explain damage per enemy,
one payment, placement and independent rolls at unlearned/current/next/MAX ranks.

Acceptance: first reproduce RED authored/catalog/display/native/prose cases;
then prove ranks1/2/20 ×seeds7/19/41/97 select the real cone with one payment,
actual per-target HP conservation and no invented periodic damage. Cover native
prerequisite/level/resource refusals, paid misses, defaults, duplicate occupants,
mitigation and reflection/death. Retain existing grid and Fire Blast controls.
Verify bilingual allocation/save/Continue in production at mobile/desktop,
required engine/full/type/lint/build checks, and remove exact task-owned output.
Only credit this inventory row after the evidence supports the bounded behavior;
all-class earned builds, campaign, balance and C2–C4/G0–G7 remain open.

Plan review: ready after explicitly separating Physical description routing and
schema identity from Fire Blast. Root-cause change is authored geometry through
the existing resolver. Security check: pass; local first-party gameplay only,
with no credentials, permissions, network/CI change or remote action. These are
author reviews, not independent approval or earned-play acceptance.
