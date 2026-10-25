# D04 — Psychic Hammer's actual no-movement control

2026-10-25; local author verification under
[contract](../decisions/D04-psychic-hammer-v1.md) and
[BUG212](../../../production/bugs/BUG-212-psychic-hammer-inert-knockback.md).
Independent design/QA, earned balance and complete privatev1 remain open.

## Change

Replace the authored inert Knockback marker with the existing shared Stun:
1s normally,0.5s on bosses. This is an explicit new author adaptation within
the no-movement design, not a previously authored Hammer behavior or accepted
balance result. The validated row and its schema own the declaration; the
existing adapter, status consumer and scheduler supply its behavior. There is
no Hammer-specific combat code, new global Knockback consumer or new duration.

Preserve Arcane30–45/+3per rank,6MP/CD1, single-enemy targeting, unlock1/cap20,
no prerequisites and ordinary class-active authority/hit/damage/death/RNG paths.
Both locales show actual current-rank damage, ordinary/boss seconds, one target,
miss/no-movement rules and next-wave allocation behavior. Stun has a localized
name in the skill details. No saved field/version, item grant or dependency.

## Causal and native proof

37new cases across four files:19schema/adapter/pure previews,8causal native
combat,2store lifecycle/save and8bilingual actual UI. The three rank tests
cover36 actual/control scenarios: ranks1/2/20 ×seeds7/19/41/97 ×trash/boss/
chapter-boss. The control removes only the on-hit status from the same registered
attack. Original inputs stay immutable; repeated seeded recordings and ordinary
runBattle results agree. All-unit HP/MP and living active-status playback match.
Staged playback intentionally hides inactive future and dead-unit markers;
it does not promise equality with every raw stored engine status.

Each scenario spends6MP once and casts once at1700ms. Landed targets get
expiry2700ms normally or2200ms on bosses. Their first action moves from2000ms
to4000ms; the remaining action arrays match the control after that first skipped
slot. Misses preserve original timing and apply no Stun. Actual Arcane damage
events match the control. Explicit target grid positions stay unchanged. The
selected target alone is affected; an active canonical Stun extends without a
second marker. A lethal hit retains ordinary on-hit-status-before-death ordering,
one strike/death and no enemy action after death. No global death rule is changed.

Native class/level/alias/MAX/malformed-rank and MP/cooldown controls pass. Learning
Hammer during playback leaves the existing recording frozen, changes the next
wave's action and preserves the actual prior resources. Native save/import keeps
rank/priority and restores no enemy Stun, combat team or pool refill. These are
synthetic mechanical tests, not earned build or campaign/balance acceptance.

## Production browser proof

Four cases cover en/zh-CN ×360×640/1280×800, public create/export/import,
allocation rank1→2, priority, actual Arcane cast/Stun and visible MP use. Eight
Save-close-new-page-Continue pairs preserve player/inventory/map/mercs/formation
exactly. Meta idle clocks may advance across real reopen and are outside these
five exact domains. Twenty geometry checks cover360×640,412×915,640×360,
1280×800 and1920×1080; no horizontal overflow, allocation controls≥44px.
Sixteen screenshots, four individually inspected, show readable descriptions,
current/next damage and actual cast/Stun logs. The Chinese desktop view also
shows an enemy stunned and unable to act. Browser4/4, no page errors.

Synthetic L30/resources/imported helmet and fixed combat Date.now are declared;
ordinary timers and public controls, no store injection/test bridge. The first
cast is not forced to land; require a real landed cast among observed attempts.
Existing fallback icon glyphs and full device/a11y/offline acceptance remain open.

## Validation and corrections

Final focused37/4, engine7753/287 and full14965/675 with two existing skips
PASS. Full Vitest581.15s (command wrapper582.732s); types, lint and production
build PASS. Browser4/4, eight exact five-domain reopen pairs,20geometry and
16screenshots/four inspected PASS. Four generated JavaScript chunks are free
of test bridges; all756precache URLs exist. Existing test/bundle/PWA budget
issues remain explicitly unaccepted.

Original combined RED20failed/6passed, corrected prepatch RED20failed/8passed,
and bilingual UI RED8failed are retained. A test initially read a nonexistent
source field on status events; it now narrows by status ID. The first patched
schema failed strict Ajv compilation because required cost/scaling properties
were not also defined locally; references to their existing closed definitions
correct that omission without weakening validation.

Two fixture assumptions were corrected using the shared source: ordinary hit
statuses settle before lethal-hit death closure, and staged playback hides
future/dead statuses. Tests now assert that actual ordering, one strike/death,
no post-death action, all resource conservation and living active status views.
No combat rule was patched to accommodate the fixture. TypeScript5.4 required
explicit discriminant narrowing through flatMap rather than filter().map().
Lint required explicit String conversion in one numeric UI expectation, with
identical expected text. The full suite began before that lint-only correction;
final focused/lint/typecheck cover final test bytes. Runtime/build stayed frozen.

The first browser expected `[Stunned]`; the existing observed label is `[Stun]`.
Only the assertion changed; actual damage, Stun and skipped actions already
worked. Original scripts/failure report/screenshot are retained. The bounded
failed trace keeps all action/network/stack/HTML/CSS/JS metadata and first4/
final12 of316 screencast frames. Other300 frames and743 unrelated static PNG
response bodies are omitted with exact hashes; all760build hashes remain.
Original trace SHA256
`15aa3ec3fcd734fb91360681f7e3d5378126d5fd98a16611e608be47c7e18f44`.

Author five-axis review has no required finding; independent acceptance stays
open. Existing test/bundle/PWA budgets, earned balance and full privatev1 remain.

## Delivery and remaining scope

Source/tests/contract committed as `884b0839`. All1169frozen source/config/
contract files match actual committed blobs; all760build files and the genuine
save hash match. Only Hammer gains skill credit:110bounded-functional/101
unverified/one engine-only/one review-needed, Assassin13/30. The other212rows
remain unchanged.

Raw153files/21terminal receipts are archived and member-hash verified.
Cleanup removes913exact task-owned files, including760build files; all43
recorded PIDs are absent,4498is closed and scratch is absent. Remaining[]/
failures[]. The failed browser server PID was not retained before its live
receipt was overwritten; helper stop output and a subsequent successful bind
prove release, while PID claims cover only the43recorded PIDs. Shared caches
and the umbrella worktree/branch/claim are preserved.

[Raw archive](fixtures/psychic-hammer/raw.tar.gz),
[member manifest](fixtures/psychic-hammer/packet.json),
[source audit](fixtures/psychic-hammer/source-delivered.json),
[browser audit](fixtures/psychic-hammer/browser-audit.json) and
[cleanup receipt](fixtures/psychic-hammer/cleanup.json) retain the evidence.

Leap is separately reproduced in twelve native paired cases without a source
patch or credit; [next reproduction](d04-leap-repro.md). Genuine Ancients/Rite
remainsL33/XP149261/nextNormal402/Nightmare0/Baal uncleared, decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2–C4/fullG0–G7/all-class earned builds/30–50hour
pacing/economy/endgame/independent acceptance and full privatev1 remain open.
No genuine campaign or remote action; umbrella branch/worktree/claim active.
