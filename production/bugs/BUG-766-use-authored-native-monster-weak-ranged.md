# BUG-766 — Use authored native monster Weak Ranged

- Status: Fixed locally; uncommitted.
- Severity: Medium — the last enabled monster compatibility action has wrong damage and archetype.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes, `feat/playable-foundations`.
- Environment: Node/Vitest pure engine, locale/browser independent. Constructed projectile controls use seed13/factory7.
- Owner: root working solo.
- Requirements: G2 zero enabled stubs and JSON-owned tuning; `src/data/skills/monsters.json`, `docs/design/monster-spec.md` physical12–18; `docs/plans/decisions/D04-slow-missiles-v1.md` flight500ms.

## Reproduction

1. Load the production registry and resolve `monster-weak-ranged`.
2. Compare its native identity and damage with the existing catalog.

Expected: native monster projectile, physical12–18/single-enemy/CD1/free/500ms flight; ranged delivery and no status/combo additions.

Actual: hardcoded compatibility action labels it mercenary and uses physical8–14. One causal registry assertion fails while the existing catalog control passes. No current authored monster has this ID in its literal skill list; synthetic native consumer controls are not earned campaign evidence.

## Evidence and boundary

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-weak-ranged-hwfyxge7` through full-v1 acceptance and owns eventual cleanup. `red.json`, exact preimages and scope are retained. Add one closed schema rule and free cost, resolve the existing authored row through the native direct-action adapter, and remove the now-empty monster compatibility catalog/registration path. No new monster consumers or other tuning, shared combat/status, save, UI, CI or campaign changes.

## Resolution and verification

The existing direct-action resolver now installs Weak Ranged from validated JSON;
only its explicit free cost was added to the authored row. One closed schema rule
rejects unsupported semantics. The now-empty monster stub catalog and registration
loop are removed; mercenary compatibility definitions remain. Shared combat/status
and all other skill rows remain byte-identical to retained preimages.

`verification.json` records24distinct actual passes:13skill assertions,2constructed
combat assertions and9selected existing projectile/Aim controls. Both aliases fire
one physical12–18 projectile at900ms after a400ms action, preserving500ms flight,
free cost, input immutability, plain/recorded parity and deterministic replay.
Strict scoped715files/zero diagnostics, five-file lint and strict50-row schema
validation pass. Original RED and initial failed edit/lint evidence remain honest.
All handles terminal; no disposable build/server/browser/cache was created. This
constructed consumer proof adds no earned campaign or balance credit. Full v1
remains unfinished; historical14/14Normal/210sources/formal0/210 unchanged.
