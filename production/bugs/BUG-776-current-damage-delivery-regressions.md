# BUG-776 — Restore current native damage-delivery regression fixtures

Status: fixed locally, uncommitted; selected correction verified. Severity: Medium.
Owner: root, solo QA/engine. No production mechanic change required.

## Reproduction and cause

2026-11-05, Linux/WSL, inherited dirty `feat/playable-foundations`, HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. Run
`src/engine/combat/damage-delivery.test.ts`. No battle RNG, locale or viewport
causes the failures; registry fixtures use seed7 only to build native units.

Expected: sparse mutation is rejected by native delivery provenance, immutable
payloads cannot be mutated, and all current catalog monsters retain their exact
authored basic-delivery classification.

Actual: two cases attempt length writes to the now-immutable native Weak Melee
payload, throwing before provenance assertions. Another expects111monsters;
the actual catalog and delivery manifest now have112, including Baal's tentacle.
These are stale fixtures uncovered during BUG775 affected verification; its
champion metadata changes neither skill mutability nor monster count.

Evidence: `affected.json`/`affected.log` and the test preimage in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act5-champion-immunity-hmslxzhh`.
Root retains this exact packet through full-v1 acceptance, then removes it after
all consumers finish. No earned, acquisition, balance or pacing samples.

## Correction plan

Keep the sparse-length/reload provenance test on the retained mutable native
Strafe compatibility skill (`amazon.piercing_strike`), already explicitly
classified as ranged. Require mutability, sparse shape, rejected provenance
before/after reload and restored classification after repair. Add Weak Melee
to the existing immutable-payload boundary/reload assertions alongside Rend.
Update the exact catalog count to112while retaining exhaustive ID equality,
all factory outputs, exactly six ranged identities and source preservation.
Do not change production, skip or weaken the behavioral assertions.

Plan/security review: ready; authorized local test-only correction, no
credentials, dependencies, networking, CI, save, permission or publishing effect.

## Verification — 2026-11-05

The planned test-only correction is implemented. Five selected cases pass,
including both sparse mutable provenance cases, the112-monster manifest and
the two immutable native payloads. The other31delivery cases passed in the
initial affected run; original three failures remain retained. Scoped strict
types and explicit changed-file lint pass. No production delivery code changed.
See [evidence](../../docs/plans/evidence/p15-act5-champion-immunity.md).
