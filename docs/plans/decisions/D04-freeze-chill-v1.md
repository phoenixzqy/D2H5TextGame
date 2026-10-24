# D04 — Ordered Freeze and Chill on cold hits

Root implementation contract for BUG165; independent acceptance pending.
P08 requires preserving authored effects, rather than registering a skill whose
second effect is silently discarded. The live Ice Blast, Glacial Spike and
Amazon Ice Arrow rows each declare `appliesStatus:[freeze,chill]`, cold damage,
active trigger and no secondary tuning. Their UI already displays both effects.
This contract extends D04-frost-nova-secondary-v1 only for that exact structural
pair; other uncontracted status tails remain separate work.

For an active cold damage row with exactly `[freeze,chill]`, preserve the
existing primary Freeze metadata and append ordinary default Chill. No new
numbers, proc metadata, skill identity list, schema fields or save version.
Each successful target receives one damage resolution, then the existing
Freeze chance draw/application, then a chance-one Chill draw/application.
Misses draw neither status. Existing status-before-death ordering remains.
Primary metadata never leaks into the secondary. Complete one target before
the next, retaining summon-first/insertion ordering and existing AoE geometry.

Use accepted lifecycle defaults: Freeze1000ms, halved once for boss/chapter
boss; Chill2000ms with existing0.5 attack-speed factor. Durations do not scale
with rank. Both use exclusive expiry; refresh/phase reconciliation, combo
visibility and cross-wave carry use existing shared machinery. Damage/rank,
mana, cooldown, prerequisites, target selection and equipment eligibility stay
owned by their current contracts. A new chance draw intentionally changes
subsequent RNG for these skills; do not compare changed outcomes to old seeds
as if recordings were identical.

Verification: actual JSON/registry causal RED before adapter change; rank1/20
recorded battles for all three skills, ordered damage/status events, real Chill
cadence after Freeze, exact ordinary/boss expiry, miss/kill/dead-target and
resource/level/cooldown cases, multi-target ordering, replay/input immutability.
Verify excluded shapes and unchanged other registered rows. Run related and
engine tests, full unit/type/lint/build and production runtime/browser checks.
Diagnostic saves never become earned inputs; no actual400/quest action occurs
in this repair. Requalify the genuine continuation on the changed runtime.

Plan review: ready. One shared adapter correction uses the existing plural
status representation and application loop. Root owns source, tests and
evidence; no delegation. Security check: pass; local game/test changes only,
no credentials/network/dependency/permission changes or validation bypass.
Raw task evidence is owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-ancients400-yg280ipi`;
remove exact disposable cache/build paths after their consumers finish, retain
diagnostics through full-v1 consumers. C2–C4/fullG0–G7 remain open.
