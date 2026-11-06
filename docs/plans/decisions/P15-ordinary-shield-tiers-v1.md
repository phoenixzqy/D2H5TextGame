# P15 — Ordinary usable shield tiers v1

2026-11-05. Small content addition under G3/G4 and the existing item/drop GDDs;
no new mechanic. Root implements solo in the existing claimed human2 worktree.

## Problem and policy

Shields require levels 1/8/25/35/50/60. Act III trash offers Aegis only through
enemy40 and Monarch from38, although Monarch requires hero50. Dragon Shield
requires35 but its only existing reference is a forced unique goblin pick;
ordinary Dragon bases cannot currently be acquired for socket/runeword choices.
Other existing shield sources omit current usable tiers at finite level bands.

Freeze `tests/fixtures/shield-progression-v1.json` before the content change.
Cover the 18 existing ordinary shield-bearing tables, using established finite
equipment-source envelopes and any already-authored lower shield minimum.
Append only 29 missing bands in 14 tables; four source controls need no addition.
Use the highest existing shield tier whose base requirement does not exceed the
resolved enemy level. This defines source coverage, not hero entry requirements:
an underlevel hero can still receive ineligible equipment.

Preserve all original rows, ordering, weights, rarity, bands and table fields,
including earlier tiers, above-level drops and the unique goblin Dragon. Do not
add shields to specialized sources that did not already offer ordinary shields.
Each new row uses the source's established provisional supplementary-family
weight from the earlier weapon policies; omit rarity so ordinary MF can select
normal/magic/rare content. No base stat, requirement, socket budget, engine,
UI/locale, schema or save-format change. Existing regular bases/strings/art apply.

## Verification and economy limits

Before edits, execute causal source-coverage failures. After edits, check all
declared source levels, exact appended suffixes, positive inclusive native
selection at both band edges and unchanged strict schema. Bind the complete
predecessor with a Node JSON.stringify SHA256 and separately reconstruct its
exact text. Compose the declared delta with the earlier claw, MF and D08
predecessors without changing their expected hashes or skipping assertions.

Native real-pick rewards/equip checks cover five affected base tiers, refusal
below requirement without mutation, acceptance at requirement, greater Defense
and weapon/displaced-shield custody. One declared normal three-socket Dragon
fixture must support paid live Ral/Ort/Tal insertion, exact material spending,
replay safety, Ancient's Pledge identity and equipped defensive effects. These
are constructed fixtures, not earned acquisition or measured rarity odds.

Run only the 48 new content cases, six native integration cases, three affected
predecessor cases, scoped strict types and explicit lint paths. No full suites,
campaign/retry/farming/pilot reruns, seed search, browser launch or renewed spent
budget. Existing UI/base behavior is unchanged.

Added weights change old relative selection odds from w/T to w/(T+W); no loot
economy/pacing acceptance is implied. Act III attained-power, broader acquisition,
crafting affordability, remaining gameplay/content and all full-v1 gates remain.
Plan self-review: ready, with original source specialization and historical
composition explicitly preserved. Security check: pass for trusted local JSON
and checks; no dependency, credential, network, CI or permission change.
