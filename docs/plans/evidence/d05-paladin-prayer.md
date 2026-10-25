# D05 — Selected Prayer healing

Runtime commit `96a67cb`; local implementation and verification only.
Independent design/QA and earned class/build balance remain open.

## Delivered behavior

Prayer now restores actual HP through the existing selected-aura projection,
wave-local timeline and ordinary heal settlement/playback. JSON owns 20 base HP
and a 5,000 ms interval, with the first heal one full interval after wave entry.
Each recipient restores floor(base × (1 + 3% × allocated rank)), capped to missing
HP: ranks 1/2/20 give 20/21/32. The five-second interval is a provisional local
default, not inferred from turn markers or independently accepted balance.

Only the living hero and original living fielded merc heal while the source hero
lives. Crowd control does not suppress healing. Existing periodic damage/deaths
settle first, then healing, then surviving tied actions. A due 60,000 ms heal is
included; action-cap/battle-end stops never fabricate future healing. Full units
skip without banking or an event; dead units never resurrect. No mana, cast,
cooldown, action slot, RNG, implicit Vitality regeneration or saved-stat mutation.

Strict Prayer-only `auraHealing` metadata requires exact finite positive amount
and integer interval 1,000–60,000 ms. Definitions/native/direct input independently
copy and freeze it, rejecting missing, foreign, unknown-key and invalid tuning.
Learning neither selects nor refills. Ordinary changes apply next wave. Existing
explicit configuration replay retains original wave teams/resources/seed and
composes current selection without income; identical configuration reproduces
the original recording. Save v22 already permits Prayer: no migration or saved
healing timer/potency/carry. Both locales describe the actual formula and limits.

## Verification

| Check | Result |
| --- | --- |
| Focused corrected regression | 80 tests / 5 files pass |
| Final engine regression | 6,148 tests / 211 files pass |
| Final full regression | 12,309 tests / 521 files pass; two existing skips |
| Final typecheck, lint and engine purity | Pass |
| Production build with explicit `VITE_E2E=false` | Pass; existing warnings remain |
| Bridge scan | Four chunks, five forbidden patterns absent |
| Final production browser | Four language/viewport cases pass |

The full process took 500.409 seconds. All 1,235 source/test/config hashes,
760 build hashes, HEAD/Git state and genuine save digest stayed exact through
that run. All 1,235 committed source blobs were separately checked against the
validated hashes. These checks do not close existing suite-time, bundle or PWA
budgets, intermittent BUG180, or independent acceptance.

Original failures are retained: core 9 failed / 1 control; UI 4 failed / 25 passed;
one later Freeze/Shatter fixture failure; first broad engine 6,146 passed / 2
fixture failures; an incorrect explicit-replay expectation; three strict-type
errors; four lint errors; and the first attachment-auditor assumption. Fixture
corrections isolate Bleed from Poison death spread, separate source CC from later
Shatter deaths, measure actual missing HP despite zero-floor damage rolls, and
respect existing current-configuration replay semantics. No timeout, worker,
skip, threshold or gameplay rule was weakened to pass.

## Browser and integration scope

Final browser coverage is en/zh-CN × 1280×800/360×640. A fresh level-one Paladin
learns through public Allocate, remains unselected until explicit selection,
then clears to None. Eight Save → close → new-page Continue pairs compare all
five complete player/inventory/map/mercs/formation domains. A separate attachment
audit repeats equality and verifies starting Holy Fire/Zeal allocations plus only
Prayer rank 1, skill points 0, and unchanged derived stats, inventory and map.
The first auditor wrongly assumed empty starting allocations; original retained.

Twenty geometry samples across 360×640, 412×915, 640×360, 1280×800 and 1920×1080
show no horizontal overflow and all 16 radio labels at least 44×44. No captured
page errors or production test bridge. English desktop and both-locale mobile
detail screenshots were inspected; mobile captures are scrolled views with the
existing fixed navigation. Earlier successful browser evidence remains distinct
from final-build proof.

Native HP/replay/import checks invoke the real engine with explicitly synthetic
L30/depleted-resource/large-gear/low-attack scaffolding. They prove actual HP
restoration, original-resource replay and no duplicate income, not earned build
balance. Browser learning proves the ordinary fresh control, not campaign
viability, whole-screen accessibility, offline/PWA acceptance or pacing.

## Retention and remaining scope

The [manifest](fixtures/paladin-prayer/manifest.json) retains 158 original files
and 26 terminal process records, all byte-verified. Resolve logical
paths through each entry's `member`; the archive deduplicates identical contents.
It includes original failures, reusable scripts, successful outputs, source/build
hashes, saves and screenshots. [Cleanup](fixtures/paladin-prayer/cleanup.json)
removed 918 exact task-owned files, verifies scratch-root absence and
preview port4465 closure, and reports no failures or remaining paths. Shared
caches and older campaign evidence remain.

Only Prayer gains a bounded-functional disposition. The 213 IDs remain:
161 unverified, 50 bounded-functional, one bounded-engine-functional (Ice Arrow)
and one review-needed (Cold Mastery). Those 51 bounded records have different
proof scopes. Fifteen of 20 Paladin auras now have supported effects; Sanctuary,
Cleansing, Redemption, Vigor and Concentration remain under BUG181.

The genuine claimed Ancients401/Rite save remains L33 / XP149261 / 23,682 gear /
next Normal402. Its decompressed SHA256 remains
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, diagnostic-save promotion or remote publication.
Baal, C2–C4/full G0–G7, seven classes/two builds, all skills, economy/pacing,
endgame/offline/PWA/accessibility/performance and independent acceptance remain
open. The full private-v1 goal, branch and claimed worktree remain active.
