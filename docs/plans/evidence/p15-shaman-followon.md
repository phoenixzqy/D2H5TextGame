# P15 — Two Shaman ordinary-attack rows

The approved [P14a02 follow-on contract](../decisions/P14a02-monster-attack-growth-v1.md)
authors Carver Shaman and Devilkin Shaman at13/+2. Both retain their support-caster
spells and speed85. This is a narrow content correction, not balance acceptance.

Evidence is retained in the root-owned packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`:

- `p15-two-shaman-prechange-v1.json`: original exact data/test source.
- `p15-two-shaman-red-v1.log`/`-exit.json`: six intended failures,54 controls pass.
- `p15-two-shaman-green-v1.log`/`-exit.json`: two files,64tests pass.
- `p15-two-shaman-data-v1.log`/`-exit.json`: central Ajv loader292tests pass.
- `p15-two-shaman-delta-v1.json`: exactly four added arrays across two rows;
  all other fields/rows preserved. Current catalog111rows,ten authored.

Checks cover literal tier scaling at L1/L12/L17, actual ordinary-hit damage,
deterministic recorded events and input immutability, unchanged active Fire Bolt
formulas/RNG for each variant, existing fallback/overrides/special ordinary
attacks, and strict schema boundaries. Both rows remain ineligible for bosses.
The package has no `validate:data` command; the actual central loader tests
exercise production JSON through its strict registered schemas instead.

An isolated production bundle includes these rows plus the independently
reviewed idle clock and quest SVG changes. Binding:
`p15-idle-browser-build-binding-v2.json`, SHA256
`1a9ab28d1659e0d7438ff1a534db26a72b05bbe9dbb6016c17a119595d938e89`.
Build and required-shell/precache/bridge guards pass. Its constructed browser
case is integration evidence, not earned campaign reachability or pacing.
Remaining101monster rows need role-specific review; real Shaman resurrection
and the whole private-v1 acceptance remain open.
