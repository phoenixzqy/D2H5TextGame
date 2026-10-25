# D04 — Howl, Taunt and Battle Cry

2026-10-25; root sole writer/reviewer. Source/tests/contract `eeaaa48d` are
locally verified. Exactly three bounded functional credits are recorded;
independent design/QA and earned balance remain open.
[Contract](../decisions/D04-barbarian-warcry-control-v1.md).

## Actual paid combat effects

Howl interrupts all living hostile actions for1s (boss/chapter boss0.5s), with
no movement or personal dodge mechanic. Taunt redirects a marked hostile's
basic and single-enemy skills to its living eligible caster for1s. Death,
absence or same allegiance falls back to ordinary targeting; self/friendly/area
effects retain their targets.

Battle Cry snapshots paid rank and JSON-authored potency for1s: rank1 reduces
outgoing direct damage25% and ordinary Defense50%; rank20 gives44%/88%.
These numbers remain provisional author choices. Its outgoing factor follows
crit and precedes mitigation. Existing periodic damage and raw reflection do
not receive that outgoing factor. Ordinary Defense still follows existing
mitigation, without changing base stats, Magic Resist or resistances.

All three pay once, retain their unlock/prerequisite/cap/cost/cooldown growth,
replace their own same-status source/potency/interval and use inclusive start,
exclusive expiry. Battle Cry copies/freezes paid potency and rejects malformed
or nonfinite payloads. Native class-active projection owns eligibility. No
transient combat power is persisted; save format remains22. Unused active
passive-stat rows and Battle Cry's unrelated amp-damage marker are removed.
Both locales describe actual current/next/MAX effects and show combat chips.

## Causal and native checks

107focused tests in four files pass:44authored-definition/schema cases,
33causal combat cases, six native store cases and24real React cases. Actual
HP/MP/actions/recipients are checked at ranks1/2/20 across seeds7/19/41/97,
with immutable input, exact replay, ordinary runBattle and event playback.
Cases cover exact interruption/expiry/resumption, ordinary/boss control,
Taunt area/single-target boundaries and dead/absent/same-side/future/expired/
indefinite fallback, refusal for resources/cooldown, no dead/friendly targets,
replacement, paid potency, finite/rebased intervals, magic damage, raw
reflection and existing periodic rates.

Native allocation/priority changes activate next wave without changing the
current recording or refilling HP/MP; real validation/import retains learned
ranks and priority while excluding transient statuses. Canonical aliases,
ownership/unlock/prerequisite/rank-cap refusal and bilingual rank0/1/2/20
current/next/MAX are covered.

Engine7893tests/295files, final typecheck, full lint, build and actual-output
precache guard pass. All1198source files and761build files are frozen; the
production entry and application JS/CSS appear among755unique worker URLs.
The engine run precedes a required-tier test-fixture correction and comment
correction; the final focused run covers the corrected fixture. Broad bundle
and generated-art-manifest warnings remain open.

## Public browser/save/offline proof

Four independently terminal browser groups pass: en/zh-CN at360×640/1280×800,
three skills each. The12cases include24exact five-domain ordinary Save-close-
new-page-Continue pairs and12additional network-disabled fresh-page Continues.
All60five-size geometry checks show no horizontal overflow and an allocation
control at least44px. All36final screenshots are retained; four individually
inspected views show readable English Howl/Taunt and Chinese Battle Cry mobile
details and English Battle Cry desktop details. Lower mobile Next rows scroll
below the fold. Existing missing icon glyphs remain.

The harness creates a real new character/export, publicly imports a declared
synthetic L30/resource-helmet/prerequisite save, allocates rank1→2, sets priority,
enters combat and observes the real cast/enemy chip before pause/flee, then
checks ordinary and offline Continue. No browser store bridge is used. Imported
pools/equipment and fixed combat Date.now prove mechanics/public flows, not
earned builds, pacing or balance. Geometry is not a full accessibility audit.

## Retained failures and regression investigation

The original causal RED has nine failures before combat repair; UI RED has
24before truthful prose. An expanded check has five fixture/prose failures:
the wrong rebaseStatusClock fixture API and four Chinese phrase mismatches.
The correct API and prose are used without weakening assertions. Initial
typecheck fails on the missing required tier in a synthetic unit; corrected
typecheck passes.

