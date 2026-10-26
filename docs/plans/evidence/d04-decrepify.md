# D04 — Decrepify cadence and outgoing damage

2026-10-26. BUG244, runtime`6a099c49`, presentation/native/public`ba6fa8e0`.
Root author review only; one bounded local functional contract is verified.
Independent design/QA, earned builds and balance remain open. [Contract](../decisions/D04-decrepify-v1.md),
[bug and original reproduction](../../../production/bugs/BUG-244-apply-decrepify-cadence-and-damage.md).

## Result and design authority

Previously the native learned skill paid mana and applied an inert marker with
an accidental one-second fallback. Neither the scheduler nor direct damage
consumed it. The authored JSON now supplies a finite three-second curse, 50%
effective AttackSpeed reduction and 33% outgoing direct-damage reduction.
Three seconds is an explicit provisional author choice matching Amplify's
existing interval, not recovered prior Decrepify authority. Independent design
and earned balance acceptance remain open.

Unlock24, Terror/transitive prerequisites, cap20, all-living-hostile scope,
20MP minus0.3/rank rounded to14MP at20, and3s cooldown are unchanged. An actual
eligible payment copies a finite packet to living hostiles without a hit or
proc RNG draw. Refresh replaces source/potency/interval without stacking.
Boss tiers use the same potency and duration. Cleansing shortens once; source
death does not erase a paid curse. Bare, future, expired or malformed packets
grant neither effect. Save22 and dependencies are unchanged.

AttackSpeed reduction follows bonuses/enrage, multiplies with Chill and
precedes the existing floor/clamps. The actual formula
`clamp(2500-floor(speed)*8,400,2000)` means 50% less AttackSpeed does not generally
double attack intervals. Pending action phase survives onset, expiry and
unchanged refresh. Base stats remain unchanged. Direct damage multiplies
by0.67 before resistance/flat mitigation and multiplicatively with Battle Cry.
Existing periodic damage, reflection and healing receive no extra reduction;
new hit-derived DoT snapshots the reduced hit with the existing integer floor.

## Reproduction and automated evidence

Original actual-native RED:2failed/5passed,7.198s,exit1. Ranks1/20 both paid but
retained a bare400–1400ms marker,500ms enemy cadence and700HP loss. With seed1,
native casterAS263 acts400ms; targetAS250's period changes500→1500ms during
400–3400. Fixed actions are700,2200,3500,4000,4500; hit outcomes
67,67,miss,100,100 cause334HP loss. These assert actual events, resources and
final HP against uncursed controls, not merely marker presence.

The93new cases comprise47definition/schema/status,16consumer/composition,
14native causal,6pure preview,8bilingual component and2native lifecycle/import
tests. They cover complete authored validation/copying, invalid adapter inputs,
finite/fractional/rebased intervals, refresh/Cleansing, speed floor/clamps,
enrage/Chill, typed pre-mitigation damage, Battle Cry, existing/new DoT,
reflection/healing, no live target, native ownership/resources, recipient tiers,
input purity and recorded/unrecorded replay. Thin table assertions in isolated
validator cases are paired with real consumer outcomes and native controls.

The native lifecycle tests legally allocate transitive prerequisites, freeze
the current recording across learning/upgrading, refresh rank/stats next wave
without refilling absolute HP/MP, and roundtrip learned configuration through
snapshot/import while clearing transient combat. Only persistence I/O is
mocked. Synthetic level/pools/equipment do not establish earned builds.

The initial broad engine run caught two existing registry negatives: incomplete
Amplify-shaped metadata could grant Decrepify capability. The adapter now
requires the complete validated authored contract; original expectations remain
unchanged. Two new fixture assumptions were corrected:3000.25ms exceeds the
paid3000ms cap, and the existing DoT snapshot floors67*.1 to6. Browser review
removed the spell name from the hero name and requires actual localized cast
text plus a separate enemy chip. Initial browser launch failed because a
task-local cache moved browser lookup; the existing installed browser was reused
explicitly. Lint corrections use equivalent local syntax and guards without
suppressions. [Corrections](fixtures/decrepify/fixture-corrections.json).

## Final production browser proof and visual limits

