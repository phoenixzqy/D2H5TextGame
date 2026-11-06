# ORMU-01 — Freeze predecessor item-base admission

Status: implemented and independently approved; focused287/3 pass. Final broader
integration checks remain with root before Ormus completion.
Type: Logic. Owner: engine/save specialist (`design_contracts`); root integrates.
Input: `b5a0898` plus preserved uncommitted source at native campaign manifest
`a39221baedbb05710307ab95249891b1b93f63553664b1656191a4257390fad6`.
Spec: [first charm](../../../docs/design/ormus-charm.md),
[ADR-014](../../../docs/decisions/ADR-014-first-charm-ownership.md).

## Acceptance criteria

- Capture the exact84-base pre-charm catalog as literal JSON. The new frozen
  domain is independent of future live loader mutation.
- Every affected native19–24 raw and normalized item admission uses that literal
  domain. Current save24 behavior remains otherwise unchanged.
- Known items under arbitrary `equipped.charm` and mercenary keys remain accepted;
  unknown unique-ID strings and unrelated unknown fields retain prior treatment.
- Unknown future charm bases remain rejected at all authoritative ownership and
  actor-mirror sites. Existing malformed sockets/duplicate ownership still refuse.
- No active slot/catalog/version/migration/reward change is introduced.

## QA test cases and evidence

`src/engine/save/frozen-v24-items.test.ts` must first show a meaningful RED:
changing the live base catalog admits a formerly unknown base or changes an
existing predecessor’s validation. Then prove frozen behavior despite the same
mutation, including raw/normalized paths and every affected version. Include
accepted old unknown unique strings/arbitrary keys/fields and negative controls
for unknown bases, sockets and duplicate owners. Constructed saves establish
boundary compatibility, not earned gameplay. Preserve RED/GREEN command logs at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-ormus-urhb34ei`.

## Exclusive writable files

- `src/engine/save/frozen-v24-item-bases.json` (new)
- `src/engine/save/native-socket-state.ts`
- `src/engine/save/validate.ts`
- `src/engine/save/frozen-v24-items.test.ts` (new)

Other contracts and source are read-only to the worker. You are not alone;
preserve other changes and adapt to them. Root owns subsequent integration and
all files outside this assignment. Keep the existing registered human worktree
and umbrella session ownership; no new branch or source-checkout changes.

## Dependencies and exclusions

Requires approved contract and finished old-source validation. Next: frozen
quest/campaign/endgame authority, then charm slot/catalog, source-bound objective/
Talk/Claim, save25 migration and integrated browser evidence. Save24 remains
current in this card. No tuning, earned rerun, unrelated cleanup, commit, push,
remote action, CI action or worktree release.

## Definition of done

Focused tests pass after causal RED; independent review approves the diff and
compatibility assertions. Root runs applicable engine/full unit/type/lint and
boundary checks at coherent integration points. CI is excluded by owner request;
no fabricated SQL todo integration is required where that tool is unavailable.
Record exact results and artifact ownership, clean verified disposables, then
update this story outcome. Broader Ormus and full-v1 gates remain open.

## Outcome — 2026-10-29

Root implemented after full ordinary units terminated21,897/1,036, exit0. The
literal84-base JSON is byte-identical to the captured live catalog (SHA256
`bddc3eaa90e8fa737ac528cd1b402ad129d5472948edd14713f4dedc936f3c9d`).
Both raw and normalized19–24 calls now supply the private predecessor map;
runtime helper defaults and historical quarantine remain unchanged.

Causal RED:90 tests collected,54 intended behavioral failures/36 passes.
GREEN:90 compatibility tests plus57 native19 and140 frozen23 pass287/3.
Independent review: APPROVE, evidence ADEQUATE, no actionable finding; readers
released. Typecheck is still running and is not reported as passed here.
Exact logs/receipts and pre-repair sources are retained by root in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-ormus-urhb34ei`.
The child worktree claim was refused because its reported ID was not live in
the registry; root reclaimed with its own live ID and performed all mutations.
No alternate worktree or identity substitution was used.
