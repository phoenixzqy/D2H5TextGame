# P15 — Native authored monster Weak Ranged

BUG766 is fixed locally, uncommitted on `feat/playable-foundations` above
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`. Validated JSON now supplies native
physical12–18/single-target/CD1/free/500ms flight. The last monster compatibility
entry and its empty registration path are removed. Only Weak Ranged gains explicit
free cost; one closed schema rule is added. Shared combat/status, previous direct
skill tests and all other data/schema rules are unchanged. MERC_STUB_SKILLS stays.

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-weak-ranged-hwfyxge7`
through full-v1 acceptance and owns eventual cleanup. `red.json` contains one causal
registry failure and one passing catalog control. `verification.json` deduplicates
24actual passes:13skill,2constructed combat,9selected existing projectile/Aim.
The final combat run follows removal of a redundant narrowed-kind check flagged
by initial lint; final five-file lint and strict715-file types/zero diagnostics
pass. Strict Ajv2020 accepts all50monster skill rows. `source-review.json`, exact
`baseline/` and `final-increment.diff` retain the production comparison.

The initial schema insertion anchor matched nested blocks; its assertion stopped
before schema/data writes. Exact top-level line matching repaired the edit. Prior
erroneous output-path cleanup is retained in `cleanup.json`. All check handles
terminal; no server/browser/build/compiled output/cache/disposable was created.

No authored monster currently lists Weak Ranged. The constructed consumer proves
both aliases,500ms flight,one12–18physical hit,free cost,immutable inputs and
plain/recorded/replay parity; it does not add earned or formal balance acceptance.
The remaining generic melee builders and broader G2/full-v1 acceptance stay open.
Historical14/14Normal/210sources/formal0/210 unchanged. No campaign/sample/retry
renewal; browser works, CI excluded, no pending user decision.
