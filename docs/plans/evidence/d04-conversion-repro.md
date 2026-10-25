# D04 — Conversion native allegiance reproduction

2026-10-25. BUG200 is reproduced, not repaired. No skill credit, earned build
acceptance, campaign progress or complete-v1 claim follows from this packet.

The actual `playerToCombatUnit` projection accepts legal native rank1/20
Sacrifice→Zeal→Vengeance→Conversion configurations. Both recorded battles pay25MP
at1700ms and publish the converted status with2700ms expiry. At1860ms, during that
status, the converted monster's actual ordinary attack deals100Physical to the
hero (HP2000→1900); its former ally stays2000HP. Original inputs and deterministic
replays are exact. Seed7; Node24.21.0; fully synthetic resources/timing and monsters.

Read [actual detailed results](fixtures/holy-shield/conversion-result.json) and
[source hashes/findings](fixtures/holy-shield/conversion-findings.json).
The [byte-verified raw archive](fixtures/holy-shield/raw.tar.gz) retains
`conversion-native-repro.ts`, original source, both terminal1 command receipts/logs,
and the explicit observation correction. First-run detailed JSON was overwritten
by the command receipt because their filenames collided; it is not claimed as
retained. The second synthetic run uses a separate result filename and unchanged
fixtures/assertions. Its detailed output is the retained result linked above.

The probe ran on `bafc8e0` with Holy Shield working changes while the full suite
was live. Its source hashes match the source later committed as `36fc086`, as
verified by the Holy Shield committed-source audit. It made no repository edits,
genuine save actions or reward changes. Subsequent documentation records the bug.

Next action: explicit authored finite duration/eligibility and actual paid-cast
provenance; effective targeting allegiance covering monster skills/support/hostile
auras/summons; immutable original side for death/reward/victory/result provenance.
The one-second unknown-status fallback is an implementation accident, not a design
decision. Source death/expiry, forged markers, last enemy, native authority,
wave/replay and duplicate-reward boundaries require actual outcome tests.

Root-only investigation; independent design/QA, earned balance, all-class builds,
Baal, C2–C4/fullG0–G7 and complete privatev1 remain open.
