# BUG-765 — Use native JSON-backed monster Mana Rift

- Status: Fixed and verified locally; uncommitted.
- Severity: Medium — enabled Wraith action still uses a compatibility payload and its catalog contradicts the adopted contract.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes, `feat/playable-foundations`.
- Environment: Node/Vitest pure engine; native Wraith control seed13/factory7. Locale/browser independent.
- Owner: root working solo.
- Requirements: G2 zero enabled stubs and JSON-owned tuning; `docs/plans/decisions/P15-curse-arcane-family-v1.md` retains arcane10–20/all-enemy/CD3/indefiniteManaBurn with existing resource and combo rules.

## Reproduction

1. Load the native skill registry and monster JSON.
2. Resolve `monster-mana-rift` and compare the registry payload and catalog with the adopted Wraith contract.

Expected: validated JSON owns the native monster action, preserving all-target10–20/CD3/ManaBurn behavior.

Actual: hardcoded compatibility action is mislabeled mercenary. JSON instead describes single-target40–60 without Mana Burn. The current runtime behavior is explicitly retained by the adopted plan; this repair must align data and replace the compatibility action without retuning combat.

## Evidence and boundary

Two causal assertions in `src/engine/skills/monster-mana-rift.test.ts` reproduce the discrepancies. Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-mana-rift-llnn0ai7` through full-v1 acceptance and owns eventual cleanup. Exact preimages/native diagnostic are in the packet. Add one closed schema rule, align this JSON row, resolve it through the native direct-action adapter and remove only its compatibility entry. No shared combat/status, combo/resource, other monster tuning, campaign, save, UI or CI change.

## Local verification

The existing native direct-action resolver now installs Mana Rift from its validated JSON row. One closed schema rule preserves all-target Mana Burn semantics and rejects unsupported carriers; only this catalog row changes. Two causal RED assertions become GREEN;12 skill assertions and7 selected Wraith/resource assertions pass,54 unrelated assertions filtered. Strict scoped451files/zero diagnostics, three-file lint and strict Ajv validation of all50 monster skills pass. Full native Wraith snapshots/results/165events match before/after exactly; plain/recorded/replay and input immutability also pass. Shared combat/status, registry and the prior direct-skill tests are unchanged.

Packet `verification.json`, `source-review.json` and `final-increment.diff` retain exact receipts/preimages. An initial one-line schema-generation script had a Python syntax error before executing; no schema/data file changed in that attempt. Reusing the existing compatible schema shape corrected the edit. All task handles terminal; no server/browser/build/cache/disposable output created. Root retains the named packet through full-v1 acceptance and owns eventual cleanup. No campaign/sample/retry renewal, numerical acceptance or human pacing claim.
