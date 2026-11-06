# ORMU-02 — Route explicit native24 campaign authority

Status: implemented, independently APPROVE; focused247/4 pass. Type: Logic.
Owner: root; independent reviewer: design_contracts.
Depends on ORMU-01. Spec: [first charm](../../../docs/design/ormus-charm.md),
[ADR-014](../../../docs/decisions/ADR-014-first-charm-ownership.md).
Producer review: ready; no open design question.

## Acceptance criteria and QA

- Append optional explicit domain parameters to native24 replay/campaign/title
  validators; retain default live behavior and the existing allowMissing position.
- Route area vocabulary, selected profiles, ordinal bound, services, titles,
  Nightmare/Hell campaign ownership and nested endgame through the same domain.
  Ordinals still have exactly normal/nightmare/hell keys.
- Meaningful RED then GREEN: custom historical area permits/excludes Hell and
  Nightmare clears independently of live areas;17 is rejected with supplied
  exclusive bound17; supplied profile vocabulary refuses excluded selections.
- Distinct throne proof works for Hell, then again with achievement selected,
  proving nested authority. Alternate campaign/achievement titles are honored
  only with owned entitlements. Missing proof, claim or prerequisite refuses.
- Preserve descriptor/accessor/inherited-field and allowMissing protections,
  input nonmutation and current-default behavior.

## Exclusive writable source files

- `src/engine/save/act5-campaign.ts`
- `src/engine/save/current-campaign.ts`
- `src/engine/save/quest-domain.ts`
- `src/engine/save/native24-campaign-domain.test.ts` (new)

No live catalog/quest/slot/save-version change. No global runtime routing through
a historical domain. Root preserves all other edits and owns broader coherent
integration checks; no repeated full suite while focused slices are in flight.
Retain causal logs/receipts under the existing root-owned Ormus packet. No CI,
commit, push, deployment, remote change or worktree release while work continues.

## Definition of done

Focused tests pass after behavioral RED, independent review approves source and
evidence, applicable checks pass, and exact process/artifact ownership is recorded.
Next card captures literal24 and routes its raw/normalized/outer save validation;
Ormus runtime and broader game acceptance remain open.

## Outcome — 2026-10-29

Behavioral RED collects11, with10 intended failures and1 descriptor-control pass.
GREEN passes all11 plus adjacent current/frozen/item cases247/4. The prerequisite
negative was strengthened after RED to retain the valid Eve graph while requiring
missing Prison authority; no production defect is inferred from that test change.
Independent review approves source and evidence; readers released. Exact logs,
pre-repair sources and review receipt remain in the root-owned Ormus packet.
Types/lint/broader engine validation follow the coherent frozen24 integration.
