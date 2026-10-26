# D04 — Telekinesis control repair

Source commit `431f453f468bc465ce9fca946e006ee9cd7c5a35`; author contract
[D04 Telekinesis](../decisions/D04-telekinesis-v1.md),
[BUG236](../../../production/bugs/BUG-236-telekinesis-control-is-inert.md).
Root sole writer/reviewer. Independent design/QA and earned balance remain open;
full private-v1/C0–C4/G0–G7 scope is unchanged.

## Behavior

The actual JSON previously paid for an unconsumed Knockback marker. Replace it
with the shared damage-free single-enemy Stun:1s ordinary/0.5s boss, finite
half-open expiry and canonical refresh, without moving units. No hit/dodge roll,
damage, remote-object interaction or passive Arcane bonus is promised. Remove
the unused bonus/tag; keep unlock6/cap20, no prerequisites, base7MP/CD2 and
existing rank reductions. Current native cadence uses the existing decimal
rounding: rank1=7MP/2s, rank2=7MP/1.9s, rank20=5MP/1s.

The existing adapter/debuff/status/scheduler supplies the effect; no new combat
runtime branch, save field, version, dependency or reward grant. Descriptions
and ordinary/boss previews in both locales state the actual effect/payment and
next-wave allocation behavior. Teleport/Energy Shield prerequisites and other
skills remain intact; exactly one Sorceress data row changed.

## Verification

| Check | Result |
| --- | --- |
| New regressions |40 cases across four files |
| Initial focused |52 passed /6files, before causal-control correction |
| Corrected focused |40 passed /4files; strengthened paired controls |
| Engine |8106 passed /303files;230.12s |
| Quiet full delivery, including corrected comparator |16276 passed /734files; two existing skipped tests;1035.57s |
| Retained first full |16275 passed /one BUG180 import timeout /two existing skips;733 passing files/one failing;1290.77s |
| Unchanged isolated import diagnostic |13/13;13.73s |
| Types, repository lint, changed-file lint and explicit browser lint |PASS |
| Production build, actual offline precache and five-chunk bridge scan |PASS |
| Final-source quiet production browser |4/4; en/zh-CN × desktop/mobile, retries0 |

Native rank1/2/20 × seeds7/19/41/97 × trash/boss/chapter-boss pairs pay once,
cause no damage/movement, skip the enemy's2000ms action and resume at4000ms.
Stun expires at2700ms ordinary/2200ms boss after a1700ms cast. Actual/control
recordings, exact repeated input and immutable source distinguish a real
interruption from a renamed marker. Other cases cover single living hostile
selection, refresh/exact expiry, mana/cooldown refusal, native class/unlock/
allocation/aliases, repeated cast cadence/payment and terminal resource/status
playback. Native integration freezes an issued wave, updates the next wave,
and exactly roundtrips learned rank/priority without persistent active Stun.

The original native RED has three failed parameterized tests/108 failed control
assertions, but its empty-effects comparator was flawed: the scheduler treats an
empty skill as unavailable, so that side used Attack. Its paired payment claim
was unsupported; preserve the log as superseded evidence. The corrected comparator
retains the original inert Knockback and explicitly asserts identical hero cast
and payment events, no hero damage, and exact enemy HP/position. All36 corrected
pairs prove the inert baseline first acts at2000ms and the repaired skill at4000ms;
all40 focused cases pass. The first full suite started before this test-only correction
and does not include its strengthened assertions. It records the pre-existing
BUG180 inventory-first5000ms import timeout; no gameplay assertion failure is
established. The unchanged13-case file passes alone. The subsequent quiet full
includes the strengthened comparator; final types and file lint pass separately.
Product code and the final browser build remain exact. Schema/display RED has
16failed/two passing cases, UI RED eight failures. Preserve original logs.
An early cooldown oracle used mathematical half-up rounding rather than the
existing `toFixed(1)` rule; corrected to independent literal rank values before
accepting GREEN. Initial types also exposed an optional preview guard and a
property absent from the narrowed test type; both were corrected, with original
errors retained. No skipped regressions, loosened assertions or golden reset.

## Browser, saves and limits

Public production creation/import/equip/allocation/map entry observes the actual
Telekinesis/Stun log and7MP debit. Diagnostic characters prove mechanics, not
an earned build. Final evidence includes eight exact six-domain online/offline
save pairs and four actual service-worker offline Continues. All20five-size
geometry checks pass; measured allocation controls are at least44px and the
page has no horizontal overflow.

Eight final-run screenshots are retained; four were inspected. Full-page skill
captures show the tree and a partial/off-screen detail panel after viewport
reset, so they do not prove text readability. Both locales' descriptions were
asserted through real DOM and current/next/MAX component tests. An additional
retained failed-trace allocation thumbnail shows panel placement, but is too
small to establish readability. No broad UX/a11y acceptance is claimed.

[BUG237](../../../production/bugs/BUG-237-browser-evidence-teardown-timeout.md)
remains open: the first final-source matrix passed two desktop cases, then the
mobile English case exceeded60s after all assertions had completed. The trace
has a9759.8ms gap between the final assertion and timeout context closure; its
cause is not established. Original report/trace/context remain retained. The
unchanged final-source four-case matrix passes with other task checks terminal;
timeout60s/retries0 and all mobile/offline assertions remain unchanged. The
pre-type-guard four-case pass is retained separately and is not final-source
acceptance. Existing build/art-manifest cache warnings and test-budget breaches
also remain open; no performance or shipping approval.

## Integrity, credit and retained artifacts

1477 frozen source/configuration/test/contract blobs match the delivered commit;
761 final build files remain exact through verification. Only Telekinesis earns
one local bounded functional credit:141bounded/70unverified/one engine-only/
one review-needed, Sorceress25/30. Other212CSV rows, all IDs/order and historical
census/risk columns remain exact. Cold Mastery is the remaining Sorceress
review-needed row; Teleport/Inferno/Enchant/Hydra remain unverified.

The genuine Ancients401 fixture remains byte-exact after decompression:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
L33/nextNormal402/Baal uncleared is unchanged. Independent/earned acceptance,
C2–C4/fullG0–G7, two earned builds/class, campaign pacing, economy and endgame
remain open. No remote publication or genuine campaign action.

[Packet](fixtures/telekinesis/packet.json),
[terminal results](fixtures/telekinesis/terminal-results.json),
[browser audit](fixtures/telekinesis/browser-audit.json),
[source identity](fixtures/telekinesis/source-delivered.json),
[author self-review](fixtures/telekinesis/author-review.json), and
[cleanup](fixtures/telekinesis/cleanup.json) retain exact final evidence and
limitations. Original raw logs/reports, failed trace ZIP, helper scripts,
source/build manifests and screenshot bytes are in the required local diagnostic
[archive](/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-telekinesis-retained-5n1g37xq.tar.xz), outside Git to avoid committing a large browser trace.
Root owns retention and removes that exact file after BUG180/BUG237 diagnostic
review and all evidence consumers finish. Only
byte-identical unpacked ZIP members are represented by the deduplication map.
Archive50325492bytes/SHA256`ceceb506681965e244e4ff85111f4ae70302e7d710a65ab972a2ddb4bf497418`,68direct members
and1043verified ZIP duplicates. Cleanup verified1872exact
scratch files removed, observed processes absent,4516closed and no remaining
paths/failures. Shared caches and the active umbrella worktree are preserved.
