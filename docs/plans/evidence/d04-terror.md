# D04 — Terror finite fear

2026-10-26; BUG247/BUG248. Core `1b192510`, source-driven preview `27f4acc9`,
bilingual details `a5008fce`, native/public lifecycle `7f7149b7`.
Locally implemented and verified; exactly one bounded-functional credit.
Independent design/QA, earned builds and balance remain open.
[Contract](../decisions/D04-terror-v1.md),
[original combat bug](../../../production/bugs/BUG-247-apply-terror-fear.md),
[presentation regression](../../../production/bugs/BUG-248-render-terror-stat-section.md).

## Delivered behavior and authority

The original paid native Terror emitted an inert marker. Authored JSON now owns
1000ms fear and a 0.5 boss/chapter-boss multiplier. One actual cast pays 7MP and
applies copied finite control to every living hostile. Fear suppresses scheduled
actions and cancels existing channels. It adds no movement, damage, accuracy,
targeting or allegiance change. Refresh replaces without stacking; paid control
survives source absence. Start is inclusive and end exclusive; fractional/rebased
clocks and Cleansing are supported. Bare, future, expired, malformed, nonfinite,
overlong or wrong-identity packets confer no control. Concentration protects
Stun only, so it does not protect channels from Terror.

The 1000/500ms tuning is a provisional root-author choice based on the accepted
Howl precedent, not independent or earned balance approval. Required level12,
Weaken→Amplify prerequisites, ranks1–20, all-enemies targeting and native authority
remain. Existing combat and preview cooldown rounding to tenths is preserved:
ranks0/1/2 resolve3s, ranks18/19 resolve2.1s and rank20 resolves2s. Save22 is unchanged.

## Causal proof and regression coverage

Original native seed1 RED: six failures/four controls, exit1,7.286s. Legal native
L30 rank1/20 casters act at400ms and pay7MP once; enemies ordinarily attack at
500ms intervals. Previously all six paid casts left700HP loss. Actual trash
fear now skips500/1000ms, resumes1500ms and leaves500HP loss; boss/chapter-boss
fear skips500ms, resumes1000ms and leaves600HP loss. Matched inert controls
preserve native eligibility, action, payment and cooldown. The original RED log
SHA256 is a995751d8e0c5e52a9825645b97ed9e87813db2b9e20f0387f4cb6af0e795ab0.

Actual paid Inferno starts900ms; paid Terror at1300ms cancels its1900ms pulse,
including with Concentration. A paid bare-marker control retains the pulse.
Inputs remain pure; repeated, recorded, unrecorded and final playback agree.

77 new regressions cover the bounded contract:

| Scope | Authoritative test |
| --- | --- |
| Complete/invalid authoring, copied intervals, tiers, refresh, source absence, boundaries, Cleansing and fractional/rebased clocks (46) | `src/engine/combat/terror.test.ts` |
| Actual native rank1/20 action/HP consequence and authority/resource controls (10) | `src/stores/necromancer-terror.causal.test.ts` |
| Actual paid channel interruption, Concentration, bare-marker control and playback (3) | `src/stores/necromancer-terror-channel.test.ts` |
| Supplied source timing, invalid metadata, ranks/current/next/MAX and rounded cooldown (8) | `src/engine/skills/displayStats.terror.test.ts` |
| Both locales, truthful fear/boss rows, no placeholders or player mutation (8) | `src/features/skills/SkillsScreen.terror.test.tsx` |
| Native allocation, frozen recording, next-wave rank/pools, actual snapshot/import (2) | `src/stores/necromancer-terror-native.test.ts` |

Native allocation retains the current recording and absolute pools, then refreshes
rank on the next wave. Actual save/import retains learned configuration and clears
transient combat. Only persistence I/O is mocked. These synthetic fixtures do not
establish earned builds or balance.

The first preview draft incorrectly assumed unrounded2.05s at cap. Inspection of
both existing resolvers proved their longstanding tenths rounding; corrected
explicit expectations retain the actual2s cap without changing cooldown math.
Original preview RED15failed/3passed,7.377s and corrected-oracle RED15failed/3passed,
7.549s are retained. BUG248 records a separate draft error: `StatSection` referenced
unavailable `skill`, making all eight component renders throw. The repair uses
available `stats.statuses.includes('terror') && stats.control`; no new prop,
fallback, suppression or disabled test. All18 presentation/native cases pass7.5s.
An initial lint finding was repaired with an explicit undefined check; original
failure retained. No skip, threshold or security policy was weakened.

## Production browser and visual proof

