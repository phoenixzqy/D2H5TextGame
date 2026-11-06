# P15 — Native JSON-backed direct monster actions

BUG764 is fixed locally on `feat/playable-foundations`, above HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`; uncommitted. The previous goal
turn reported status without implementation progress. This continuation replaces
three enabled compatibility actions with validated immutable native actions.

Frost Bolt retains cold25–40/CD2/Chill/500ms flight; Bone Spirit retains
arcane40–60/CD2/500ms flight; Whirlwind retains physical40–60/CD3/all-enemies.
The latter two JSON rows now agree with the adopted P15 decisions. All three
have explicit free costs and closed schema shapes. Native delivery, alias
identity and metadata-only catalog tags remain. Numerical payloads and cadence
are read from JSON. Shared combat/status and every other skill row are unchanged.

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-direct-monsters-4rf_g8g8`
through full-v1 acceptance and owns eventual cleanup. Evidence:

- `red.json`: five causal failures before repair.
- `final-direct.json`:65 passing assertions; `final-native-controls.json`:26
  passing selected consumer assertions,124 unrelated assertions filtered. Total91
  distinct actual passes; filtered assertions are excluded from the count.
- `native-before.json`/`native-after.json`: identical full snapshots, results and
  events for native Horror Mage, Oblivion Knight and Ancient Barbarian. Each
  checks plain/recorded parity, repeated replay and input immutability.
- `final-types.log`: strict scoped451files/zero diagnostics; four-file lint and
  strict Ajv validation of all50monster-skill rows pass. The advertised
  `validate:data` package script is absent, so `check-schema.cjs` uses the real
  schema with strict Ajv2020 directly.
- `verification.json`, `source-review.json`, `final-increment.diff` and exact
  `baseline/`: source/data/schema boundary and final verification receipts.

An initial edit anchor matched nested schema blocks and stopped before writes.
The intermediate suite-load failure is retained as `green-initial.*`; it is not
passing evidence. Top-level anchoring fixed the edit; all final checks pass.
All check handles terminal. No server/browser/build/cache/disposable output was
created; scripts and results are required retained evidence.

This completes this implementation increment, not full privatev1. Historical
14/14intended Normal five-act completions,210checkpoint sources and formal balance
acceptance0/210 remain unchanged. No campaign, retry or sample allowance renewed.
Remaining progression/acquisition/economy/difficulty/endgame and integrated
acceptance stay open; no human pacing inference. Browser works; CI excluded.
