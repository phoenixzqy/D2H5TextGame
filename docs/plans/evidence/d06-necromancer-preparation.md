# D06 v1c — Necromancer prepared retinues and BUG073

Status: accepted bounded engine/store, bilingual UI and production-browser slice.
QA, GD/TD and producer approved the integrated evidence. This extends
[D06 v1b](d06-summon-preparation.md) under the approved
[v1c contract](../decisions/D06-summon-corpses-v1.md). Full D06/P09/P10,
other corpse consumers, selected-item Iron Golem, Mage elemental combat identity,
earned progression/balance and private-v1/C0–C4/G0–G7 remain open.

## Delivered behavior

Raise Skeleton, Raise Skeletal Mage and Revive prepare one paid missing batch at
wave start. They require no corpse, consume no ordinary action, receive no later
retry/replacement/refund and rebuild next wave from carried resources. Existing
rank/cap/payment/position/identity rules and authored tuning remain authoritative.
Fresh eligible Skeleton/Mage units receive allocated Mastery once; Revive keeps
its generic rank-scaled minion and normal death/orphan/wave lifetime.

BUG072's shared cooldown root fix preserves valid finite positive input keys and
milliseconds for every initial unit. Only scoped startup ignores its own stale
cooldown. Ordinary unrelated skills now honor carried expiry. A separate existing
Meditation fixture used a 100-second synthetic cooldown to obtain repeated casts;
its reviewed prerequisite changes that fixture to 1 second without weakening
assertions. Native wave bookkeeping independently yields 820 MP / .7 carry;
historical failed 752 / .5 expectations remain retained.

BUG073's pure model accepts typed eligible current Mastery for current/next and
unlearned previews, restricted to exact authored/canonical Skeleton/Mage with
matching explicit templates. Malformed/absent context, Revive and lookalikes keep
base values. Shared stat arithmetic retains engine fractions and provenance
guards; SkillsScreen passes the current composed context and formats summon
values/deltas to at most four decimal places, suppressing rounded-zero deltas.
Bilingual copy accurately names no-corpse preparation, Mage physical basic attacks
and generic Revive units/lifetime. No save version, dependency or tuning changed.

| Commit | Increment |
| --- | --- |
| `faaee6d`, `1a0ec35`, `22d406d` | Separate engine/store/UI preparation regression coverage |
| `f630d26` | Preserve explicit synthetic legacy refund/playback control |
| `d541db8` | Meditation synthetic fixture prerequisite |
| `c80a7bb` | Canonical preparation and shared carried-cooldown correction |
| `151b329` | BUG072 record and production BUG073 reproduction |
| `0feb781` | Pure Mastery display foundation |
| `3408045` | Screen context, fractional formatting and truthful copy |
| `4cc41f0` | Eight production Necromancer browser cases |

## Validation and original failures

| Accepted slice | Focused | Engine | Full unit | Types / lint / production build |
| --- | --- | --- | --- | --- |
| Runtime | 212 / 4 files, 6.62s | 3101 / 83, 13.63s | 5981 / 209, 95.44s | 13.517s / 35.211s / 9.680s |
| Display foundation | 355 / 3 | 3141 / 83, 13.22s | 6021 / 209, 94.36s | 13.460s / 35.286s / 9.537s |
| Screen/copy | 104 / 3, 10.63s | unchanged accepted foundation | 6031 / 209, 94.26s | 13.321s / 34.144s / 9.567s |
| Browser-only | 8 Necromancer + 2 unchanged Raven | unchanged | unchanged accepted screen gate | 14.148s / 38.069s / exact accepted screen dist |

Command metadata preserves argv, PID, start time, exit and wrapper duration where
available; table units use Vitest duration and types/lint/build use wrapper times.
Final browser reports: 75.421s Necromancer (76.385s wrapper), then 24.024s Raven
(25.210s wrapper), serially; zero retries, flaky/unexpected/skipped cases or report
errors. Both page/console error arrays are empty. Four production JS chunks have
no game bridge symbols; no source/runtime injection or browser rebuild was used.
Normal engine3s/full15s targets remain missed; the large main chunk and excluded
2.57MB generated art manifest precache warning remain unresolved. Passing bounded
correctness checks does not grant performance/full-game acceptance.

All initial failures and corrections are retained. Foundation RED had ten genuine
mismatches and 34 controls; the original test-source snapshot was reconstructed
later by reversing two disclosed fixture changes (null control and removal of an
optional property). It was not captured at RED execution. The actual corrected
UI RED snapshot was captured, ran 14fail/8pass and is byte-identical to GREEN;
the earlier UI RED also had two selector errors. Initial type/lint/full attempts,
failed expectations and subsequent successful gates remain distinguishable.

Initial browser run failed its first case (seven not run): a 19-character
`Paid raise-skeleton` name exceeded native maxlength16 and became `Paid raise-skele`.
The captured startup was correct: 300→285 MP, one full-life Skeleton, one cast/
spawn at turn1. QA approved only explicit short fixture names and a fresh exported
name assertion; numerical/payment/event/layout/persistence oracles were unchanged.
Original source/config/report/log/error context and corrected snapshot survive.
The display-only `Mastery Correction` name (18 characters) became `Mastery Check`.
This fixture error was not a product startup defect. Root's earlier spoken
15-character limit was corrected to16; the retained diagnosis uses16.

