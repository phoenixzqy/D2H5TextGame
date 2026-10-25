# D04 — Leap's actual control and paid physical follow-up

2026-10-25; local author verification under
[contract](../decisions/D04-leap-v1.md) and
[BUG213](../../../production/bugs/BUG-213-leap-inert-knockback.md).
Independent design/QA, earned balance and complete privatev1 remain open.

## Change

Replace inert Knockback with existing shared Stun:1s normally,0.5s on bosses.
The paid non-damaging cast controls all currently living hostiles without an
accuracy roll or movement. Preserve the existing physicalDamagePct=.01/rank
as a paid personal direct Physical damage bonus, capped at20/+20%, for3000ms.
The3s duration is new provisional author tuning; the Stun is an explicit author
adaptation. Neither is an earned balance or independent design acceptance.

JSON owns duration/scaling and the closed schema rejects contradictory effect,
damage, geometry and sequence metadata. An exact registry/native-rank boundary
precedes payment. Source-owned immutable paid potency uses existing finite
status clocks, shared Stun/scheduler and direct-damage input. Learning grants
no passive power. No active refresh, new movement stat or saved combat field.

Preserve unlock6/cap20/no prerequisite and existing rank scaling: ranks1/2/20
cost8/8/6MP with raw cooldown3/2.95/2.05s, whose existing one-decimal runtime/
display rounding yields3/3/2s. One action/payment/cooldown supplies both effects.
Paid potency remains through respec until expiry; fresh allocation affects
future casts. Existing next-wave carry/rebase never renews the interval or
refills pools. Save/import persists allocation/priority, with no version bump.

## Causal and native proof

60new cases across four files:25schema/adapter/display/native-authority/carry,
25causal combat,2store lifecycle/save and8bilingual actual UI. The three paid
cast cases cover36scenarios: ranks1/2/20 ×seeds7/19/41/97 ×trash/boss/chapter-boss.
Each casts once at1700ms, spends8/8/6MP, applies three Stuns and captures personal
potency until4700ms. Enemy Stun expires2700ms normally or2200ms on bosses;
their actual first action shifts2000→4000ms. Leap itself deals no damage, moves
no position and controls neither dead enemies nor allies.

Actual paid state is captured through playback and rebased, then paired with
the identical snapshot with only its paid marker removed. Base100direct
Physical damage with an existing25% increase becomes126/127/145 at ranks1/2/20,
versus125without Leap; after expiry both125. An actual registered Bash hit gets
the same20% rank20 bonus. Arcane/Fire/Thorns controls remain unchanged. The tests
require independent seeded hit outcomes, actual HP settlement and literal
additive scaling; no scalar event is duplicated to imitate causality.

Active rank20 casts occur1700/5100/8500ms, preventing refresh even when the2s
cooldown has expired. Malformed/foreign/extended markers grant no potency;
duplicates do not stack. Fractional clock rebase preserves the exact finite
interval, including exclusive expiry. Inputs remain immutable, seeded replay
and ordinary runBattle results agree, and playback matches all HP/MP plus
living active-status views. Future/dead raw markers are outside that view.

Native allocation leaves the current recorded wave frozen, changes the next
wave and preserves prior resources/base stats. Save/import keeps learned rank
and priority without restoring a combat team, status or pool refill. These
synthetic mechanical checks provide no earned class/build acceptance.

## Production browser proof

Four cases cover en/zh-CN ×360×640/1280×800 using public create/export/import,
allocation rank1→2, priority selection, actual paid cast/buff/all-enemy Stun and
visible MP use. Eight Save-close-new-page-Continue pairs preserve player,
inventory,map,mercs,formation exactly. Meta idle clocks may advance on real
reopen and are outside those five exact domains.

Twenty geometry checks cover360×640,412×915,640×360,1280×800,1920×1080, with no
horizontal overflow and allocation controls≥44px. Sixteen screenshots, four
individually inspected, show readable current/next paid-bonus/cost/CD and
bilingual actual buff/Stun logs. The Chinese desktop also shows stunned
enemies unable to act. Browser4/4 and no page errors. Synthetic L30/resources/
imported helmet/fixed combat Date.now are explicit, with ordinary timers and
public controls, no test bridge. Existing navigation glyphs/full a11y/offline
and device acceptance remain open.

## Validation and corrections

Final focused60/4, engine7778/288 and full15025/679/two existing skips PASS.
Full Vitest624.48s, wrapper625.952s. Types, lint and
production build PASS. All final source/tests/build bytes were frozen before
final full/engine/types/lint/browser checks started. Four generated JavaScript
chunks are free of test bridges; all756precache URLs exist. Existing test,
bundle/PWA and performance budgets remain unaccepted.

Original native RED33failed/7passed and UI RED8failed are retained. The first
patched run passed44and failed4expectations that assumed unrounded2.95/2.05s
cooldowns. Source review confirmed existing one-decimal rounding in runtime
and display; the contract/expectations were corrected without changing global
timing. A subsequent8case log-copy RED found missing bilingual paid-buff/status
names; both combat locale files now supply them.

TypeScript5.4 required typed flatMap discrimination and omission of an optional
property instead of explicit undefined. Three lint corrections use a boolean
damage-presence check, remove a redundant condition and use an optional-chain
existence check. Earlier passing focused/types/engine/browser results are
retained. The first full was explicitly cancelled after105s because production
display code needed those lint corrections. Only verified task-owned descendant
PIDs were signalled; its exit−15 is retained separately as full-before-lint,
with reason and original identity. This was not an observation timeout or pass.
Two superseded760file builds were hash-verified and exactly removed before the
final build. No original failure is omitted.

Author five-axis/security review has no required finding; independent acceptance
remains open. The bounded typed module follows the existing Burst/Cloak status
pattern and adds one bounded status scan to direct Physical inputs. No new
dependency, credential, CI, permission, remote or genuine campaign action.

## Delivery and remaining scope

Source/tests/contract committed as `0742a94f`. All1175frozen source/config/
contract files are checked against actual committed blobs; all760build files
and the genuine save hash are checked before retention. Only Leap gains credit:
111bounded-functional/100unverified/one engine-only/one review-needed;
Barbarian13/30. The other212inventory rows remain byte-exact, with213IDs/order.

Raw217members/25terminal receipts are archived and member-hash verified.
Cleanup removed977exact task-owned files, including the final760build files;
1520prior verified build-file removals bring cumulative task removals to2497
and build removals to2280. All55recorded PIDs, including the cancelled run's
verified descendants, are absent;4499is closed and scratch is absent.
Remaining[]/failures[]. Both browser server PIDs were retained. Shared caches
and the umbrella branch/worktree/claim remain active.

[Raw archive](fixtures/leap/raw.tar.gz),
[member manifest](fixtures/leap/packet.json),
[source audit](fixtures/leap/source-delivered.json),
[browser audit](fixtures/leap/browser-audit.json) and
[cleanup receipt](fixtures/leap/cleanup.json) retain the evidence.

Double Swing is separately reproduced in24native scenarios, including a
standard-grid rerun, without a source repair or credit;
[next reproduction](d04-double-swing-repro.md). Genuine Ancients/Rite remains
L33/XP149261/nextNormal402/Nightmare0/Baal uncleared, decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2–C4/fullG0–G7/all-class earned builds/30–50hour
pacing/economy/endgame/independent acceptance and full privatev1 remain open.
Umbrella goal/branch/worktree/claim remain active.
