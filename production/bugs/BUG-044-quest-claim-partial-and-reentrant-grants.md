# BUG-044 — Preflight and settle shared quest reward claims

Status: fixed in this P04a04a commit; root/producer/QA final APPROVE/ADEQUATE.
Runtime2c21221a; regressions src/features/quests/claimReward{,.persistence}.test.ts.
Severity: High (reward claims can consume undelivered rewards and reenter before settlement).
Owner: engine-dev / frontend-dev; root integration, producer and independent QA.
Card: P04a04a, Den and shared synchronous claim safety only.

## Reproduction

Input head 8d47a92; Linux, Node24.21.0, Vitest ui/jsdom. Browser viewport
and engine seed are not applicable to this synchronous store reproduction.
UI controls run both zh-CN and en. All runtime loaders, reward actions and
save adapters are real; only IndexedDB IO is faked in persistence tests.

1. Create a real L1 sorceress fixture and mark actual Den completed/unclaimed.
   Remove the player, or set hydration idle/loading/error, then call the real
   claimQuestReward. Repeat with a real fielded Inner Sight mercenary.
2. With a player and ready hydration, complete actual Cain's Favor (service),
   Blood Raven (XP plus merc unlock) or Jade Statuette (XP plus positive gold).
   Claim using the same boundary; no loader mock or content JSON edits.
3. Subscribe once to real player/merc publication and synchronously call Den
   again (or the supported Tainted Sun) before the first claim returns. Set
   the latch before reentering, avoiding stack overflow.
4. Wrap real player XP, merc sharing, currency add or final claimed flag so it
   mutates then throws once. Compare participating data, original references,
   claimed-key absence/false, unrelated records/actions and retry behavior.
5. Pause real importIntoStores at its Dexie write with hydration still ready;
   call claim before the incoming save is committed. Release/await in finally.

Expected: full executable-bag/player/readiness preflight before writes;
unsupported reward bundles stay unclaimed; one synchronous global claim guard
refuses same/different nested claims. Exactly500 player XP, progression points,
one extra Den skill point and375 fielded-merc XP on settled success; zero gold
changes nothing. Controlled grant/final-flag exceptions restore owned slices,
allow retry once and report grant-failed; failed restoration explicitly throws
and attempts remaining restorations. Ordinary autosave saves settled data.

Actual at unchanged source: no-player/not-ready/unsupported claims return ok;
synchronous nested claims also return ok; all-zero bag is consumed. Controlled
post-mutation exceptions escape without restoration. Pending import permits
claim on the old visible character. Existing UI test falsely considered Cain's
unsupported service delivered. These are bounded store/UI reproductions;
controlled injected exceptions are recovery tests, not observed production
exception incidents. Sequential repeat and ordinary Den remain passing controls.

## Frozen RED evidence

Command: npx vitest run src/features/quests/claimReward.test.ts
src/features/quests/claimReward.persistence.test.ts
src/features/quests/QuestsScreen.test.tsx src/stores/quest-npc-talk.test.ts
src/features/town/TownScreen.test.tsx --reporter=json
--outputFile=<raw-root>/red-final-vitest.json

Exit1:34failed/41passed/75total,0skipped; wall6.307s.
Core26fail/9controls, persistence2fail/1control, localized UI6fail/10controls,
unchanged talk13 and town8 controls pass. Core failures include9 controlled
recovery cases, and persistence adds1 controlled recovery case. The two locale
missing-translation tests are supplementary feedback gaps, not payout defects.

Frozen core SHA70135ad4fbe35561562165061005c512fb6e6b44d392494243259de0161bdb8b;
persistence SHAa0dcfe2f6d43b985cd580ff8168fe8aeca2d675583b4df0e12e21c272bfd067a;
UI SHA1684209f0576b7d1092c4a26d8b3894b86ccc29ffa3f36fae54c4ea38f1f8fc7.
Unchanged runtime SHAcfa778ea575847cb3aa1e8550305f2e9a5d4caa8b54edcafd97515a5e7a0dcfe.
RED JSON SHA95000e78cbcb25abcf94a254d5a95ebc6a1d50d3394207355026b05d36d90a48;
RED log SHA3d90c21979eafde3f0e1b3463037f12394a61f0e9f0ad278e3ebc931f988d2a6.
Initial run35fail/40pass included a wrong raw-versus-projected autosave idle
lastOnline expectation. Independent QA identified it; fixture time and explicit
complete projected payload oracle were corrected before frozen RED. No assertion
weakened or source changed. Initial typecheck9.854s/scoped lint5.823s pass.

Raw root: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-den-claim-keme1h0d.
Root retains all drafts, logs and result JSON until independent consumers finish;
then versions decisive evidence and removes only exact task-owned paths.

## Root cause and approved scope

claimReward.ts dispatches entries as it reads them, silently ignores unsupported
entries, captures a nullable player, and marks claimed after separate unguarded
publications. It has no complete preflight, readiness guard or rollback boundary.
Fix at this existing boundary; preserve canClaim as basic action availability.
Add localized result feedback without QuestsScreen runtime changes. Snapshot only
participating player/merc/currency data and original target progress; restore via
partial setState while preserving other records/actions. No engine/persistence/
schema/save-version/store API/content/unlock/economy redesign. Positive gold is
unsupported under D10. No observer-wide publication atomicity or crash guarantee.

Security check: pass. Local reward/save integrity correction and isolated test
inputs; no network, credentials, dependencies, permissions or validation bypass.
Workaround: no safe workaround for unsupported delivery; do not claim it.
Ordinary-earned Den browser proof and full campaign/C/G gates remain separate.

## Implementation and combined validation

Producer/QA independently approved genuine frozen RED before runtime edits;
then source/focused75GREEN APPROVE/ADEQUATE at runtime2c21221a. Frozen assertions
unchanged. Combined related720/57, full and coverage2310/136, typecheck/full lint/
purity51, production build and bridge removal pass. Unchanged80% engine-only gate
excludes claim/store/UI and is not substituted for focused state assertions.
[Exact commands, hashes, timing, warnings and bounded contract evidence](../../docs/plans/evidence/p04a04a-den-claim-safety.md).
Producer/QA final APPROVE/ADEQUATE; both raw holds released. Exact task raw
root/dist/.vite removed and absence verified; ordinary-earned Den browser proof
is separate. No C/G/fullquest completion implied.
