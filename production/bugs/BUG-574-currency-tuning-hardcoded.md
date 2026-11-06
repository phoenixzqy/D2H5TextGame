# BUG-574 — Currency acquisition knobs are hardcoded in the engine

- Severity: Medium; economy calibration and JSON-driven tuning.
- Status: Fixed; authored rules and default compatibility verified.
- Owner: root, sole writer; existing claimed worktree.

The continuous fresh1→Baal55 chain has18segments/1314admissions/7020waves,
20.333combat hours,98,607netwishstones and49,114,796rune-shards. These are one
adaptive Normal pilot, not population or L70Hell faucet acceptance. Its zero
initial funds and exact successor→initial custody are verified without combat.

`orbs-and-currency.ts` embeds wishstone tier/act amounts, champion probability,
boss difficulty multipliers, shard base/tier multipliers and variance. P15
requires authored tuning knobs and project standards require game values in
validated JSON. Material identity probabilities already have that boundary.

Correction: extend the existing material-economy schema/data/loader with closed,
required currency reward rules; consume them at the existing currency origin.
Keep current default outputs, rounding and RNG draws exact. Champion quantity
is1in every act; the old unused act1/2zero entries must not become live behavior.
No saved state changes or migrations; no new sink or economy rate is selected
from this one pilot. Subsequent numeric tuning stays explicit and versioned.

Plan review: ready; one upstream data/loader/engine change, schema before data,
focused override/schema rejection tests and a frozen1680case output+next-RNG
compatibility digest captured before editing. Existing affected material/award
checks, scoped types and lint suffice; no campaign or earlier-act replay.
`validate:data` is absent, so use the existing Ajv-backed material loader's
focused validation checks without installing a replacement.

Security check: pass; local JSON/schema/TS/tests only. No credentials, external
input, permission, dependency, CI, publication or network change.

Evidence packet: `p15-javelin-chain-economy-readback-v1.json` and
`p15-currency-default-baseline-v1.json` in the retained shared packet.

## Outcome

Required closed JSON/schema/typed loader rules now drive the secondary currency
origin. Current defaults preserve champion behavior, exact arithmetic and RNG
order. Five configured-rule cases fail before;119affected checks pass after.
Scoped strict types/explicitlint pass. Before/after production1680case output
plus following-RNG digests match. Authority20 binds four changed production
inputs/two newtests,2093total; other material settings and campaign helpers
remain unchanged. No combat/quest/reward replay or new balance acceptance.
See [acquisition and currency report](../../docs/balance/2026-11-02-javelin-acquisition-and-currency-knobs.md).
