# BUG-769 — Resolve remaining generic elemental monster actions from JSON

- Status: Fixed locally; uncommitted.
- Severity: Medium — three real monster actions bypass authored tuning.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes, `feat/playable-foundations`.
- Environment: Node/Vitest pure engine, browser/locale independent. Resolver reproduction needs no RNG. Existing affected combat controls use seeds 13 and 142.
- Owner: root working solo.
- Requirements: G2 JSON-owned tuning; existing P15 elemental/hybrid signature contracts. Preserve runtime behavior while replacing hardcoded authority.

## Reproduction

1. Clone the monster skill catalog and change Fire Breath, Poison Spit or Frost Aura to damage 60–70 and cooldown 2.
2. Resolve with the corresponding existing native DoT/direct adapter.
3. Find the canonical action and check its hardcoded default registration.

Expected: each native action derives its supported numerical tuning from validated JSON and has no corresponding builder default.

Actual: all three causal cases fail with `expected undefined to match object`. Hardcoded defaults still supply registered runtime payloads. Real consumers include Blood Lord (Fire Breath), Tainted (Poison Spit), and Frozen Terror (Frost Aura). Fire Breath catalog additionally says `burn` while the effective runtime applies `ignite`; existing DoT rates/stacks are absent from the source catalog.

## Evidence and boundary

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-monster-elemental-04crtxqy` through full-v1 acceptance and owns eventual cleanup. Scope/security, exact source preimages and `red.json` retain all three causal failures. Reuse the two existing adapters, remove these three defaults, close their schemas and author only their current runtime semantics. No changes to shared combat/status/registry, monster loadouts, numeric tuning, saves, UI, CI or campaign trials.

## Resolution and verification

The existing DoT adapter now resolves Fire Breath and Poison Spit; the direct adapter resolves Frost Aura. Their builder defaults are removed. Three closed schema rules validate the exact supported semantics. Data now includes free costs, existing positive DoT rate/stack metadata and the Fire Breath runtime Ignite identity. Damage, cooldowns, status defaults, targets, spell delivery and 500ms Poison Spit flight are preserved.

All three causal failures become passes. All 24 new cases and 11 selected existing cases pass, including native Tainted priority/flight/damage endpoints and both Act V elemental consumers. Strict scoped types (451 files, zero diagnostics), strict all-50-row schema validation and final lint pass. The initial lint failure was a test-call line break; only formatting changed afterward, with affected-file lint rerun. Original failure logs remain retained. Source comparison confirms shared combat/status/registry, all five monster catalogs, other schema rules and all other skill rows are unchanged.

All handles are terminal. No disposable build/server/browser artifacts were created; retained packet ownership remains root. These constructed native checks earn no campaign/balance/pacing credit and renew no spent budget. Full private v1 remains unfinished.
