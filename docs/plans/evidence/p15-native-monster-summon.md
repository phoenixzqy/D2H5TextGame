# P15 — JSON-owned generic monster summoning

2026-11-05. BUG770 fixed locally; full privatev1 remains unfinished.
Previous goal turn was status-only/no progress. This continuation implements
the remaining generic monster summon and preserves adopted P15 behavior.

`monster-summon.ts` reads the validated catalog for cooldown/free cost/template
identity. New `summons/monster` JSON owns startup flag, living cap and complete
fixed body stats. Its closed schema follows the existing summon loader pattern
and joins the browser precompilation registry. There is one runtime authority
for each tuning value; factory and preview use fresh independent body copies.

Native payload stays target summon/CD5/free/rank1/startup with a single summon
effect/minion/maxCount2. No explicit count, refund, growth or ordinary monster
batch is added. Thus one minion starts at0, later eligible casts fill or replace
up to two living;40HP/Attack10/Defense10/AS70 and other body numbers stay exact.
Existing mitigation continues to own magical mitigation. Owner side/level and
battle-owned identity remain under the existing factory/combat boundary.

Two causal REDs show changed JSON cooldown/body were ignored. Both pass after
integration.25new definition cases cover native payload, tunable cap/startup,
deep-copy isolation and rejected malformed/unsupported data. Six selected
existing cases cover native Warped Shaman startup/cadence/replacement/body/no
refund/replay, Coldworm/Radament exact cadence, Blood Raven shared definition
and minion body isolation. **33distinct cases pass**; two test API corrections
were rechecked separately, not counted again. Scoped strict721files/zero
diagnostics, final lint, strict50-row monster-skill and new body schema pass.

Intermediate errors stay explicit: first schema edit stopped before writes on
an overbroad uniqueness assertion; corrected with an anchored top-level match.
The initial body RED invocation hit a missing-JSON import before execution;
after schema/data creation the actual body authority assertion failed40vs60.
Initial type/lint found test-only readonly mutations/dynamic deletion; corrected
with Reflect APIs. Initial selector missed quoted boss IDs; only the missing
two cases ran afterward. No production suppression or weakened assertion.

Source review confirms shared combat/status and all five monster catalogs are
byte-identical. Only the matching skill row gains free cost/template identity;
one closed identity-specific rule is added, all other schema/data rules remain.
Registry gains one installation; factories gain the authored body lookup;
the final generic monster builder and inline body constants are removed.

Root retains packet through full-v1 acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-monster-summon-h7pc3wc6`.
It contains preimages, scope/security, original failures, command reports,
verification/source review, exact increment diff and cleanup receipt. All
handles terminal; no disposable cache/process remains. Root removes evidence
after acceptance and consumers finish. No campaign/sample/retry budget was
renewed. Historical14/14Normal/210checkpoint sources/formal0/210balance stays
unchanged; no pacing or earned balance claim follows. Browser works, CI stays
excluded, no user hold. Progression/acquisition/economy/pacing, difficulty/
endgame and final integrated acceptance continue.
