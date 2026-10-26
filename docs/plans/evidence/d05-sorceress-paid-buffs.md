# D05 — Paid Teleport and weapon Enchant

Engine commit `6d994bd2`; native/UI final source `7957c3ba`.
Local bounded functionality is verified; independent acceptance remains open.
Contract: [D05 paid buffs](../decisions/D05-sorceress-paid-buffs-v1.md).
Defect: [BUG238](../../../production/bugs/BUG-238-sorceress-paid-buffs-are-inert.md).
Root is the sole author/reviewer. Full private-v1 scope remains unchanged.

## Behavior

The two paid buffs previously set permanent markers with no combat consumer.
Teleport now grants one second of magical dodge, one percentage point per paid
rank, without movement. Enchant lasts ten seconds and captures normal Attack
and rank at payment. Each later hostile direct Physical hit adds Fire base
equal to captured Attack × paid rank × 0.02. These durations and the Enchant
coefficient interpretation remain provisional author tuning.

Enchant shares the carrier's hit/base/critical decision and draws no extra RNG.
Its Fire component uses normal mastery, combo, resistance, Defense and personal
absorption, without carrier penetration, status or recovery metadata. It adds
no Burn. Carrier statuses and combined death/reward closure settle once.
Reflection uses actual Physical HP removed, excluding the added Fire.
Nonphysical hits, periodic spells, DoT, aura pulses and armor reactions receive
no weapon Fire. Teleport leaves Physical/thorns rolls and existing DoT unchanged.

Both effects use finite half-open source-bound status payloads. They coexist,
prevent active recasts and retain paid potency/remaining duration across waves
despite later allocation or Attack changes. Fresh native allocations govern
future casts. Old markers confer no power or recast authority. Native eligible
Sorceress ownership, prerequisites and exact registered payment/effect shape
are required. Fresh/imported/reopened runs start unpaid; save version 22 stays.
Existing rank reductions remain authoritative: rank 20 Teleport 16MP/2s,
Enchant 19MP/3s. Bilingual current/next/MAX rows and positive chips expose the
actual effects, costs, timing and next-wave allocation policy.

## Verification

| Check | Result |
| --- | --- |
| New focused regressions |95 tests across six files |
| Final engine |8168 passed /305 files; 141.23s process |
| Final quiet full unit suite |16371 passed /740 files; two existing skips; 682.23s Vitest /684.04s process |
| Final typecheck |PASS |
| Repository lint and explicit browser-file lint |PASS |
| Production build / actual precache guard / five-chunk bridge scan |PASS |
| Final production browser |8/8; two buffs × two locales × desktop/mobile, retries0 |

The causal native RED retains five failing tests. Paired controls preserve cast,
payment and Physical rolls while removing the paid consumers. Regressions prove
ranks 1/2/20 potency/payment, exact expiry, shared crit/RNG/misses, mitigation,
carrier status/death/reflection boundaries, recast/refusal/coexistence, strict
schema/authority, copied immutable payloads and repeated recorded/unrecorded
results. Native tests cover frozen issued recordings, real next-wave rebasing,
allocation/Attack changes, import and fresh unpaid runs. Storage I/O alone is
replaced in the native import cases; real validation/import/projection execute.

Original failures remain separate from final passes. Fixture corrections concern
presentation-delay fields, native eligibility in periodic/armor cases, a seed
that actually lands the counterattack, required diagnostic socket fields, and
TypeScript union narrowing. The initial browser incorrectly expected a 17-character
name after the public 16-character limit truncated it; the actual hero Fire log
was already present. A shorter diagnostic name preserves the strict hero-specific
assertion. Explicit browser lint initially encountered ignored files, then found
three test style errors; `--no-ignore` checks the files and the errors are fixed.
No timeout, worker limit, assertion, discovery scope or gameplay rule was relaxed.

## Browser evidence and limits

