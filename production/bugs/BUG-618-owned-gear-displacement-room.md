# BUG-618 — Reserve room for equipment displaced by owned upgrades

Status: fixed; native preparation independently verified. Severity: Medium. Found: 2026-11-03. Owner: root / campaign QA.
Build: feat/playable-foundations, b5a0898806bfba369a2d84a1b6c41d0bbb057fce
with accumulated changes. Environment: WSL/Linux native campaign preparation;
browser/viewport/locale/seed do not apply (no combat or RNG).

## Reproduction

1. Restore the earned next-1595 export with a 119-item backpack, 293-item stash,
   an equipped one-handed mainhand and occupied offhand.
2. Select the eligible stronger owned two-handed mainhand through
   `equipCampaignGear` / `retrieveCampaignGear(..., 'stash-room-v1')`.
3. Observe 20 successful staging transfers, successful retrieval into the
   now-100-item backpack, then native equip refusal `backpack_full`.

Expected: preparation reserves room for both displaced items, using native
transfers only; if insufficient total space exists, retain a safe fallback.
Actual: retrieval reserves only its own slot. Removing the incoming item and
returning both equipped items would leave 101 items. The selector tries further
candidates and repeats avoidable transfers/refusals. The bounded earned driver
stops at its 33rd attempted native action before any successful equip.

Evidence: retained packet `d2-counted-source-z3jj3xa1`,
`p15-corpse-owned-weapon-v1-earned-plan.json`, `.json`, `-process.json`, and
`.native-export.json`. There are 23 completed staging transfers, four completed
retrievals, six failed equips; the partial successor has 100 backpack / 312 stash
items, original equipment/resources, and unchanged ordinal 1595. All actual
transfers must be retained and independently reconstructed before continuation.

## Root fix and acceptance

The campaign retrieval helper owns staging preflight. Pass the extra net room
required by the native target-slot and mutex displacement plan. Exclude the
selected item and Iron Golem reservation from staging. Account for the stash
slot freed by successful retrieval: stage retrieval room first, retrieve, then
stage any remaining displacement room. Preflight the complete transfer sequence
before the first mutation. Already-owned backpack items also need displacement
room when replacing two equipped items. Preserve default retrieval behavior,
native capacities, whole-save conservation and explicit capacity fallback.

Add constructed full/overfull backpack and full/near-full stash regressions;
verify failing-before/passing-after only for these new cases, then affected
helper/equipment checks and scoped types/lint. Resume preparation from the actual
partial successor, never discard its completed transfers or restart combat.
No production equip rule, capacity, economic grant, salvage or combat changes.
Plan review: ready. Security check: pass for authorized local campaign tooling.

## Verified correction — 2026-11-03

The shared retrieval preflight now reserves the net target/mutex displacement
room, including candidates already in the backpack. Stash retrieval frees a
slot before any additional staging that requires it. No capacity/equip rule or
item acquisition changes. Four new capacity cases fail before the correction.
Afterward, 30 affected cases pass; the four remaining failures were incorrect
final-count expectations: hero equip leaves 100, then the existing companion
policy equips both displaced pieces and leaves 98. Corrected boundary and
companion-custody assertions all pass. Scoped strict types and explicit lint pass;
two lint-only object-truthiness expressions were made explicitly boolean.

The corrected-source `bug618-owned-weapon-prepared-v1` resumes only the actual
independently reconstructed partial successor. Two stages, one retrieval and
one equip succeed. All 442 owned item payloads and every intermediate whole save
reconcile independently; current life/mana remain 130/87, next ordinal remains
1595, and a second preparation produces the exact same export. Final bag/stash
counts: 100/313. Source authority: 2,148 files; complete campaign manifest: 125.
No combat, clock advancement, quest, reset, grant, salvage or controller restart.
Original failed preparation and its full transfer ledger remain retained.

Evidence: retained root packet, `bug618-displacement-{red,green,fixtures,types,
lint,lint-correction}` receipts and `bug618-owned-weapon-prepared-v1` plan,
result, process, native export and passing independent readback. Native export
SHA256 `afddc25a157d83bfdaf98310d9643110940d11d1b526991f651cb300691859c8`.
Root retains this evidence and the claimed worktree through umbrella review and
owns eventual cleanup/release. BUG-611 encounter viability remains separate.
