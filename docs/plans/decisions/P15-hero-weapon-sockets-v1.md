# P15 — Owned hero physical weapon socket preparation

2026-11-03. Type: preparation tweak; supplements P15-corpse-owned-weapon-v1.

The earned next-1597 save has an equipped three-socket RazorStitch with no
inserts and 531 Eld runes. Campaign preparation currently fills offensive merc
weapons but omits hero weapons. The existing physical-support identity needs
hero basic attacks for opening kills and singletons. This omission warrants
shared paid preparation before more combat tuning or admissions.

At an idle preparation boundary after owned gear selection, profiles with
`heroWeaponPolicy.kind = physical-offense-v1` may fill an entirely empty
mainhand once Act II is unlocked and the declared policy level is reached.
No class, area, ordinal, enemy or seed exception is allowed. Other profiles,
earlier levels, offhands, armor, mercs and partly filled weapons are preserved.
No fielded merc is required for hero preparation.

For each socket, consider only owned runes/gems affordable at the native insert
price. Project the complete loadout through canonical hero equipment/quest
composition and the native basic-attack cadence/critical-overflow formula from
P15-corpse-owned-weapon-v1. Select the strictly improving non-runeword result
with highest expected unmitigated physical basic damage per second; ties use
ascending material ID. Re-evaluate after each paid insert. This score is a
preparation heuristic, not evidence of encounter DPS or victory.

Reuse the native transfer/preview/execute/re-equip path and its 24-insert bound.
Record every committed cost before diagnostic assertions/recording. Re-equip
in finally on recorder failure. A full backpack refuses without mutation;
busy, unhydrated or save-replacement states reject before changes. Preserve
item identity and payloads, unrelated saves/points/currency and current resource
pools subject only to native maximum clamps. This explicitly adds owned socket
spending to the previous weapon-preparation decision; no combat formula,
material value, skill, drop, equipment eligibility or save schema changes.

Acceptance: native three-insert payment/stat/custody and idempotence; role,
level and Act II opt-out; no-merc operation; partial contents; shortage and
non-improving materials/cadence cap; busy/full-bag and recorder-failure safety.
Run the affected socket regressions, scoped strict types and explicit lint.
Do not replay earlier acts or unrelated tests.

Then freeze current production/campaign sources and restore only the D07
next-1597 export (SHA256
`764a1aac8003431c1c8c1e2131a07a1d018df9ea4ba43ae46773848d590a0122`).
The actual source backpack has 145 items and stash 313. First move 46 existing
backpack items, ascending item ID, into free stash space using native
`moveToStash`, leaving 99 items and room to unequip. Retain all payloads; do not
salvage or discard. Refusal stops preparation. Snapshot each native transfer.
Run at most two preparation calls (second is a no-op check), 52 total native
transfers/inserts, 30,000 driver wall ms / 45,000 launcher wall ms, 32 MiB
result and 10,000 independent-reader wall ms. Capture each committed insertion
and the complete actual successor even if diagnostics fail. Independently
reconcile every material, item payload/custody, ordinal, resource/stat and save
domain. No combat, reward, clock advancement, quest, reset or controller reuse.
Any subsequent admission requires its own prospective bounded protocol from
that successor; earlier experiment families remain closed.

Plan review: ready; fixes the shared preparation omission rather than fitting
an encounter. Security check: pass for authorized local first-party changes;
no network, dependencies, credentials, permissions or publication. BUG611 stays
open until real sustained damage/progression evidence supports closure. Root
retains human2 and the evidence packet through umbrella review and owns cleanup.
