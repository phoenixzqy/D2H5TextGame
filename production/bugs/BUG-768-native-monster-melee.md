# BUG-768 — Resolve generic monster melee from authored data

- Status: Fixed locally; uncommitted.
- Severity: Medium — two registered actions bypass JSON-owned tuning.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes, `feat/playable-foundations`.
- Environment: Node/Vitest pure engine; browser and locale independent. Resolver reproduction needs no RNG; constructed combat controls use seed 13.
- Owner: root working solo.
- Requirement: G2 JSON-owned tuning; existing `monster-weak-melee` and `monster-strong-melee` catalog rows.

## Reproduction

1. Clone the monster skill catalog and change either melee row to physical 60–70 and cooldown 2.
2. Resolve the clone with `resolveMonsterDirectSkills` and look up its canonical melee ID.
3. Check whether the registry still depends on a corresponding `DEFAULT_SKILLS` entry.

Expected: native immutable action follows the validated authored tuning, with no hardcoded default.

Actual: resolver returns no matching action. Both causal cases fail with `expected undefined to match object`. Registry registration still uses hardcoded physical 10–15 or 30–50 and cooldown 1. No current authored monster loadout uses these actions; constructed controls earn no campaign or balance credit.

## Evidence and boundary

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-monster-melee-9cf7cadm` through full-v1 acceptance and owns eventual cleanup. `red.json`, exact preimages, scope and security check are retained. Reuse the direct-action resolver, remove only the two melee defaults, add explicit free costs and one closed schema rule. Preserve numbers, delivery, aliases and immediate single-target hits. No shared combat/status, registry, save, UI, CI or campaign changes.

## Resolution and verification

Both actions now resolve from validated JSON through the existing native direct-action adapter. The two builder defaults are removed. A closed schema rule rejects unsupported statuses, scaling, flight, costs and targets; catalog changes add only explicit zero-mana costs.

Two causal failures become passes. All 28 new cases and 12 selected existing adapter/alias controls pass. Constructed seed-13 fights verify both aliases, immediate single-target physical hits, free cost, deterministic replay, input immutability and plain/recorded parity. Strict scoped types (715 files, zero diagnostics), four-file lint and strict Ajv validation of all 50 monster rows pass. Shared combat/status/registry remain byte-identical; all other schema rules and data rows are unchanged. The first schema edit attempt stopped on a uniqueness assertion before writing schema/data; the corrected anchored insertion is recorded in `edit-note.txt`.

All tool handles are terminal. No disposable build, server or browser artifacts were created. This closes a tuning-authority gap, with no earned campaign/balance credit. Full private v1 remains unfinished.
