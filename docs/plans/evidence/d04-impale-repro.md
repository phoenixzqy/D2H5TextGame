# D04 — Impale inert Bleed and defense/copy contradiction

2026-10-25. [BUG202](../../../production/bugs/BUG-202-impale-inert-bleed-and-defense.md)
is reproduced, not repaired. Root is sole writer; independent acceptance open.

The Freezing Arrow [raw packet](fixtures/freezing-arrow/raw.tar.gz) retains
`impale-native-repro.ts`, its original event-field typo, corrected terminal RED,
`impale-defense-repro.ts`, actual JSON observations and `next-impale-final15-source-audit.json`.
These scripts use actual `playerToCombatUnit`, full native prerequisite chain,
default registry and recorded engine without replacing registered skills. All
fixtures are synthetic. Eight basic cases and sixteen Defense comparison cases
verify immutable inputs/full exact replay and one real1700ms cast/10MP payment.

| Native rank | Seed | Defense0 direct HP loss | Defense100 direct HP loss | Periodic HP loss |
| --- | --- | --- | --- | --- |
|1|7|77|1|0|
|1|19|86|1|0|
|1|41|0; miss|0; miss|0|
|1|97|82|1|0|
|20|7|210|110|0|
|20|19|219|119|0|
|20|41|0; miss|0; miss|0|
|20|97|215|115|0|

Positive hits create a Bleed marker but author no per-stack rate; final target
HP is exactly2000 minus the direct hit, after the complete simulated lifecycle.
The corrected decisive assertion requires real positive periodic HP loss for
each landed hit and fails. The original diagnostic read `damage` instead of
`amount` in its positive-event assertion; no periodic events exist in either
run, and the corrected result preserves the same failure. Both sources/errors
are retained, not presented as two independent mechanic defects.

Existing en/zh-CN descriptions promise ignoring Defense, while the actual
Physical hit loses100damage to Defense100 (with the normal1minimum). The
comparison proves this contradiction separately from Bleed. No intended bypass
or potency is inferred from the observation. Next work needs an explicit
contract, causal regressions and integrated native/UI/browser proof for the
complete skill. Impale remains unverified with no mechanic credit.

The reproduction's source hashes identify the actual tested Freezing Arrow
runtime; the enclosing packet's committed-source audit verifies those bytes.
Genuine L33/nextNormal402/Baal-uncleared state is unchanged. Full C2–C4/G0–G7,
remaining skills, earned build/balance/pacing/endgame and privatev1 remain open.
