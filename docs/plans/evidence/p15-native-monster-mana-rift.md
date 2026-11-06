# P15 — Native JSON-backed Wraith Mana Rift

BUG765 is fixed locally, uncommitted on `feat/playable-foundations` above
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. The adopted
`P15-curse-arcane-family-v1.md` retains arcane10–20/all-target/CD3/ManaBurn.
JSON now matches that runtime contract; the native direct-action resolver replaces
its compatibility entry. No runtime retuning or resource/combo/status change.
Only one catalog row and one closed schema rule change. Shared combat/status,
registry and prior direct-action test source remain byte-identical.

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-mana-rift-llnn0ai7`
through full-v1 acceptance and owns eventual cleanup. `red.json` contains two
causal failures. `final-rift.json` has12passing assertions; selected native/resource
controls have7passes/54filtered (19distinct passes). `native-before.json` and
`native-after.json` have identical full Wraith snapshots/results/165events, with
plain/recorded/replay/input-immutability controls. Strict scoped451files/zero
diagnostics, three-file lint and strict Ajv validation of all50monster-skill rows
pass. `verification.json`, `source-review.json`, `final-increment.diff` and
`baseline/` retain exact source and verification receipts. The absent
`validate:data` script is replaced by direct strict validation against the actual
schema in retained `check-schema.cjs`.

An initial schema-generation script had a Python syntax error before execution;
no file writes occurred in that attempt. Reusing the compatible existing schema
shape fixed the edit. All task handles terminal; no server/browser/build/cache/
disposable output created. No campaign/sample/retry allowance renewed. Full
privatev1, earned balance/economy/pacing and integrated acceptance remain open;
historical14/14Normal/210sources/formal0/210 unchanged. Browser works; CI excluded.
