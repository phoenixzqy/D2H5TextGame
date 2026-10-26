# D04 — Paid Inferno channel

Source `65be2984`. Local bounded functionality is verified; independent
acceptance and earned balance remain open. Root is the sole author/reviewer.
Contract: [Inferno channel](../decisions/D04-inferno-channel-v1.md).
Defect: [BUG239](../../../production/bugs/BUG-239-inferno-is-an-instant-attack.md).

## Behavior

Inferno previously dealt instantaneous damage, permitting ordinary attacks and
another payment between supposed stream pulses. It now uses the existing paid
periodic scheduler with explicit channel metadata: one10MP payment, an immediate
pulse and later pulses at+1000/+2000ms, half-open3s expiry and ordinary1s cooldown.
Caster opportunities remain occupied while channeling, with no maintenance RNG,
basic attack, other cast or extra payment. Normal action cadence keeps progressing;
expiry/interruption grants no bonus action.

Each pulse reselects the densest existing cone-2 footprint: one anchor cell and
three cells in the next row. Each recipient uses ordinary seeded hit/base/crit,
Fire mastery/resistance, Defense, Burn and death settlement. Level6/ranks1–20,
35–55 base/+4 per rank,10% Burn and other authored coefficients remain unchanged.
The3s/1s timing and cone adaptation are provisional author tuning.

Real Stun/Freeze/Paralyze/Howl cancels at onset, including controls shorter than
the pulse interval and same-time pulse ties. Ordinary Concentration protection
applies to Stun only. Nonblocking damage/Chill/Blind and resisted control leave
the stream active. Existing independent field spells keep their earlier behavior.

Strict JSON/registry and native learned authority govern payment. Copied paid
rank/source/clocks retain phase through real native waves despite positive
reallocation/priority removal; unlearning/wrong-class invalidation strips carry.
There is no wave-zero pulse replay. Fresh/imported/reopened runs start unpaid;
save version22 is unchanged. Localized current/next/MAX details and positive
combat chips expose the actual timing, occupied actions and cancellation rules.

## Verification

| Check | Result |
| --- | --- |
| New regressions |95 across five files:26 engine/54 causal/5 native/8 preview/2 chip |
| Final focused compatibility |541 passed /10 files; real loader separately347 /3 |
| Final engine |8194 passed /306 files;156.327s process |
| Quiet full unit suite |16466 passed /743 files; two existing skips;653.18s Vitest /654.911s process |
| Typecheck / repository lint / explicit browser-file lint |PASS |
| Production build / actual precache guard / five-chunk debug-bridge scan |PASS |
| Production browser |4/4; en/zh-CN × desktop/mobile, retries0 |

The original strengthened native RED retains two failing tests and frozen test
SHA256 `b4aba03aa362eff787d4514658be0c1f6e68377a85ba3f060bd8fe77b62f77f6`.
Its initial cancellation assertion passed vacuously because no paid channel had
started; the strengthened version requires actual paid state before removal.
Final tests cover ranks1/2/20 with an independent seeded oracle, occupied turns,
exact payment/expiry/recast, cone recipients/reselection, source death, blocking
versus nonblocking/resisted controls, Concentration, immutable inputs and
recorded/unrecorded/repeated/playback equality. Native tests cover actual wave
rank/phase/resource carry, issued-recording immutability, invalidation and fresh
import. Only storage I/O is replaced in the native import test.

Original failures remain separate from passes. Corrections include strict-Ajv
nested object typing, the exact cone identity whitelist, a seed that actually
lands the declared enemy control, TypeScript union narrowing/exact optional
fixtures, and typed status assertions replacing unsafe asymmetric-matcher any.
The first browser invocation's anchored grep discovered no tests; the corrected
grep executed all four cases. No timeout, worker, assertion or discovery setting
was relaxed. BUG180/237 and existing test/build/performance budgets remain open.

## Browser evidence and limits

Public creation/import/equip/allocation/Catacombs entry/playback/Flee/Save and
fresh-page Continue use the production bundle without a debug bridge. Each case
records one Inferno cast, six hero Fire hit lines, a positive chip and10MP debit;
more than four hits establishes a later pulse beyond the maximum cone capacity.
Eight exact six-domain save pairs and four actual service-worker offline
Continues pass.20geometry checks cover five sizes; allocation controls are at
least44px and the page has no horizontal overflow.

All eight screenshots were individually inspected. Desktop descriptions/chips
are readable, with lower preview rows clipped by the capture. Mobile fixed
header/nav overlap preview edges and part of the combat chip. DOM assertions
establish allocation/chip state; these captures do not approve general UX/a11y.
Synthetic imported gear/resources/rank prove mechanics, not earned builds,
campaign progress, pacing or balance.

## Integrity, credit and retention

All2230 frozen source/config/test/contract paths match their committed blobs;
all761 production build files match recorded hashes. The sole post-build change
is the typed test assertion correction; production source stayed exact. Inferno
is the only changed Sorceress data object; the other29 raw objects are exact.
Only one inventory row changes:144bounded-functional/67unverified/one
engine-only/one review-needed, Sorceress28/30. Other212 raw CSV rows, all213 IDs,
ordering and historical census/risk fields remain exact. Hydra is unverified;
Cold Mastery remains review-needed.

The retained genuine Ancients401 save remains exact after decompression:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
L33/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared is unchanged.
C0/C1 retain narrow acceptance; C2 is underway. C3/C4/fullG0–G7, all-class earned
builds,30–50hour pacing/economy/endgame and full privatev1 remain unfinished.
No genuine campaign or remote action occurred; umbrella goal/worktree stay active.

[Terminal results](fixtures/inferno/terminal-results.json),
[browser audit](fixtures/inferno/browser-audit.json),
[source identity](fixtures/inferno/source-delivered.json),
[integrity](fixtures/inferno/integrity-delivered.json),
[inventory audit](fixtures/inferno/inventory-audit.json),
[author review](fixtures/inferno/author-review.json) and
[packet](fixtures/inferno/packet.json) retain the bounded conclusions and limits.

Required raw logs/reports, original failures, frozen test, source/build manifests
and screenshots are retained in this local
[diagnostic archive](/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-inferno-retained-bapgcoob.tar.xz):
131 direct members,3676588bytes, SHA256
`eb758ade6abdd4f4e3df08c1f5989866eecf95f2e0e4385f08bb61222e436eee`.
Every member was byte-verified. Root removes this exact archive after original
failure diagnosis and all full-v1 evidence consumers finish.
[Retention](fixtures/inferno/retention.json) records its ownership.

[Cleanup](fixtures/inferno/cleanup.json) removed893 exact task-owned files,
including761 disposable build files and task bytecode. All438 observed process
identities and two recorded browser profiles are absent; port4518 is closed;
scratch is absent, remaining[]/failures[]. Shared caches/tools, source/history,
genuine save and umbrella worktree/branch/claim are preserved.