`tests/pwa/terror.spec.ts` and `terror.config.ts` pass four production cases,
exit0,228.374s: en/zh-CN ×desktop/mobile, one worker, retries0, no skipped/flaky
cases or page/console errors. Synthetic imported L30/rank19 characters use public
keyboard Enter to allocate19→20, inspect MAX/details, equip and actually cast.
Four localized casts and hostile chips, eight exact six-domain save pairs and
four actual service-worker offline Continues pass. No production test bridge.
Numeric consequences are established by native tests, not cast logs alone.

Twenty geometry samples cover360×640,412×915,640×360,1280×800 and1920×1080.
No document horizontal overflow; allocation height/width≥44px. All16original
PNGs were individually inspected and hash/dimension checked; versioned copies
are in [browser-images](fixtures/terror/browser-images).
Desktop stats/panel captures show complete bilingual details. Mobile title/stats
viewport captures are identical: Current was partly visible, so the helper did
not expose lower fear rows. Mobile element captures show fear/boss rows with
fixed-navigation intrusion and cropped requirements. Victory viewports show all
three return/continue controls; the heading is above viewport and separately
asserted. These are explicit capture limits, not complete mobile/UX/a11y approval.
The five-size geometry check is not a full five-size visual/safe-area audit.

The first browser invocation stopped before Chromium launch because task-local
XDG cache hid the installed browser. The retained exit1/2.923s failure was resolved
by selecting existing `/home/felixzhao/.cache/ms-playwright`; no install or product
change. No shared browser cache was deleted.

## Final validation and integrity

| Check | Final result |
| --- | --- |
| Full unit suite | 17,590passed /800files /two existing skips; exit0,689.033s |
| Engine | 8,745passed /327files;148.856s |
| Types | PASS128.599s |
| Lint and purity | PASS210.528s |
| Official production build and test-bridge shake guard | PASS16.475s |
| Actual precache checker | PASS756URLs, no missing required assets |
| Production browser | 4/4PASS228.374s |

The package has no `validate:data` script. Its actual loader test passes292cases;
the final full suite includes it. All1594frozen source files match committed HEAD
blobs at7f7149b7; all762build files matched before cleanup. Closeout reverified all
1594current files and Git blobs. Full log SHA256:
cd94fadc83b9e610f2ef7771904fc06b8ef5b3213b356611c66bf9d9c1159412.
Existing large-chunk, Browserslist and art-manifest warnings remain; test budgets
are exceeded. No runtime performance or release acceptance is claimed.

The protected earned save remains compressed SHA256
3bbae6c0499844e7423574124326c65c616f8f3912a760aa913ea9eab410022c,
raw SHA256 c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577.
L33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared.
No genuine campaign/replay, push, PR, merge or deployment occurred.

## Disposition, retention and cleanup

Only Terror gains `bounded-functional;independent-acceptance-open` credit:
159bounded/52unverified/one engine-only/one review-needed; Necromancer17/32.
The header,213IDs/order and212other raw CSV rows are byte-exact; the
[inventory audit](fixtures/terror/inventory-integrity.json) records before/after.
The old missing-consumer risk becomes independent-design-qa-and-earned-balance-open.
Root author review is not independent approval. C2–C4/fullG0–G7, all-class earned
builds,30–50active-hour pacing, economy/endgame and full privatev1 remain open.

[Manifest](fixtures/terror/manifest.json) hashes32selected evidence attachments,
including16PNGs and retention/cleanup receipts. All119raw archive members and23
terminal receipts were byte-verified before cleanup and again at closeout.
The archive retains original failures, raw reports/save pairs and source/build
freezes; its historical author review correctly says credit was pending then.
This final record and inventory audit establish the later credit.

[Cleanup](fixtures/terror/cleanup.json) verifies992exact task files/32directories
removed;54recorded process identities absent, no readable task consumers,4531
closed, task root and disposable dist absent, remaining[]/failures[]. An optional
broader /proc audit could not read fd/cwd for five unrelated OS/service processes,
listed in the receipt. It is an audit visibility limit, not universal host fd
visibility. Its initial PermissionError caused no deletion. Shared caches/tools,
prior evidence, source/history and the umbrella worktree/claim remain intact.

Root retains these exact durable paths until BUG247/BUG248/full-v1 evidence
consumers finish; root will remove only these paths after no-reader verification:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-terror-7j9sws2f-retained.tar.xz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-terror-7j9sws2f-retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-terror-7j9sws2f-deletion-manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-terror-7j9sws2f-cleanup.json`

Archive SHA256 e8c6e70ce32893baa032cb1a4310e9a4b1b897a0f34ad871b31f696c59090238.
Versioned evidence is a requested deliverable and remains in Git. The former
`d2h5-terror-7j9sws2f` task root no longer exists. Continue the full goal in the
same claimed worktree; this skill closeout is not full-v1 completion or a pause.
