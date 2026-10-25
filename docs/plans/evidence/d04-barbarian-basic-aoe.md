# D04 — Bash, Whirlwind, Leap Attack and War Cry

2026-10-25; root sole writer/reviewer. Source/tests `8a733496` are locally
verified. Exactly four bounded functional credits are recorded; independent
design/QA and earned balance remain open.
[Contract](../decisions/D04-barbarian-basic-aoe-v1.md),
[BUG222](../../../production/bugs/BUG-222-barbarian-attack-descriptions.md).

## Verified behavior and presentation repair

The existing authored attacks already implement their basic mechanics. No engine,
game-data/schema, persistence, dependency or save-version changes are made.
Bash attempts one living hostile; Whirlwind, Leap Attack and War Cry attempt
every living hostile once. Damage remains the existing rank-scaled Physical
skill base, with ordinary hit/critical/Physical increases/Defense/resistance.
Each cast pays once and starts one cooldown. Leap Attack and War Cry apply
on-hit Stun1s/boss0.5s; misses do not control. Caster death prevents further
resolution. Whirlwind retains shared Chill×1.1/Burn×1.25 Physical combos and
the existing half-strength boss combo scaling. No movement system or extra
Attack-conversion mechanic is introduced.

Descriptions now show actual computed current base damage, per-target attempts,
one payment/cooldown and ordinary/boss control rules in both languages. They
replace unsupported positional promises. Current/next/MAX data rows retain
the authored growth/cost/cooldown. Values come from the existing engine display
model; the UI only formats them.

## Causal/native proof

Forty-eight causal tests include rank1/2/20 ×seeds7/19/41/97 ×1/3/9enemy cases:
actual HP loss, independent unique targets and one MP payment, immutable inputs,
exact replay, ordinary runBattle equality and HP/MP/living-status playback.
Additional cases prove actual50%Physical resistance/10Defense and critical
damage with50%Physical increase; MP/cooldown refusal; no dead/friendly targets;
one attempted hit before lethal reflection ends resolution; native class,
unlock, transitive prerequisite, rank-cap and canonical-alias authority.

Leap Attack/War Cry exercise exact1700–2700ms ordinary and1700–2200ms boss
control, actual interrupted scheduled actions, resumed actions after expiry,
and no control on missed targets. Whirlwind separately proves both shared
status combos at ordinary and boss strength.

Eight native-store tests allocate the full real prerequisite chains during an
existing recording, leave that recording immutable and activate the attacks
next wave without refilling HP/MP. War Cry's prerequisite Shout/Battle Orders
passives correctly change the next-wave stat snapshot. Real save validation and
import roundtrip learned ranks/priority; only persistence I/O is faked. Saves
contain no transient combat state. Thirty-two real React cases cover four skills
×en/zh-CN ×rank0/1/2/20, current/next/MAX and unchanged player state.

## Validation and browser evidence

Corrected focused88tests/3files and focused lint pass. Corrected typecheck,
full repository lint, build and actual precache guard pass. Full lint began
before the test-only optional-field correction; the corrected four touched
TS/TSX files are separately rechecked. The corrected full suite passes15329tests
in703files, with two existing skips (712.56s Vitest/714.037s wrapper). Corrected
typecheck124.923s, full lint187.422s and build14.047s pass. Engine code/data are
unchanged; no new separate engine-only command is claimed. The full suite
includes the existing engine cases.

All1193`src/`files and761build files are frozen. The first freeze differs only
in an added optional-field fixture guard; production source/build stay exact.
The corrected full run starts after that guard. Actual emitted JS/CSS/entry
assets are present among755unique worker URLs. Large-chunk and generated-art
manifest precache warnings remain open, with no broad performance/PWA claim.

The production matrix has four skills ×en/zh-CN ×360×640/1280×800. Every case
uses public create/export/import, a declared synthetic L30/resource helmet/
prerequisite fixture, allocation rank1→2, skill priority selection, Enter/cast,
pause/flee and Save-close-new-page-Continue. Bash logs its single attempt;
each AOE case observes at least four attempt lines from the first cast segment.
Native causal checks independently establish per-target uniqueness and exact
attempt counts; the browser log can include a later basic before the next cast.

