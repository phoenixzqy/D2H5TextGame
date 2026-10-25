# D05 — Automatic personal Barbarian Shout and Battle Orders

Runtime/UI commit: `4045681a76e79a6cfe8558a91479bf5d3a414566`. Controlling [D05 contract](../decisions/D05-barbarian-warcries-v1.md).
BUG184 fixed locally; independent design/QA and earned-build balance remain open.

## Delivered behavior

Shout automatically adds the authored3% ordinary Defense per allocated rank,
unlock6/Howl prerequisite/cap20. Orders adds4% maximum Life and1% ordinary
Energy-based MP recovery per rank, unlock24/Shout prerequisite/cap20. The old
fixed50%/party/timed/max-mana descriptions are explicitly reconciled. Hero only;
no cast, combo, timer, selection, passive action, RNG, cost or saved-field change.

Copied/frozen schema-owned definitions accept only exact allocation aliases,
MAX once/cap; the fresh hero boundary enforces class/level eligibility. Native
learning owns prerequisites. Same-stat bonuses add over one fresh equipment/quest
baseline: life*(1+Stamina+Orders), defense*(1+IronSkin+Shout). Orders boosts normal
Energy recovery before existing item recovery. Maximum MP is unchanged. Current
HP/MP remain absolute and clamp on removal; fresh encounter full-pool policy stays.
Learning/reset applies next wave. Explicit replay retains original resources,
carries/seed and pays no duplicate income. Save remains22.

## Verification

| Check | Result |
| --- | --- |
| Focused new/adjacent engine, composition, native, bilingual UI |79 tests/seven files pass |
| Full authored corpus loader/integrity |322 tests/two files pass |
| Engine suite after final test typing/lint correction |6296 tests/223 files pass |
| Standard full regression |12505 tests/537 files pass; two existing skips |
| Strict typecheck/global lint/engine purity |Pass |
| Production build, explicit VITE_E2E=false |Pass; existing bundle/PWA warnings remain |
| Production test-bridge scan |Four chunks/five forbidden patterns absent |
| Production en/zh desktop/mobile + separate attachment audit |Four cases/eight exact five-domain Continue pairs pass |

The full run completed normally in591.813seconds. All1253
source/test/config hashes,760 build hashes, HEAD/Git status and
claimed-Rite genuine save digest are exactly equal before/after. All committed
source blobs separately match validated hashes and working files at the runtime
commit. Existing test-time/bundle/PWA budgets and intermittent BUG180 remain open;
BUG180 did not recur here. No validate:data script exists; actual corpus validation
uses the repository loader/integrity suites, without an alternate weaker validator.

## Proof scope

Actual seeded rank1/20 battles verify landed physical mitigation, additional
surviving HP, useful ordinary paid healing into new capacity and increased MP
recovery. Tests cover exact aliases/cap/invalid ranks, independent unlocks,
foreign classes, strict closed payloads, copied/frozen alternate tuning, fresh
equipment composition/removal/clamping, real Phoenix recovery ordering and merc
nonrecipients. No new automatic cast or status marker is needed.

Four native store cases use constructed L30 gear/finisher fixtures. Public
learning changes next wave only, preserving carried pools and exact recovery
carry; free pure-composition reset and original-input replay conserve income,
clamp decreases and remain deterministic. Validated v22 serialization/import
preserves allocations and recomposes without persistent derived bonuses. This
proves composition reset, not the paid town respec service.

Browser cases import an explicitly synthetic L24/five-point fixture, then learn
Howl/Shout/Orders and rank both passives through public controls. Both locales
show actual rank1/next2 values, ordinary recovery versus maximum MP, self-only,
unlock/cap and next-wave semantics. Eight Save-close-new-page-Continue pairs
compare complete player/inventory/map/mercs/formation domains. A separate raw-save
auditor verifies exact expected allocation/point changes and unchanged other
fields. Forty geometry samples across360x640/412x915/640x360/1280x800/1920x1080
show no horizontal overflow and Allocate>=44x44. No page errors captured. All eight
screenshots inspected individually. Existing fixed header/navigation partly
occludes mobile headings/Allocate/lower rows, and icon/font fallbacks remain;
whole-screen accessibility/safe-area acceptance is not established.

## Original failures retained

Initial RED16 failures included mistaken fixtures: full-unit equality included
retained allocations, wrong BattleResult field, flat damage floor and a duplicate
variable introduced while correcting them. Corrected causal RED10 failures/six
controls precedes production edits. First production schema omitted nested object
types required by strict Ajv; collection failed in focused/native/engine runs.
Explicit types/property declarations fix the schema without relaxing validation.
Corrected core/native passed47 cases while four UI cases still failed, before
actual description/alias wiring. All79 focused cases then passed, including added
healing/item/merc and exact recovery-label checks.

Initial final typecheck exposed one excess-property literal in a merc fixture;
lint exposed two void assertion callbacks. Only fixtures/callback braces changed.
A later lint wrapper terminated143 without a child receipt; its recorded child
PID and all ESLint consumers in this worktree were confirmed absent before an
unchanged-source normal retry passed. The cause of termination is unknown. An
attachment audit was mistakenly started before the fourth live browser case
finished; its original incomplete-report failure remains, followed by the complete
four-case audit. No gameplay/number/timeout/worker/discovery/gate weakening or new
skips were introduced. Preview exit-15 is deliberate exact-owned-PID cleanup after
all browser consumers finished, separately recorded.

## Retention and remaining scope

[Manifest](fixtures/barbarian-warcries/manifest.json) retains135 raw
files/25 terminal process records, byte-verified
in raw.tar.gz. [Cleanup receipt](fixtures/barbarian-warcries/cleanup.json) records
exact task-owned disposal/preview closure: 895 files removed, scratch
absent, port4471 closed, remaining[]/failures[]. Shared caches and older campaign
evidence are preserved.

Only these two skills gain bounded-functional dispositions. All213 IDs/order
remain:154 unverified,57 bounded-functional, one bounded-engine-functional (Ice
Arrow), one review-needed (Cold Mastery). These58 bounded records have different
proof scopes. Golem Mastery's known stale row is not credited by this batch.

Genuine Ancients401/Rite remains L33/XP149261/23682gear/nextNormal402,
decompressed SHA256`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign actions or remote publication. Baal/C2-C4/fullG0-G7, all213
skills, seven classes/two builds, economy/pacing/endgame/offline/PWA/accessibility/
performance and independent acceptance remain unfinished. The umbrella goal,
branch and worktree claim stay active.
