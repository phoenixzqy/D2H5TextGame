# D04 — Weaken outgoing direct damage

2026-10-26. BUG245, runtime`cef44c4c`, presentation/native/public`2a71b623`.
One bounded local functional contract is verified. Root author evidence only;
independent design/QA and earned balance remain open. [Contract](../decisions/D04-weaken-v1.md),
[bug and original reproduction](../../../production/bugs/BUG-245-apply-weaken-outgoing-damage.md).

## Result and design authority

The original native learned skill paid mana but applied an inert400–1400ms
marker. Actual damage matched an uncursed control. Authored JSON now supplies
a3000ms finite curse and33% outgoing direct-damage reduction. Both numbers are
explicit provisional root-author choices; the prior copy supplied neither.
Independent design and earned balance acceptance remain open.

Unlock6, Amplify Damage prerequisite, cap20, all-living-hostile scope,
6MP minus0.2/rank rounded to2MP at20, and3s cooldown are unchanged. An actual
eligible payment copies one finite packet to each living hostile, including
boss tiers, without hit/damage/proc RNG. Refresh replaces source/potency/interval
without stacking. Cleansing shortens once; source absence does not cancel the
paid curse. Bare, future, expired or malformed packets confer no reduction.
Native ownership/resources, save22, dependencies and CI remain unchanged.

Direct damage multiplies by0.67 before resistance and flat mitigation, and
multiplicatively with Decrepify and Battle Cry. Base stats, AttackSpeed, action
cadence and ordinary hit/critical rolls remain unchanged. Existing periodic
rates, reflection and healing get no extra reduction; a new hit-derived DoT
snapshots the reduced landed damage with the existing integer-rate floor.

## Causal and automated evidence

Original actual-native RED:2failed/6passed,exit1,7.147s. Ranks1/20 both paid
but retained ordinary100damage hits and700HP loss. Seed1: native casterAS263
acts400ms and pays6/2MP; enemyAS250 retains actions at500,1000,1500,2000,2500,
3000,3500,4000,4500. The repaired curse spans400–3400; outcomes are
67,67,miss,67,67,miss,100,100,100, causing568HP loss. Tests assert actual
events, resource debit and final HP against unchanged uncursed controls.

The92new cases comprise44definition/schema/status,18consumer/composition,
13native causal,7pure preview,8bilingual component and2native lifecycle/import
tests. They cover strict authored validation, copied tuning, finite/fractional/
rebased timing, exact onset/expiry, refresh/Cleansing/source absence, seven
direct damage types, double/triple reduction composition, existing/new DoT,
reflection/healing, native ownership/resources/recipients, no live target,
input purity and recorded/unrecorded replay. Validator table cases are paired
with real damage/HP consequences and negative native controls.

Native lifecycle tests legally allocate transitive prerequisites, freeze the
current recording across learning/upgrading, refresh rank/stats next wave
without refilling absolute HP/MP, and roundtrip learned configuration through
snapshot/import while clearing transient combat. Only persistence I/O is
mocked. Synthetic levels, pools and equipment do not establish earned builds.

Retained fixture corrections use the actual1000ms Battle Cry interval and
Physical resistance for Thorns. An unrelated JSON formatting change was
restored. Typecheck/lint caught one new test's missing union narrowing; equivalent
conditional flatMap fixes typing without changing events or expectations.
Original failures and corrected runs remain in the raw packet.

## Production browser and visual evidence

Four cases pass with zero retries,204.296s: en/zh-CN ×desktop1280×800 and
mobile360×640. Public controls create a character, import a syntheticL30
fixture with prerequisites, equip, allocate19→20, cast, show the hostile curse
chip, win Blood Moor, Save, close the page and Continue online and offline
through the actual production service worker. No bridge is present. Native/
engine tests establish numeric damage; the browser does not measure it.

A separate report decoder verifies four actual localized casts/chips,
eight exact six-domain save pairs, four actual service-worker offline Continues,
20geometry checks across five sizes and48px allocation controls. Page and
console error lists are empty. [Metrics](fixtures/weaken/browser-metrics.json) and
[visual review](fixtures/weaken/visual-review.json) retain the exact results.

All eight PNGs were inspected. Desktop previews are complete and readable in
both locales. Mobile descriptions/current numbers are readable, but the fixed
header clips the skill title/MAX control and lower requirements fall outside
the capture or behind navigation. Missing-glyph navigation icons persist.
All four victory element captures show clipped loot/toolbar content and black
regions, without a readable victory heading or return control. Actual victory
visibility and return-to-town are asserted by the browser. These images do not
prove complete mobile UX, accessibility or numeric consequences.

## Validation and integrity

Corrected focused163/7PASS13.299s includes92new and71existing registry cases.
Engine8622/323PASS139.831s; typesPASS113.829s; lint/purityPASS188.767s.
Official build/bridgePASS16.411s with sixJS chunks scanned. The actual precache
verifier passes756unique URLs, all required assets present and missing[].
All1561source/test/config and762emitted build paths are frozen. Existing chunk
size/Browserslist and optional2.57MB art-manifest precache warnings remain;
the Workbox limit is unchanged. Test-loop budgets are exceeded; runtime
performance acceptance is not established. Full unit:17375passed/789files/
two existing skips,exit0,677.78s wall time (Vitest676.35s). All15terminal
receipts retain original failures and corrected runs. Existing diagnostic
warnings, including React act warnings, remain in the raw full log.
[Checks](fixtures/weaken/checks.json).

Post-full source/build and genuine hashes are exact. All1561actual HEAD blobs
at`2a71b623` match the frozen tested source bytes.
[Post-full integrity](fixtures/weaken/post-full-integrity.json),
[committed integrity](fixtures/weaken/committed-source-integrity.json).

Only Weaken's authored row and descriptions differ; the other31Necromancer
rows and other Weaken fields are exact. Exactly Weaken receives one bounded
credit:155bounded/56unverified/one engine-only/one review-needed; Necromancer
13/32. The header, other212raw rows and all213IDs/order remain exact. No
independent or earned acceptance is credited.
[Inventory audit](fixtures/weaken/inventory-integrity.json),
[data audit](fixtures/weaken/pre-full-integrity.json),
[fixture corrections](fixtures/weaken/fixture-corrections.json),
[author review](fixtures/weaken/author-review.json).

## Remaining acceptance and retention

Genuine compressed/raw hashes remain
3bbae6c0499844e7423574124326c65c616f8f3912a760aa913ea9eab410022c /
c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577:
L33,XP149261,nextNormal402,Nightmare0,Ancients/Rite claimed,Baal uncleared.
No genuine campaign/replay or remote action. Independent review/QA, earned
builds,30–50hour pacing/economy/endgame,C2–C4/fullG0–G7 and privatev1 remain open.
The full evidence-review verdict is INCOMPLETE for those open acceptances.

Root retains the raw packet at
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-weaken-3glz5mlx-retained.tar.xz,
with sibling retention/deletion-manifest/cleanup JSON, through BUG245/full-v1
evidence consumers, then removes those exact retained paths. All60archive
members were byte-verified;933exact task files and28directories were removed.
All15recorded process identities are absent; no task consumers remain,4527is
closed and remaining[]/failures[]. Scratch and task-owned dist are absent.
[Cleanup and exact retained paths](fixtures/weaken/cleanup.json).
Archive SHA256:f4608767019a3b8d0885d19ed91dd2a764dbd24021378c739001d5e5058dd7b7.
The umbrella worktree remains claimed for the continuing full-v1 goal.