The initial16case reports pass, with32exact five-domain ordinary Continue pairs,
16additional actual offline fresh-page Continues and80five-size geometry
checks. All48initial screenshots are retained; four individually inspected show
mobile English Bash/Whirlwind, Chinese Leap Attack and desktop War Cry details.
The initial outer collector exits143after the helper logs server shutdown,
before writing its terminal result. The exact cause remains unresolved; this
collector is not called a successful command. A separate helper-lifecycle probe
exits0. The browser matrix is rerun in four groups with independent terminal
receipts: en36094.300s, zh-CN36094.044s, en1280102.538s and zh-CN1280
102.546s, all exit0. The final independent audit verifies16cases/32ordinary
pairs/16offline pairs/80geometry and48screenshots. Four final screenshots are
individually inspected, matching the four initial views. All eight inspected
views have readable skill details and no horizontal clipping; lower mobile rows
scroll below the fold. Existing missing icon glyphs are not repaired here.
No application change is made for the collector interruption.

Synthetic pools/equipment, fixed combat Date.now and imported ranks prove
mechanics/public flows, not earned builds, campaign pacing or balance. Layout
checks cover horizontal overflow and a44px allocation control at five sizes;
they are not a complete accessibility audit.

## Retained failures

The first32description cases fail before the prose repair. Four subsequent
fixture failures wrongly assume an allied merc takes no enemy damage during the
whole battle. They are corrected to account for actual hostile HP loss while
still asserting no friendly/dead skill targets. No runtime targeting change.
Eight template-expression lint errors are corrected using explicit String().
One exact-optional-property TypeScript error is corrected by requiring the
native fixture's allocation projection before constructing its CombatUnit.
The first full suite is deliberately stopped on its verified owned Vitest PID
(exit143), then rerun on corrected frozen inputs; it is not a pass. No test
assertions are suppressed, skipped or weakened to accept a mechanic failure.

## Next reproduced failures and remaining scope

[Howl BUG223](../../../production/bugs/BUG-223-howl-missing-control.md): all12
legal native cases allow enemy actions at2000ms inside the1700–2700ms marker.
[Taunt BUG224](../../../production/bugs/BUG-224-taunt-missing-forced-target.md):
six of12cases attack the merc despite the living caster and active marker.
Both probes preserve immutable inputs/exact replay and all observations before
the deliberate terminal failure. The stronger version leaves the hero unstunned
throughout the marker; its hold starts2701ms. The original held-caster probe is
retained separately. These are reproductions, not repairs or functional credit.
They join [Battle Cry BUG221](../../../production/bugs/BUG-221-battle-cry-missing-debuff.md)
for the next warcry-control batch.

Exactly Bash/Whirlwind/Leap Attack/War Cry receive bounded functional credit:
121bounded/90unverified/one engine-only/one review-needed,213IDs/order preserved
and209other inventory rows byte-exact. Barbarian23/30. All1193committed source
blobs match the final frozen inputs.

Root supplies author security/plan/code review only. Genuine Ancients/Rite save
SHA256 remains`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared.
C0/C1 retain their original exits; C2–C4/fullG0–G7,213skills/two earned builds
per class,30–50-hour pacing/economy/endgame and full privatev1 remain unfinished.
The umbrella goal/worktree/claim stay active. No genuine campaign or remote action.

## Retention and cleanup

[Author review](fixtures/barbarian-basic-aoe/author-review.json),
[browser audit](fixtures/barbarian-basic-aoe/browser-audit.json),
[save audit](fixtures/barbarian-basic-aoe/save-pairs-audit.json) and
[freeze audit](fixtures/barbarian-basic-aoe/freeze-audit.json) describe bounded
checks. [Committed source](fixtures/barbarian-basic-aoe/source-delivered.json)
and [inventory audit](fixtures/barbarian-basic-aoe/inventory-audit.json) establish
only the bounded scope above. [Terminal results](fixtures/barbarian-basic-aoe/terminal-results.json)
retain final passes separately from actual failed/stopped attempts.

[Raw packet](fixtures/barbarian-basic-aoe/packet.json) verifies493archive members
in a9,229,788-byte compressed archive, including both browser runs and both
warcry probe versions. Duplicate761build assets are represented by frozen hashes.
[Cleanup](fixtures/barbarian-basic-aoe/cleanup.json) removes1254exact task-owned
files after archive/member/build verification. All46recorded PIDs are absent,
ports4504/4505are closed, the tool-managed recorded browser profile is absent,
and scratch is absent with remaining[]/failures[]. Source/history, evidence,
shared caches/tools and the active umbrella worktree/branch/claim are preserved.
