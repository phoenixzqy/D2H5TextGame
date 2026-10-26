# D06 — Find Item shared-corpse search

Source `d8171e71`, public browser tests `71c1123e`, strict optional defaults
`ba279f7a`. Implementation, lint/types and final-build browser verification pass;
full unit16800/755passes with two existing skips. One bounded Find Item credit. Root is sole author/reviewer;
independent design/QA and earned economy acceptance remain open.

## Behavior

Find Item requires an actually learned native Barbarian rank and Find Potion
prerequisite, consumes one oldest eligible enemy-monster corpse from the shared
CE/PE/vines/Redemption/recovery pool, pays ordinary scaled mana/cooldown, then
uses exactly one seeded battle draw. Provisional JSON chance is20% at rank1,
21% at rank2 and39% at rank20. Both success and failure consume the body and
payment; refused selection consumes neither resources nor RNG.

Success creates only an immutable source/corpse/rank record. Native staging
privately copies/freezes records before naming callbacks or public playback.
Guarded wave victory validates the complete list against original living enemy
inputs, learned authority and actual slain outcomes. Normal loot uses its
unchanged stream first; a separate salted stream rolls ordinary loot for each
successful original monster using real level/tier/TC/act/difficulty/MF. Merge
both bags before existing preflight/publication/rollback. No extra kill XP,
quest/cache credit or progression. Defeat/draw/flee cannot collect unawarded
searches; duplicate settlement/replay cannot pay twice. A successful search can
legitimately produce no gear under ordinary no-drop or unknown-TC behavior.

No corpse or successful-search state is saved; save22 remains unchanged.
Bilingual descriptions and current/next/MAX rows show chance, payment, cooldown,
failure and victory-collection rules. The former inert marker/global MF scaling
is removed from this skill only.

## Verification

144 added tests:63 definition/schema/authority/find validation,49 causal engine,
18 native settlement,8 bilingual UI and6 staging boundary cases. The integrated
focused run passed236tests/7files before six final native cases were added;
the final native file separately passed18/18. Final engine8324/309 passes;
types, production build, actual755-URL precache guard, five-chunk bridge scan
and explicit browser-file lint pass. Final native/staging boundary43/2, repository
lint and types pass after the final defaulting cleanup. Full unit16800/755passes with two existing skips (1135.118s process).

Production en/zh-CN ×1280×800/360×640:4/4, retries0. Public create/export/import,
equip, allocate19→20, Blood Moor entry,4x playback, actual search feedback,
complete run victory, collected rewards, Save and fresh online/offline Continue.
Eight exact six-domain save pairs, four actual service-worker offline Continues
and20geometry checks pass. Each synthetic case owns45new unique items and gains
1110rune shards; prior owned items remain exact. Page/console errors are asserted
empty across initial and fresh pages. These imports prove mechanics/persistence,
not earned builds, progression or economy balance.

All12screenshots inspected. Both locales show actual successful-search feedback;
mobile description/chance/payment are readable. Mobile preview capture edges
overlap existing fixed header/navigation. Tall reward captures show only part of
the list; fixed combat controls cover its heading/currency area. Exact holdings
and quantities come from DOM/export assertions, not those cropped screenshots.
No blanket UX/accessibility acceptance is claimed.

## Failures and limits

Original no-body and native-settlement REDs are retained. The original no-body
fixture lacked the later explicit native projection; final causal fixtures use
actual composition. Incorrect test assumptions about poison death timing,
absolute mana events, fallback skill-order fields and an unlucky eight-seed
cohort were corrected without weakening intended behavior. A fixed32-seed
synthetic cohort proves both paid outcomes. The first settlement regression
misused a spy implementation; it now captures the real function before spying.
Staging null-find RED led to strict undefined-only optional defaults; null must
fail. Two initial lint exceptions were replaced by native destructuring defaults;
no exception remains in the delivered source. An earlier full run was intentionally
cancelled after127.015s for this cleanup, signalling only four verified task-owned
PIDs, all since absent. It was not an observation-timeout retry. The first engine suite failed one old
inert-marker expectation, corrected to the real dedicated effect; final engine
passes. Eight UI REDs preceded the truthful descriptions/chance rows.

The first browser launch never ran the app because task-local XDG cache lookup
hid installed Chromium. The corrected run explicitly selects the existing
shared browser installation; timeouts, retries and assertions are unchanged.
Original launch report/trace/log remain separate from both four-case gameplay
passes. The final rebuilt-source run passed4/4; all12final screenshots are
byte-exact to the12inspected originals. A derived browser-metrics file initially
collided with its runner receipt basename; original reports/attachments remained
intact. Receipts were retained separately and metrics recomputed under a distinct
name, with existing screenshot bytes verified before reuse.
Nonvictory native tests inject terminal status after real successful searches;
they prove the payout boundary, not genuine lost battles or earned balance.
Existing BUG180/237 and test/build/bundle budgets remain open.

## Scope and integrity

The other29 raw Barbarian data objects and genuine Ancients401 save remain
unchanged. The final build's761hashes and1495captured source/config/test/contract
files are exact; all frozen source files match committed blobs at`ba279f7a`.

GenuineL33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared
remains unchanged; decompressed SHA256:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign or remote action. Only Find Item gains credit:147bounded/
64unverified/one engine-only/one review-needed; Barbarian28/30. Other212raw CSV
rows and all213IDs/order are exact. Retention/cleanup results follow below. BUG225 stays open for
Grim Ward; Battle Command and Cold Mastery acceptance remain unfinished.
C0/C1 retain limited acceptance; C2 underway; C3/C4/fullG0–G7, all-class earned
builds,30–50hour pacing, economy, endgame and full privatev1 remain incomplete.

[Contract](../decisions/D06-find-item-v1.md) and
[BUG225](../../../production/bugs/BUG-225-barbarian-corpse-skills-ignore-bodies.md).

[Packet](fixtures/find-item/packet.json), [terminal results](fixtures/find-item/terminal-results.json),
[browser audit](fixtures/find-item/browser-audit.json), [source](fixtures/find-item/source-delivered.json),
[integrity](fixtures/find-item/integrity-delivered.json), [inventory audit](fixtures/find-item/inventory-audit.json)
and [author review](fixtures/find-item/author-review.json).

## Retention and cleanup

Raw diagnostic archive: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-find-item-retained-z06urnmb.tar.xz`

SHA256: `ae115690424676d400fac545abd9dbbe79ddee23ca28d88ff48364ae5ae6f950`; 2050548 bytes; all 225 regular
members byte-verified. It retains original failures/cancellation, terminal receipts,
browser reports/screenshots, source/build hashes and the exact cleanup plan.
Owner: root. Root removes this exact archive after the original failure diagnosis
and all full-v1 evidence consumers finish. Disposable builds/runtime are excluded.

Exact cleanup removed 2297 files and 45 directories. Scratch root is absent;
all 884 recorded process identities and 4 owned browser profiles are absent;
port 4521 is free. Remaining paths: none. Cleanup failures: none. Shared caches,
tools/browser binaries, source/history, genuine saves, prior archives and the
active umbrella worktree/claim are preserved.

[Retention](fixtures/find-item/retention.json) and [cleanup](fixtures/find-item/cleanup.json).
