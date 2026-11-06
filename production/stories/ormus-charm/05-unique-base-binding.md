# ORMU-05 — Bind current uniques and freeze historical packages

Status: implemented; focused acceptance approved; coherent checks pending. Owner: root. Producer approved split of the unique-binding
card after independent review found historical live-catalog activation.
Depends on ORMU-01–04; approved Ormus design and ADR-014.

## Acceptance criteria and QA

Current equipment packages and requirements resolve a unique only when its base
matches the concrete item. Unknown/mismatched IDs and payloads survive inert.
Existing correctly bound uniques retain their effects. Historical canonical and
pre-socket aggregators retain by-ID behavior using literal pre-charm definitions;
a future live Ormus definition cannot alter migration17/19 recomposition.

Causal RED injects the future definition on an existing sword and forces a real
validated18→19 quarantine recomposition. Preserve exact ownership, unknown string,
real affixes, low resources and input. Preserve known historical mismatches.

## Source scope

- `src/engine/progression/equipment-mods.ts`
- `src/data/loaders/loot.ts`
- `src/engine/save/frozen-v24-uniques.json` (literal copy)
- `src/engine/items/unique-base-binding.test.ts`

Presentation follows in a separate card. No live catalog/save/UI activation.
Raw receipts retained in root-owned `d2-ormus-urhb34ei`; no CI/commit/remote work.

## Focused outcome

Independent design_contracts review: APPROVE. Focused controls passed 26 tests across 4 files. Raw RED/GREEN logs remain in the root-owned Ormus packet. Full current-source checks and feature acceptance remain pending.
The first RED log used a missing socketCapacity fixture and is excluded as causal evidence; corrected RED-v2 establishes the behavioral failures.