## Production browser evidence and limits

Six native flows cover three skills × en/zh-CN. Each creates a character through
ordinary controls and imports explicit L30/Mastery20/prerequisite/two-point/
survival-gear/resources scaffolding through Settings. Native keyboard rank1→2
allocations preserve complete expected player state and paused combat recording;
combo selection/replay is separate. Bounded ordinary DOM observations (128 frames,
last eight logs) establish startup caps, exact payment, unique full-life summons
and cast/spawn/turn1 attribution. No `__GAME__` exists. Explicit Save→close→new
page→Continue preserves the complete SaveCurrent and combo. Imported scaffolds
are not earned progression, affordability or balance proof.

| Rank2 skill | Cap | One MP payment | Mastery20 Life / Attack / Defense |
| --- | --- | --- | --- |
| Skeleton | 1 | 300→285 | 219.6 / 37.8 / 18 |
| Mage | 2 | 300→278 | 171 / 46.2 / 12 |
| Revive | 2 | 300→255 | 162 / 30 / 19 (excluded) |

Two additional bilingual cases verify independent rank6→7 current/next text:
Skeleton291.6/49/22.8→309.6/51.8/24; Mage221.4/63/12→234/67.2/12;
Revive210/38/23→222/40/24 remains excluded. Exact clean deltas are asserted.
Gear uses authoritative L30 base mana203.5 and life362; affixes give1000MP/1mHP,
while imported current MP300 is retained. This is diagnostic survival scaffolding.

Nine finite layouts per native flow cover360×640,412×915,640×360,375×667,
393×851,768×1024,1280×800,1920×1080,915×412. Controls meet44px (minimum
observed48px), prose14px, hit grids clear and no horizontal overflow. Chinese
Noto Sans CJK SC glyph counts137/149/175 and Raven123 were measured via CDP.
Root opened all20 original PNGs at original detail (12 native,4 correction,4 Raven).
Long panels scroll; English mobile correction frames do not show every numeric
row, while desktop images and separate exact DOM assertions cover those values.
Navigation pictographs appear as boxes in this Linux font/browser environment,
including unchanged Raven; cause and cross-platform impact are not established.
This is not full glyph, native-touch, platform, accessibility, offline or
performance acceptance. The earlier reproduction's CJK cache mismatch was
recovered with task-only fontconfig/cache, preserving installed fonts and CSS.

## Scoped regression report

`regression-suite` report mode: no global `tests/regression-suite.md` exists.
The following is bounded mapping of existing tests, not a project-wide audit or
coverage percentage. BUG072 and BUG073 both have regressions; other systems were
not audited here.

| Existing regression | Covers |
| --- | --- |
| `src/engine/combat/summon-preparation-corpses.test.ts` | Canonical ranks/caps/payment, atomic invalid/poor/full/no-retry, ownership/preloads/death, Mastery/Revive and BUG072 input cooldown exact expiry/invalid controls |
| `src/stores/summon-preparation-corpses-native.test.ts` | Canonical eligibility, allocation/respec/gear, original resources/replay/carry and serialization without transient summon state |
| `src/engine/combat/skeleton-mastery.test.ts` | Retained historical synthetic Mastery recording and runtime provenance/exclusion controls |
| `src/engine/skills/displayStats.test.ts` | BUG073 current/next/unlearned aliases, fractions, caps, malformed/missing context/template and Revive exclusions |
| `src/features/skills/SkillsScreen.summon-preparation-corpses.test.tsx` | Bilingual truthful preparation, current allocated Mastery literals, deltas and live allocation changes |
| `tests/pwa/necromancer-preparation.spec.ts` | Native bilingual preparation/save/finite layout and BUG073 production display |
| `tests/pwa/summon-preparation.spec.ts` | Unchanged bilingual Raven regression |

## Durable retention and cleanup

[Packet](fixtures/d06-necromancer-preparation/packet.json) binds all safe regular
members of the lossless [archive](fixtures/d06-necromancer-preparation/raw.tar.gz),
current source/document fingerprints, original freezes/reviews/scripts/logs,
failed/passing browser reports with inline attachments, decoded original PNGs,
error contexts and exact inventories. Original D06 v1b evidence is preserved.
Every member is roundtripped against live RAW bytes before review/commit.
Historical source reconstruction and evidence limitations are explicitly retained.

Root owns RAW at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-necromancer-preparation-edsqysz8`.
After all readers released, accepted dist and task-only font cache/browser temp
were exactly verified then removed:787files/42,013,832bytes; no failures.
The two older superseded builds were already removed by their separate receipt.
All66 observed command PIDs are absent including zombies; original wrappers did
not record historical birth ticks/all descendants, so this is not comprehensive
birth telemetry. Current Node/Chromium executable/cwd/argv scan finds no task
consumers and ports4375/4376 are closed. No processes were killed.

Independent archive/closure reviews and an exact five-path commit must precede
RAW deletion. The archived cleanup script rechecks committed packet/archive,
every member/live byte and exact sets, fingerprints, absent PIDs/task consumers/
ports/outputs and clean original checkout. It unlinks only exact verified files
and removes exact empty child directories, preserving empty RAW root/shared
parents, fonts/tools/dependencies, source/history and the umbrella worktree.
Packet cleanup is pending until its actual receipt is recorded. No remote action.
