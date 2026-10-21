# BUG-060 — Apply explicitly selected player Might in combat

- **Status:** Reproduced; pure-engine runtime fix in progress. Native wave integration remains open.
- **Severity:** High — selected Might has no combat effect.
- **Owner / affected systems:** engine-dev (root integrator), selected aura combat projection; native combat adapter follows separately.
- **Build:** `e1c976d1feca247200bcca1d0135826b54a88863` with reviewed regression tests installed; production engine unchanged.
- **Environment:** Node v24.21.0, Linux 6.18.33.2-microsoft-standard-WSL2, lockfile Vitest 1.4.0. Browser, viewport and locale: N/A (pure deterministic engine reproduction).
- **Seed:** 7.

## Reproduction

1. Run `node node_modules/vitest/vitest.mjs run src/engine/combat/might.test.ts`.
2. The `fixed physical100 at rank1` fixture supplies a canonical selected Might projection, a living player hero, allocated rank1, physical potency0.03 and Attack potency0.01. Its registered fixed physical skill has base100; the enemy has zero mitigation/dodge and1HP.
3. Repeat at rank20; also inspect the separate basic Attack100 and explicit fielded-merc cases.

## Expected

The fixed physical hit is103 at rank1 and160 at rank20, with no new weapon scaling. Basic Attack100 is104/192, applying the separate Attack bonus before additive physical increased damage. Only the live source hero and explicitly fielded living merc receive the effect. Current encounter source absence/death suppresses it; stun/freeze does not.

## Actual before patch

The fixed physical hit remains100 at both ranks (`expected 100 to be 103` / `expected 100 to be 160`). The behavioral suite has10 failed and16 passed assertions; failures also cover the basic Attack bonus, additive physical increases, fractional Attack flooring, later pipeline ordering and the eligible merc including source stun/freeze. The complete unaffected seed7 control recording passes.

The separate helper suite has44 missing-composer capability failures and188 existing passing controls. These are API-capability failures, separate from the10 demonstrated combat behavior failures.

## Evidence

Task evidence root (owner: root; retain through Might card preservation and review):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-might-w1jtf6hl`.

- `runtime-proposal.v2.json` and reviewed frozen test drafts.
- `focused-runtime-red-behavior-report.json` / metadata:26total,10failed,16passed, no skips, exit1; production combat unchanged.
- `focused-runtime-red-helper-report.json` / metadata:232total,44failed,188passed, no skips, exit1.
- `runtime-prepatch-control.json`, SHA256 `736c05cfdd2d31fdaba94a63e2615f9b46a1db95391c1250453691d30cd802bb`: complete actual input, six timestamped events/delays and final teams, captured before implementation.

## Root cause and bounded fix

The snapshot/state has no selected Might projection. Basic attack reads only authoritative Attack; shared direct damage reads only existing per-type increases. Add a narrow frozen projection, compose from canonical selection/shared eligibility, and consume it through current encounter identity/life lookup at those two calculations. Keep fixed skill bases, authoritative stats/resources, summons, the distinct mercenary `aura-might`, RNG and scheduler unchanged.

## Workaround / closure

No player workaround. Pure-engine tests do not establish native playable activation. Record the runtime commit, native integration, regression evidence and final closure in the subsequent card evidence before marking the complete selected-aura path fixed.
