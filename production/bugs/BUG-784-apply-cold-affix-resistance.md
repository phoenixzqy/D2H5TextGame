# BUG-784 — Apply Cold Enchanted resistance

- Status: Fixed locally and verified; uncommitted, no independent acceptance.
- Severity: Medium — the elite's promised elemental defense is missing.
- Owner: root, engine/data/store responsibility, solo.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
- Environment: WSL/Linux, Vitest UI project (jsdom); runtime browser verification pending. Locale independent, no rendered viewport in the reproducer.
- Seed: 7.

## Reproduction

1. Select the real JSON `elite-affix/cold-enchanted` definition.
2. Pass it to native `buildEnemiesForWave` on a level7 Fallen champion.
3. Repeat with tier `rare-elite`.

Expected: monster-spec §9's +50 percentage points of cold resistance is added
to the archetype and rare-tier bonus, then capped at75. Champion has50;
rare elite has75. Frost Nova and other stats remain intact.

Actual: champion has0 and rare elite30. Both focused assertions fail for those
exact values. No existing affix field carries elemental resistance to construction.

Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-cold-affix-resistance-hdlhai8s/red.json`
and `red.log`; regression `src/stores/combatHelpers.affix-resistance.test.ts`.
An initial wrong-project filter discovered no tests; its separate log is retained
and grants no reproduction credit.

Affected systems: elite JSON/schema/types, native store consumer, monster factory.
Root cause: absent authored per-element resistance channel. Existing all-type
rare resistance is unrelated to the selected affix and cannot supply this effect.
Workaround: none for challenge fidelity; fighting the underprotected monster works.

Scope: repair cold resistance only. Existing Frost Nova stays; Frost Aura and
other §9 affix behaviors remain separately unimplemented/unaccepted. D07's
Lightning specialization is not changed. No campaign or population balance claim.

Root retains the exact evidence packet through full-v1 acceptance and removes
it after consumers finish. Fix/verification outcome will be appended here.

## Fix and verification

The five-file JSON/schema/type/factory/native-consumer repair implements the
authored cold bonus without inferring it from a label or spell. Two causal REDs
become GREEN. Seven affected files pass83distinct cases, covering native damage,
rare addition/capping, custom/absent metadata, invalid inputs before RNG,
input/deterministic preservation and manual/idle carriers. An initial lint
failure on the typed null guard is repaired by validating the supplied value as
unknown at the runtime boundary; no suppression. All15affected factory boundary
cases pass after that type-boundary cleanup. Scoped strict types import928files
with zero diagnostics; six changed TS/test files pass lint.

Four Chromium147 bilingual mobile/desktop runtime cases pass native schema,
factory/damage and four planner controls each, zero errors/warnings/failed
requests. This is a constructed runtime fixture, not an earned campaign or UI
acceptance claim. The subsequent lint repair preserves the exact guard predicates
and arithmetic; it introduces an unknown-typed input alias. Boundary tests and
types pass on the final source.

`green.json`, `boundary-green.json`, `types-result.json`, `lint.log`,
`browser-result.json`, source preimages and `cleanup.json` remain in the packet.
Browser PID388021 is absent, port5173 is unbound and exact `vite-cache` is
removed. All command handles are terminal. Initial discovery/lint failures stay
retained; no broad suite, campaign replay, CI or renewed diagnostic budget.