Four final cases pass, zero retries,226.748s: en/zh-CN ×desktop1280×800 and
mobile360×640. Real controls create a character, import an explicitly synthetic
L30 fixture with prerequisites, equip, allocate19→20, cast, observe the hostile
curse chip, complete Blood Moor, Save, close the page, and Continue online and
with network disabled through the actual production service worker. No bridge
is present. Browser numeric cadence/damage is not measured; native/engine
tests provide that proof.

The report was decoded separately from the spec: four actual localized casts
and enemy chips, eight exact six-domain save pairs, four actual SW offline
Continues,20geometry checks across five viewport sizes and48px allocation
controls, with no page/console errors. [Metrics](fixtures/decrepify/browser-metrics.json).

All eight final PNGs were inspected. Desktop preview panels are complete and
readable in both locales. Mobile descriptions/current numbers are readable,
but the fixed header clips the title/MAX control and lower content falls outside
the image or behind navigation. Final-wave battlefield captures do not show a
readable victory summary: desktop enemy cards extend below the image; mobile
enemies/victory/log are below the viewport. English mobile wave text is
ellipsized and navigation has missing-glyph boxes in this environment. Explicit
DOM assertions prove victory/casting/chips. Images establish neither numerical
consequences nor whole-screen UX/a11y acceptance.
[Visual review](fixtures/decrepify/visual-review.json).

An earlier separate four-case run also passed216.967s. Six lint syntax changes
altered four emitted paths, so the final official build was frozen and all
browser cases rerun against its exact artifact. Initial artifacts and the
build-difference manifest are retained; the final run is authoritative here.

## Terminal checks and source integrity

[All27 terminal receipts](fixtures/decrepify/checks.json) retain original failures
and corrected runs. Final full:17283passed/783files/two existing skips,exit0,
715.187s wall time (Vitest reports713.58s). Engine8553/320PASS149.108s; final
typesPASS91.73s; full lint/purityPASS209.758s; final causal14/1PASS12.028s and its
lintPASS7.438s. Corrected focused162/7PASS13.396s precedes the last two negative
cases; final full includes all93new cases. Existing diagnostic warnings,
including React act warnings, remain in the raw full log.

Official production build/bridgePASS16.078s, sixJS chunks scanned. The actual
offline verifier passes756unique URLs with all required assets and missing[].
All762final emitted files are frozen. Existing chunk-size/Browserslist and
optional2.57MB art-manifest precache warnings remain; the2MiB Workbox limit was
not relaxed. Test-loop budgets are exceeded; no runtime performance acceptance
is inferred. All1552source/test/config and762build hashes were reverified after
full termination, with genuine compressed/raw bytes exact. [Post-full integrity](fixtures/decrepify/post-full-integrity.json).
All1552actual committed blobs at`ba6fa8e0` match the frozen tested bytes.
[Committed integrity](fixtures/decrepify/committed-source-integrity.json).
Exactly one inventory row changes; the other212raw rows, header and all213IDs
and their order remain exact. Inventory154bounded/57unverified/one engine-only/
one review-needed; Necromancer12/32. No independent or earned acceptance is
credited. [Inventory audit](fixtures/decrepify/inventory-integrity.json).

## Remaining acceptance, retention and cleanup

Genuine compressed/decompressed hashes remain
3bbae6c0499844e7423574124326c65c616f8f3912a760aa913ea9eab410022c /
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577:
L33,XP149261,nextNormal402,Nightmare0,Ancients/Rite claimed,Baal uncleared.
No genuine campaign/replay or remote action. Independent review/QA, earned
builds,30–50hour pacing/economy/endgame,C2–C4/fullG0–G7 and privatev1 remain open.
This is author evidence, not independent signoff; the full evidence-review
verdict remains INCOMPLETE for those open acceptances.

Root retains the decisive raw packet at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-decrepify-ncbcsyhx-retained.tar.xz,
with sibling retention/deletion-manifest/cleanup JSON, through BUG244/full-v1
evidence consumers, then removes those exact retained paths. All validation
handles are terminal and committed bytes are verified. All107regular archive members were byte-verified;981exact task files and38
directories were removed. All27recorded process identities are absent, no task
consumers remain, port4525 is closed and remaining[]/failures[]. Scratch and
task-owned dist are absent. [Cleanup and exact retained paths](fixtures/decrepify/cleanup.json).
Archive SHA256:a64917f4fe78d00a0cfa2ccf76087e8da3f895bf4e7f76cd4c137250ba2243f8.
The umbrella worktree remains claimed for the continuing full-v1 goal.
