# D11 H1 — Recover the Horadric Cube from an authored objective source

Accepted2026-10-23; GD-DESIGN-REVIEW APPROVE, TD-ARCH-REVIEW APPROVE;
producer vertical-slice plan READY/security PASS. Base `ad65952`.

The compact29-area map places the Cube coffer in canonical
`areas/act2-dry-hills`, target `objects/horadric_cube_chest`, Horadric Staff
`obj-cube`. This replaces its nonexistent Halls of the Dead reference. No new
area, clear, level, Radament or access prerequisite is introduced.

Only explicit Recover while ready, with a hero, act access, the exact live
source location and the tracked/unclaimed inProgress quest may issue
`quest/horadric_cube`. Respect own strictly true preceding flags. Travel,
render, import and locale changes grant nothing. The source identity is exactly
`quests/act2-horadric-staff#objective:obj-cube`; the receipt exactly
`{itemId:"quest/horadric_cube",state:"owned"}`. It is a retained tool, independent
of gear/capacity/instance IDs, without Read, consume, equip, transfer or discard.

The closed item-definition contract gains an explicit objective/tool branch;
the existing reward/Read branch and Book of Skill identity/effect stay intact.
Validate exact fetch item, target and canonical area/act against quest data.
Deduplicate by complete source, allowing distinct objectives of one quest.
Keep quest loading independent of item-definition loading.

Recover joins Claim/Read's synchronous transaction lock and existing wave/
restore/receipt guards. Validate the prospective ledger/progress pair before
publication. Write owned Cube plus only obj-cube=true, preserving later flags
and inProgress; no rewards, claim, clear or unlock. Restore both participating
writes after synchronous failure, even mutate-then-throw, holding the lock
through every restoration attempt. Restoration failures throw explicitly.
This is neither observer-wide nor crash atomicity.

A legacy own obj-cube=true with no receipt remains valid. Explicit canonical
Recover may issue the missing tool while tracked/unclaimed; owned receipts
deduplicate. No flag-derived import backfill. A receipt requires its own true
objective; the converse does not hold.

Version13 widens the closed save source domain. Validate frozen v12 reward-only
semantics before pure12→13 migration; preserve ledger, progress, points and all
unrelated state exactly. Do not change Dexie's database schema. Preserve both
owned and consumed Book receipts. Reject a consumed Cube.

Replace Horadric Staff's erroneous end-of-quest string Cube reward with this
objective acquisition; retain6000XP. Inventory shows localized tool ownership;
Map offers localized explicit Recover and durable recovered feedback.

Implementation increments: definitions/data; v13 codec; shared transaction;
Map Recover; inert Inventory tool. Relevant causal REDs precede each behavioral
increment, then final combined unit/type/lint/build and both-locale browser
Save-close-Continue/import proof, including full gear capacity and legacy repair.

This H1 decision does not fix or choose shaft/amulet/altar placement, recipe or
staff consumption/output, orifice/Duriel objectives/rewards, unsupported unlocks,
Tainted Sun resistance rewards or ActIII gate policy. They remain required P14
work; Cube recovery alone cannot complete the quest, C2 or the umbrella goal.
