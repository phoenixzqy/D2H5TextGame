# D04 — Paladin Sacrifice life tradeoff

2026-10-25. BUG197 is locally repaired and verified. This packet establishes
bounded functionality for Sacrifice. Root is the sole writer and author reviewer;
independent design/QA and earned class/build balance remain open. C2–C4, full
G0–G7 and complete private v1 remain unfinished.

Controlling [contract](../decisions/D04-paladin-sacrifice-v1.md) and
[original bug](../../../production/bugs/BUG-197-paladin-sacrifice-self-damage.md).

## Behavior and source

Runtime/test commit: `4b07c98`. Presentation/test commit: `89c12a1`.

Sacrifice retains Physical 40–60/+4 per rank, zero MP, 1 s cooldown, unlock 1/cap 20,
single-target damage and native ownership. Strict JSON explicitly authors an 8%
life fraction and minimum 1 HP loss; both are provisional local tuning, not earned
balance approval. Only a real selected Sacrifice hit removing positive actual
enemy HP charges the living caster. The cost is the larger of the authored
minimum and the floored fraction, capped at remaining caster HP. Absorption and
overkill are excluded. Misses, later basic attacks, fallback, blocked actors,
aura pulses and periodic damage do not charge.

Ordinary target hit/death/orbs and reflection settle first. The surviving caster
then pays once through a direct life debit that bypasses own dodge, mitigation
and shields, spends no MP or shield pool and never reflects/recurses. The cost
can kill. Existing sticky hero defeat, summon orphan cleanup and qualified
reward rules remain controlling, including a final-enemy kill. Ordinary positive
self-target Physical damage events keep actual playback and final HP aligned.

Pure bilingual current/next/unlearned/MAX details describe actual base damage,
percentage/minimum, positive-HP condition, exclusions, ordering and lethal risk.
No save field, migration/version, dependency, global rate, CI, skip or threshold
changes. Save version 22 remains.

## Automated proof and provenance

Five new test files add 60 cases: 22 strict-schema, 15 actual-combat, 6 pure-preview,
9 native/playback and 8 bilingual component cases. Native rank 1/2/20, aliases,
class/selection/unlearned/overcap authority, zero MP, mitigation/minimum,
overkill/orbs, miss/control/CD/basic/DoT exclusions, own shield/MP bypass,
lethal/nonlethal reflection, exact-once hero/orphan death and final-kill defeat
are covered with deterministic immutable recordings. A reverse-side pure-engine
hero fixture isolates full enemy absorption; it does not claim native monsters
can learn player shields or Sacrifice.

| Final check | Observed result |
| --- | --- |
| Original native probe after repair | Two rank 1/20 cases; 12 controls and all four formerly failing requirements PASS. Exact caster losses 3/9 HP. |
| Integrated focused checks | 60 passed / 5 files. |
| Engine | 7,331 passed / 262 files; 98.880 s wrapper. |
| Standard `npm test` | 14,045 passed / 618 files, two existing skips; 468.318 s wrapper. |
| Typecheck | PASS, 56.344 s. |
| Full lint / engine purity | PASS, 116.122 s. |
| Explicit `VITE_E2E=false` production build | PASS, 15.706 s. |
| Production bridge / precache | Four JS chunks bridge-free; all 756 precache references exist. |
| Frozen inputs through full suite | All 1,347 source/test/config and 760 build files, Git HEAD/status and genuine save unchanged. |
| Actual committed source | All 1,347 tested blobs match committed HEAD `89c12a1` and disk. |

Existing test-time React, bundle/precache and Browserslist warnings remain.
[Post-full audit](fixtures/sacrifice/post-full-freeze-audit.json),
[committed source audit](fixtures/sacrifice/committed-source-audit.json),
[terminal receipts](fixtures/sacrifice/terminal-receipts.json).

## Public production-browser proof

Four isolated cases pass: en/zh-CN × 1280×800/360×640. Public new-Paladin creation,
disclosed synthetic import, public allocation 1→2/selection and real Blood Moor
combat show positive self-target Physical damage in every case. Fixture: L30,
50,000 life/mana equipment, −80 attack speed, one learned Sacrifice and one free
point. This is functional proof, not earned campaign/build/balance acceptance.
No production bridge or page error was present.

A separate browser-output audit checks four positive self-damage cases, eight
exact five-domain Save-close-new-page-Continue pairs, rank/points/configuration,
and 20 geometry samples at 360×640, 412×915, 640×360, 1280×800 and 1920×1080. No page
horizontal overflow; allocation controls ≥44×44. All eight screenshots are
retained and visually inspected. Mobile logs extend below the viewport; exact
retained log JSON proves actual casts/effects. All four owned preview PIDs are
absent and port 4483 is closed.

[Browser audit](fixtures/sacrifice/browser-evidence-audit.json),
[English mobile details](fixtures/sacrifice/sacrifice-en-mobile.png),
[Chinese mobile details](fixtures/sacrifice/sacrifice-zh-CN-mobile.png).

## Failures and author review

Original native RED is preserved separately in [BUG197's fixture](fixtures/sacrifice-repro-197/packet.json).
The initial 35-case core RED has 13 failures/22 controls; presentation RED has 13 failures/
10 controls. The first implementation attempt stopped before schema/data edits;
its misleadingly named core-green is still RED and retained. Ajv strictRequired
then exposed a malformed conditional; the schema was fixed without suppressing
strictness. Final types/lint caught widened JSON/readonly test typing and test
assertion/template-expression issues; corrected without suppressions. All
original scripts/logs/receipts remain unmodified. The production source did not
change after its build/browser checks; only test typing/style was corrected.

[Five-axis author review](fixtures/sacrifice/author-review.json) has no blocking
source finding in correctness/readability/architecture/security/bounded execution.
This is self-review, not independent approval. Whole-class/shipping evidence
remains INCOMPLETE until independent review/QA and earned build/balance acceptance.

## Inventory and retention

Only Sacrifice changes; all 213 IDs/order remain. Inventory now has 118 unverified,
93 bounded-functional, one engine-only and one review-needed. The other six
unverified Paladin actives remain open. All earlier class/build/pacing/endgame
and full-v1 obligations remain.

The genuine save is unchanged: L33/XP149261, next Normal 402/Nightmare 0,
Ancients/Rite claimed, Baal uncleared. Decompressed SHA256:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign, push, PR, merge or deployment action occurred.

[Packet](fixtures/sacrifice/packet.json) and [raw archive](fixtures/sacrifice/raw.tar.gz)
retain 142 exact raw files and 29 terminal receipts, byte-verified.
Only disposable build bytes are omitted, with a complete build hash map retained.
[Cleanup receipt](fixtures/sacrifice/cleanup.json) records 902 exact owned files
removed after all consumers finished; scratch absent, port 4483 closed, no cleanup
failures or remaining disposable paths. Umbrella
worktree/branch/goal remain active.
