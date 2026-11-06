# ORMU-03 — Freeze literal24 quest and campaign authority

Status: implemented; independent review APPROVE; coherent type/lint checks pending. Type: Logic. Owner: root; design_contracts independently reviews.
Depends on ORMU-01/02. Approved [design](../../../docs/design/ormus-charm.md) and
[ADR-014](../../../docs/decisions/ADR-014-first-charm-ownership.md); producer ready.

## Acceptance criteria and QA

- Capture current46 quests,21 quest items,2 actions,7 victory identities, finite
  Act V/Act I/Council domains, services,29 areas,20 auras, titles, unlock and bound.
  Compare capture to actual authorities before changing any live quest content.
- Literal24 selected profiles are normal/nightmare/hell; bound360360, exactly
  three ordinal namespaces. Both replay profiles use the captured29-area set.
- Deeply freeze a JSON-only wrapper; export validateFrozenV24Save with dedicated
  schema, raw/normalized quest/campaign/item checks and outer endgame authority.
  Leave19–22 on frozen22,23 on frozen23, runtime defaults live.
- Causal RED must demonstrate actual predecessor drift, using live authority
  changes before validator import. Missing-export errors supply no behavioral
  proof. GREEN preserves historical Normal/Nightmare/Hell/title/endgame/service
  graphs, sparse completed/claimed Ormus rows, native/JSON affix maps and input.
- Refuse future proofs, contradictory source graphs, unknown bases, raw undefined/
  inherited/accessor replay fields and forged selected titles. Preserve older
  isolation and no inferred proof/item/reward.

## Exclusive writable source files

- `src/engine/save/frozen-v24-quests.json` (new)
- `src/engine/save/frozen-v24.ts` (new)
- `src/engine/save/validate.ts`
- `src/engine/save/frozen-v24.test.ts` (new)
- `src/engine/save/quest-domain.ts` (shared frozen-domain type only)

No live data/slot/version/migration changes. Retain raw logs/source receipts in
the existing root-owned Ormus packet. Root runs applicable checks at coherent
integration; no CI, commit, push or remote changes. Next migration25 must validate
its literal24 predecessor before recovering reserved-slot items or defaulting.
Broader runtime, earned and full-v1 gates remain open.

## Outcome

Dedicated literal24 reader and frozen JSON domain implemented. Causal RED:5
behavioral failures/12 controls passed; focused GREEN:321 tests/6 files. Independent
read-only review compared all capture authorities and approved raw/normalized/
nested historical isolation. External immutability audit verified all311 JSON
containers reject writes. Packet: `d2-ormus-urhb34ei` (root-owned retained evidence).
Live catalog, current save version and runtime Ormus behavior are unchanged.