Browser harness failures include an adaptation syntax error, two mobile
selectors that targeted a hidden marker instead of its real card, and a desktop
chip expiring between observation and Pause. Scripts/logs/reports are retained.
The corrected harness captures visible DOM chip labels atomically before Pause;
all final group receipts exit0 without application source/build changes.
Failed trace metadata is retained byte-exact; a member/hash index explains
discarded duplicate resource binaries and preserves original archive hashes.

The first full regression exits1 after827.503s:15435passed, one5000ms
player-first module-import timeout, two existing skips and707files.
The exact13-test file passes separately with unchanged assertions/timeout.
[BUG226](../../../production/bugs/BUG-226-player-first-import-validation-timeout.md)
records the unresolved cause; full-suite success is not inferred from that
isolated pass. All recorded task processes are absent and ports4506–4509
closed before the quiet full comparison. The unchanged quiet full passes
15436tests/707files/two existing skips (725.07s Vitest/726.949s wrapper).
The exact import-order file passes all13tests in4467ms during that run.
No timeout/assertion/configuration change is made; the cause stays unproven.

Final corrected focused107/4takes14.220s, engine7893/295takes134.046s,
typecheck138.218s, full lint291.024s and build17.344s, all exit0. All1198
frozen source blobs match the committed source;761build and genuine-save
hashes remain exact. Only the three intended Barbarian data objects differ;
the other27are byte-exact. All213inventory IDs/order and210other CSV rows
are byte-exact. Counts:124bounded-functional/87unverified/one engine-only/
one review-needed; Barbarian26/30. These are bounded author checks.

## Remaining scope

[BUG225](../../../production/bugs/BUG-225-barbarian-corpse-skills-ignore-bodies.md)
separately reproduces36legal Find Potion/Find Item/Grim Ward cases that pay and
cast before any body exists. Grim Ward spawns no ward and does not interrupt
the observed enemy action. Complete observations precede intentional terminal
failure. No repair or credit is claimed; corpse/outcome/no-potion adaptation
contracts remain open. Battle Command is also unverified.

The selected campaign class is inspected next. [BUG227](../../../production/bugs/BUG-227-frozen-orb-box-instead-of-cone.md)
reproduces12legal rank1/2/20×seed7/19/41/97 Frozen Orb cases: one paid cast
attempts all nine3×3cells despite the design and both locales promising a cone.
Actual HP loss/payment and immutable replay controls pass before the intentional
geometry assertion. The first probe's native-alias expectation fails before
combat and is retained separately; its corrected expectation does not weaken
the shape check. No Frozen Orb repair/credit or Baal-cause claim follows.

Genuine L33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared
and decompressed save SHA256 remain unchanged:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain their original exits. C2–C4/fullG0–G7, all213skills/two earned builds
per class,30–50-hour pacing/economy/endgame, independent acceptance and complete
privatev1 remain unfinished. Umbrella goal/worktree/claim remain active. No
genuine campaign or remote action.

## Retention and cleanup

[Author review](fixtures/barbarian-warcry-control/author-review.json),
[browser audit](fixtures/barbarian-warcry-control/browser-audit.json),
[save audit](fixtures/barbarian-warcry-control/save-pairs-audit.json),
[freeze audit](fixtures/barbarian-warcry-control/freeze-audit.json),
[source diff](fixtures/barbarian-warcry-control/source-diff-audit.json),
[committed source](fixtures/barbarian-warcry-control/source-delivered.json) and
[inventory audit](fixtures/barbarian-warcry-control/inventory-audit.json)
establish the bounded checks above. [Terminal results](fixtures/barbarian-warcry-control/terminal-results.json)
separate final passes, intermediate passes and actual failed attempts.

The [packet](fixtures/barbarian-warcry-control/packet.json) verifies291raw
archive members in5,013,491compressed bytes, including original failures,
corrected browser groups, both full-suite results, both Frozen Orb probe
versions and the complete corpse-skill observations. The761duplicate build
files are represented by frozen hashes. [Cleanup](fixtures/barbarian-warcry-control/cleanup.json)
verifies the archive and exact current file set before removing1052task-owned
files. All89recorded PIDs and five tool-managed browser profiles are absent,
ports4506–4509are closed, and scratch is absent with remaining[]/failures[].
Source/history, retained evidence, shared caches/tools, unrelated campaign
evidence and the active umbrella worktree/branch/claim are preserved.
