# D04 — Frenzy dual attempts and hit-earned speed

2026-10-25; root sole writer/reviewer. Locally fixed and verified; Frenzy receives
bounded functional credit. Independent design/QA and earned balance remain open. [Contract](../decisions/D04-frenzy-v1.md), [BUG216](../../../production/bugs/BUG-216-frenzy-inert-speed.md).

## Delivered behavior

One paid native Frenzy cast makes two independent attempts on the same original
enemy, with no replacement after target/caster death. Existing85–120/+8rank
Physical damage,12MP/CD1, unlock24/cap20 and prerequisites remain. Positive
hostile direct HP loss grants the surviving authorized native hero one speed
stack per hit: provisional JSON5%base Attack Speed, cap5, refreshed6s. Misses,
basics, periodic/aura/reflected/unrelated hits do not grant/refresh. Base stats
stay immutable; finite expiry reverses potency. Fresh wave authority removes
carried speed when Frenzy is unconfigured; save data has no transient combat
payload. Feral Rage's existing exports/tuning/8s lifecycle remain compatible.

Production UI shows both attempts, actual per-attempt current/next damage,
5%/5cap/6s and truthful bilingual lifecycle prose. The real localized positive
combat chip is blue and disappears with playback state. Local source commits: Frenzy `bca26202`, offline build `99fda510`, NPC fallback `ae556b86`.

## Causal and native proof

Ranks1/2/20 ×seeds7/19/41/97 use actual registered Frenzy through native class
configuration. They prove two attempts/one payment, actual enemy HP loss,
independent misses/crits and ordinary Defense/50%Physical resistance. Two landed
hits move the next action3400→3320ms, without changing base Attack Speed100.
Tests cover cap/refresh, exact7700ms expiry after the1700ms cast, basics never
refreshing, and ordinary cadence returning. Haste produces500cast/900basic/
1300basic/1700cast, respecting two separate payments. Stun does not postpone
expiry, and Chill composes through the ordinary action scheduler.

Original target death leaves three other living enemies untouched; lethal
reflection stops the second attempt and prevents posthumous stacks. Invalid
rank/class/unlock/prerequisite/alias/priority and forged ownership/lifetime/
payloads confer no speed. Native allocation freezes the current recording,
changes the next wave without refill, and roundtrips through save/import.
A real constructed rank20 multi-wave case carries paid stacks, then removes
them on a later wave after priority removal. Seeded input immutability, exact
replay, ordinary runBattle equality and HP/MP/living-status playback agree.

No trusted hostile Bone Armor fixture is claimed: native personal-shield
authority is player-only. The shared positive-HP-loss guard is inspected;
actual missed-hit and lethal-reflection negative controls are exercised.

## Validation

| Check | Result |
| --- | --- |
| Frenzy/shared/UI focused |52tests/7files PASS |
| Feral compatibility/schema/shared validator |115/10 PASS |
| Real data loader |292/1 PASS |
| NPC fallback/portrait/town compatibility |18/3 PASS |
| Engine |7817/293 PASS |
| Final typecheck/lint |PASS |
| Production build/precache guard |PASS |
| Full unit |15158/695 PASS; two existing skips;592.62s Vitest/594.070s wrapper |

All1197source/test/config/contract files and761corrected build files were frozen
before full began. No later source/test/build changes are permitted for this
receipt. Genuine Ancients/Rite save's decompressed hash remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.

Four production cases: en/zh-CN ×360×640/1280×800. Each creates/exports a real
character, publicly imports a declared syntheticL30/resource helmet/prerequisite
fixture, allocates rank1→2, selects Frenzy, casts through Enter, pauses/flees,
and saves/reopens. Each first cast hits the same original Bone Warrior A twice
for20/24HP and grants two Frenzy buffs. Eight exact player/inventory/map/mercs/
formation Save-close-new-page-Continue pairs pass. Four additional real offline
new-page Continues preserve the same five domains with network disabled.
Twenty five-size geometry checks pass;16screenshots/four individually inspected
cover mobile cast logs, both current/next panels and Chinese text wrapping.
No corrected-case page exceptions or console warnings/errors. No gameplay retry
is claimed: the first browser attempt failed and is retained separately.

