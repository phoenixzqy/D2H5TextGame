# D04 — Zeal target cap and Paladin control attacks

Repair contract for BUG198. Root is the sole writer/author reviewer; independent
design/QA and earned balance remain open. No skill credit before integrated proof.

## Behavior

Preserve Zeal's authored Physical 40–60/+4 per rank, 10 MP, 1 s cooldown,
unlock 12/cap 20 and existing cross geometry. Author `maxTargets: 3` in JSON,
require it for exact active area/cross Zeal, and reject foreign/malformed use.
At the existing area-selection boundary, resolve the full densest cross with
unchanged tie and row-major ordering, then keep its first three living targets.
Each receives one ordinary independent hit. Pay/cooldown/action once; do not
retarget on misses/deaths or add repeated attacks. Other cross and uncapped
area skills retain their exact targeting and RNG paths.

Smite and Charge retain all existing damage/growth/cost/cooldown/ownership and
their real single-target Stun: 1 s normally, 0.5 s on bosses. Charge is a heavy
strike in this no-movement game; no move/range/speed system is added. Fist of
Heavens retains its existing all-living-enemy Lightning hit and 1 s Paralyze,
including ordinary dodge/miss, boss behavior and repeat-Paralyze failure rules.
Do not claim shield-equipment gating that the authored Smite does not require.

The four bilingual current/next/unlearned/MAX descriptions show actual per-hit
base damage and targeting. Zeal explains its cap and deterministic cross choice;
control skills use exact seconds/boss duration and explain that a miss applies
no control. Fist explains repeat-Paralyze failure. No new combat numbers, global
rates, save fields/version/migration, dependency or CI changes.

## Proof and implementation

1. Retain the original native RED and exact script/log/result/receipt. BUG198 is
   filed before production changes; no deliberate failing required test commit.
2. Schema/types/catalog carry the authored cap; strict metadata and actual native
   targeting RED tests precede the production consumer. Preserve other crosses.
3. Verify rank 1/2/20, all nine grid cells, sparse/fewer targets, deterministic
   ties/order, one action/payment/CD, miss/kill without replacement, source
   immutability and replay. Retain uncapped compatibility controls.
4. Prove actual Stun/Paralyze scheduling consequences, expiry/boss/repeat rules,
   native authority and final resource playback for all four skills. Markers
   or effect-list snapshots alone cannot establish control functionality.
5. Pure previews and bilingual UI tests, followed by public production en/zh ×
   desktop/mobile allocation/selection/combat and exact five-domain Save-close-
   new-page-Continue; five-size geometry and inspected screenshots. Disclose
   synthetic fixtures; no earned campaign/build/pacing claim.
6. Final engine/full/types/lint/explicit-false production build, bridge/precache,
   frozen source/build/Git/genuine maps, actual committed-blob proof, exact raw
   archive and owned artifact cleanup before four inventory credits. Full v1
   and independent/earned acceptance remain unfinished.

## Author reviews

Security check: pass. Scope is first-party local targeting/data/UI and proof;
no credentials, permissions, network, dependencies, CI or persistence expansion.

Plan review: ready. The explicit cap fixes the missing authored boundary without
changing shared cross geometry. Causal control tests, exact seconds, boss and
repeat behavior, no-movement semantics and native/save/browser boundaries cover
the material integration risks. This is author self-review, not independent
design approval. The genuine L33/next402 save remains frozen; no campaign or
remote action is authorized.