Public creation/import/equip/allocation/map entry proves real payment, positive
status chips and hero-specific Enchant Fire. The final attachment audit confirms
16 exact six-domain save pairs (eight online/eight offline), eight actual
service-worker offline fresh-page Continues and 40 five-size geometry checks.
Allocation controls measure at least 44px; page overflow checks pass. Production
has no debug bridge. Synthetic imported resources and allocations prove mechanics,
not earned builds, campaign pacing or balance.

Six of 16 screenshots were individually inspected. Desktop detail panels are fully
readable. Mobile descriptions/current rows are readable, but fixed header/nav
overlap capture edges and part of the mobile combat chip. DOM assertions verify
allocation and chip state; these captures do not establish general UX/a11y
acceptance. Existing test-runtime/import-timeout and build/art-manifest warnings
remain open; this slice does not resolve BUG180/BUG237 or approve performance.

## Integrity, credit and outstanding work

1487 source/config/test/contract files are frozen. The production build contains
761 files; only test code changed after building. Every frozen Git blob matches
final source `7957c3ba`; all build hashes remain exact. Only Teleport and Enchant
change among the 30 raw Sorceress data objects; the other 28 remain byte-identical.

Exactly two skills receive bounded functional credit: 143 bounded-functional /
68 unverified /one engine-only /one review-needed; Sorceress 27/30. Other 211 CSV
rows remain byte-exact; all 213 IDs/order and historical census/risk columns are
unchanged. Inferno/Hydra remain unverified; Cold Mastery remains review-needed.
The authored timing/Enchant conversion, independent acceptance and earned balance
are still open. No whole-game completion or shipping approval follows.

The retained Ancients401 save remains exact after decompression:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
L33/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared is unchanged.
C0/C1 retain their narrow exits; C2 is underway, C3/C4/fullG0–G7, all-class earned
builds, 30–50 hour pacing, economy/endgame and independent acceptance remain open.
No genuine campaign or remote action belongs to this slice.

[Terminal results](fixtures/sorceress-paid-buffs/terminal-results.json),
[browser audit](fixtures/sorceress-paid-buffs/browser-audit.json),
[source identity](fixtures/sorceress-paid-buffs/source-delivered.json),
[committed integrity](fixtures/sorceress-paid-buffs/integrity-delivered.json),
[inventory audit](fixtures/sorceress-paid-buffs/inventory-audit.json) and
[author self-review](fixtures/sorceress-paid-buffs/author-review.json) retain final
checks and their limits. [Packet](fixtures/sorceress-paid-buffs/packet.json),
[retention](fixtures/sorceress-paid-buffs/retention.json) and
[cleanup](fixtures/sorceress-paid-buffs/cleanup.json) record the final handoff.

Required raw logs/reports, helpers, source/build manifests, screenshots and the
original failed browser trace are retained outside Git in this local
[diagnostic archive](/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-sorceress-buffs-retained-flbl4n5l.tar.xz).
The archive has 328 direct members and 965 verified byte-identical ZIP
references, 54945440 bytes, SHA256
`20a1d2ccf3cc41f80efd163e1238c518464b8e5f7161b84987031342b7cca8f3`.
Root owns this exact archive and removes it after original-failure diagnosis and
all full-v1 evidence consumers finish.

Cleanup removed 2055 exact task-owned files, including all 761 build files.
All 795 observed process identities and two recorded browser profiles are absent;
port 4517 is closed; scratch is absent, remaining[]/failures[]. Shared caches/tools,
source/history, the genuine save and umbrella worktree/branch/claim remain.
The first cleanup attempt stopped before deletion because its profile check
assumed `/tmp`; this runtime records profiles under its configured temporary
parent. [The correction](fixtures/sorceress-paid-buffs/cleanup-path-correction.json)
records the exact in-memory script patch and hashes. The archived original
script remains intact. The corrected cleanup verifies the recorded paths and
does not delete any profile.