These synthetic pools/level/helmet, fixed combat Date.now and authored ranks
establish mechanics, not earned builds, pacing or balance. Full accessibility,
performance/Lighthouse and final PWA acceptance are not established here.

## Additional defects found before final full

[BUG217](../../../production/bugs/BUG-217-application-excluded-from-precache.md):
the first build's2,098,900-byte application exceeded Workbox's unchanged2MiB
limit and was omitted from the worker. A new actual-output guard failed on the
missing entry. Separating existing Ajv dependencies into validation-vendor
reduces the actual application to1,981,972bytes; all five JS chunks and CSS are
precached.757entries/755unique URLs exist locally. No cache-limit increase or
new dependency. Large-bundle and generated-art-manifest warnings remain; broad
performance acceptance stays open. `npm run check:offline-precache -- <build>`
checks required emitted application assets against actual worker entries.

[BUG218](../../../production/bugs/BUG-218-missing-npc-portrait-requests.md):
the stricter console capture found three404Warriv portrait requests. The NPC
resolver invented paths for unavailable art. It now uses a registered portrait
from the current act or immediate existing GameImage fallback. Three REDs cover
actual files for all five authored towns, missing art and wrong-act identity;
all corrected browser cases have clean consoles. No generated asset changes.

## Retained failures and limits

The original Frenzy speed reproduction is committed separately. Current raw
evidence retains prerequisite shared-module RED (0tests), native RED7fail/3pass,
presentation RED13fail/5pass, the first green attempt's2fixture failures, and
the filtered expiry diagnostic. The copied Feral8s rebase expectation5500ms
was corrected to Frenzy6s remaining3500ms. Existing scheduler floating math
produced1700.0000000000036ms; the corrected assertion requires at least three
later actions and eight-decimal closeness, without a runtime formula change.
No source test skips were added; diagnostic filtering is not counted as passes.
Both original fixture texts and explicit correction records are retained.

Two chip REDs precede the buff classification correction. Precache RED, the
first build/worker hashes, first failed browser trace and three NPC REDs remain.
One attempted ESLint invocation on the plain mjs guard failed because the
repository's typed TSConfig excludes JavaScript; final repository lint covers
TS/TSX and the mjs guard passes node syntax and actual execution checks.

Root author security/plan/source review only; no independent approval. The next
[Concentrate reproduction](d04-concentrate-repro.md) has12complete native cases
but no repair or credit. Genuine campaign remainsL33/XP149261/nextNormal402/
Nightmare0/Ancients-Rite claimed/Baal uncleared. C0/C1 retain narrow exits;
C2–C4, fullG0–G7,213skills/two earned builds per class,30–50hour pacing/economy/
endgame/independent acceptance and complete privatev1 remain unfinished.
Umbrella goal/branch/worktree/claim remain active; no remote action.

## Inventory and retention

Only Frenzy gains credit:213IDs/order and212other rows remain byte-exact.
Inventory114bounded-functional/97unverified/one engine-only/one review-needed;
Barbarian16/30. Independent acceptance and earned balance remain open.

## Retention and cleanup

[Packet](fixtures/frenzy/packet.json) retains200raw archive members and30terminal
command receipts; all member hashes are verified. All1197committed source blobs
and761corrected build hashes match the frozen full-test inputs. The archive
preserves the complete original failed browser trace, including its resources,
as diagnostic evidence. [Source audit](fixtures/frenzy/source-delivered.json),
[author review](fixtures/frenzy/author-review.json), [browser audit](fixtures/frenzy/browser-audit.json),
[save audit](fixtures/frenzy/save-pairs-audit.json) and [cleanup](fixtures/frenzy/cleanup.json)
are retained separately for inspection.

Cleanup removes961current exact task-owned files, including761build files, plus
760previously hash-verified obsolete build files:1721task files/1521build files
total. All62recorded PIDs are absent, port4502is closed, and scratch is absent.
Remaining[]/failures[]. Source/history, retained evidence, genuine save, shared
caches and the active umbrella worktree/branch/claim are preserved.
