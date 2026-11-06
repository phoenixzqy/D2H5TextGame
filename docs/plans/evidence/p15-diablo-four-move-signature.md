# P15 — Diablo’s four-move signature

2026-11-05. BUG752 fixed locally; full private v1 remains incomplete.

Chaos Sanctuary's Inferno-only chapter override discarded Diablo's four moves.
The archetype's ordinary Fire Breath/Lightning cooldowns would also starve the
later priority skills. Two explicit authored variants now use existing cone-five
geometry/status integration, followed by existing Bone Prison and Charge in both
native sources. AtAS140 the actual sequence1380/2760/4140/5520ms repeats at
6900/8280/9660/11040ms. Fire40–60 applies Ignite3/3000ms/10% mitigated-hit DPS
per stack; Lightning40–60 applies Paralyze1/1000ms. Both zeroMana/CD5/4. Prison
retains2000ms trap/no-dodge; Charge retains60–90Physical plus100%Attack/CD4.
Chapter44800Life/420Attack/460Defense/AS140, level/tier and reward source exact.
[Decision](../decisions/P15-diablo-four-move-signature-v1.md).

## Verification

24 distinct selected cases pass:

- 10 resolver/schema cases: aliases, deep copied/frozen payloads, malformed and
  incompatible data rejection, duplicate/missing identity and JSON tuning.
- 9 engine cases: actual cone-five target IDs with sixth/outside excluded;
  landed potency, finite full DoT/exact expiry, Paralyze expiry, missed-target
  exclusion, supported unrelated Freeze/Poison/Plague immunity invariance, shared
  spells and Prison/Charge unchanged. Input isolation and recorded/plain/re-record
  parity checked. Durable synthetic controls are not earned campaign characters.
- 2 native manual/idle cases: eight actual actions; unchanged stats/source;
  party targets/statuses, real Charge impact, paid Prison/action suppression and
  resumption, bilingual names, wave/input immutability and deterministic parity.
- 1 existing ActIV boss-construction row; four other acts filtered.
- 1 existing native Diablo Bone Prison case and 1 delivery-catalog coverage case;
  60 unrelated cases filtered.

`red-native.log` retains two genuine pre-fix manual/idle REDs. `green-native.log`
retains the initial missed cone whitelist failure; corrected `green-native-r2.log`
and `green-native-r3.log` pass. `green-payload-r2.log` records10resolver+9engine
passes; `final-engine-r2.log` records the9engine cases after fixture corrections.
`related.log` records the two selected related cases. Final strict scoped
`types-final-r2.log`:602implementation/data files,zero diagnostics. Unchanged
TypeScript files passed `lint-final.log`; its single test-file redundant guard
was removed and `lint-final-r2.log` passes. All check handles are terminal.

Earlier failures are retained in `intermediate-failures.md` and original logs.
High dodge permits the engine's5%hit floor; actual misses must have zero damage/
status/DoT. Unsupported Ignite/Paralyze immunity fixtures were wrong: native
schema/type only support Freeze/Poison/Plague. Corrected controls prove all
combat events unchanged under those unrelated immunities and explicitly retain
input immunity metadata. No type/validation suppression or production widening.

## Review, scope and custody

Seven production files: skill schema/catalog, ActIV archetype/chapter, delivery
catalog, immutable resolver and registry. Structural baseline comparison proves
every pre-existing skill row exact, ActIV changes only Diablo skill references,
and delivery adds exactly the two spell entries. Schema extends only the two
new contracts and geometry/cap ID whitelists. Existing geometry/status/Prison/
Charge reused; no combat branch, save format, dependency, network or CI change.
Self-review covers correctness/readability/architecture/security/performance;
independent review and owner acceptance remain open.

No campaign or spent sample/retry budget renewed; no browser/server started.
No active task process, disposable build or task-local cache remains. Root
retains this exact packet through full-v1 acceptance, then removes it:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-diablo-signatures-z9esxw00`.
It contains ownership, original/final source snapshots, logs, review and SHA256
inventory. It is required diagnostic evidence, not disposable output.

Previous goal turn was status-only/no progress; this continuation corrected
fixtures/types/lint, completed affected checks and recorded local closeout.
Historical14/14Normal,210/210sources,formal0/210 unchanged. Enrage effect/stun
resistance, Duriel challenge/progression, acquisition/pacing, difficulty/endgame,
integrated mobile/a11y/performance/PWA/soak and owner acceptance remain open.
