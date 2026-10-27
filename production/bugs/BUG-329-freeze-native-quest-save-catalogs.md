# BUG-329 — Freeze native quest save catalogs

Status: Fixed locally; final checks and independent source review passed.
No forge status or label applied.
Severity: High — future quest authoring can reject valid historical ownership.
Build: f3b66255; Node/Vitest engine project, no browser/viewport, locale en.
Seed: Not applicable; validation performs no RNG.

## Reproduction

1. Construct a valid literal22 save with the claimed Radament Book, a claimed
   Siege socket charge, or an explicitly received owned Malah potion.
2. Verify production `validateSave` accepts the unchanged input.
3. Change only the live Radament objective list, Siege service reward, or
   potion action receipt identity respectively.
4. Validate the original save again.

Expected: Historical decoding uses the version's literal source definitions.
Actual: The unchanged saves fail with `quest item source must be completed and
claimed`, `Invalid quest service claimed source`, and `unknown quest item source
or item`. The existing custom quest domain also skips the Act V reciprocal graph.

Evidence: `src/engine/save/frozen-v22.test.ts`; original terminal failing run
`red.log` in the verified task archive listed in
[the checkpoint evidence](../../docs/plans/evidence/d11-literal22-quest-boundary.md).
The fourth initial case also failed campaign authority; its exact fixture was
rechecked separately before attributing the result to title/catalog drift.

Affected systems: engine-dev/technical-director, save validation and migrations,
quest services, Act V campaign and nested endgame access. Root owns execution.
Root cause: Native17–22 validation closes over live catalogs at multiple nested
boundaries; `QuestStateDomain` alone does not bind the whole authority graph.
Repair contract: D11 remaining Act I implementation card. Freeze literal22
definitions and bind one immutable domain through raw and normalized checks;
retain reciprocal refusals and current post-migration cache repairs. No inferred
proof, item, charge, title or unlock. No external publication or policy bypass.

Verification: 39 regression tests; final engine10,077/386, full20,040/947 with
two existing opt-in skips, typecheck/lint/production build and four ordinary
en/zh-CN mobile/desktop import→Save-close-Continue checks pass. All1,824 final
inputs remain exact. Independent `[D11-LITERAL22-REVIEW]: APPROVE`, no material
findings/securitypass/readersreleased. Original failing/static/browser-oracle
and supersededfull143 evidence remains archived. This fixes the historical
boundary only; save23 and actual remaining Act I quest/service work remain open.
