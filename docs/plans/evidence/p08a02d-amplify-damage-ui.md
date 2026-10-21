# P08a02D — Amplify Damage truthful bilingual Skills detail

## Bounded result

BUG070 is a presentation defect. Generic utility prose bypassed Amplify Damage's
existing curse semantics, and the older translations said50%/several turns.
Source `857164c` adds one existing-style formatter using the immutable JSON-derived
`AMPLIFY_DAMAGE_DEFINITION`, and maps its canonical/legacy status labels to the
existing translated skill name. Both descriptions now state all living enemies,
physical resistance reduced by50 percentage points for3seconds at every rank.
Duration divides milliseconds by1000 without integer rounding. Existing tag-only
`amp-damage` and unrelated labels retain their translations.

Exactly four source paths changed: component, new focused test and both skills
locales. No engine, data, schema, store, save, tuning or shared framework change.
Authored L1/no prerequisite and existing mana/cooldown rounding remain: rank1
current15/3s→next15/3s; rank2 current15/3s→next15/2.9s; rank20 current11/2s→maxed.
These are display literals, not unrounded engine cost/cooldown claims.

## Actual reproduction and validation

Baseline app `6e39e4d`; prerequisite BUG/control `788e052`. Test drafts were corrected
before execution: V1→V2 added actual in-memory legacy/tag/unrelated display fixtures
and combo availability; V2→V3 changed English Poison to existing Poisoned; reviewed
V3→V4 corrected the tag label oracle from Amp Damage to its existing translations
(Amplify Damage/增幅伤害). These are unexecuted draft corrections, not failed runs.
Frozen V4 ran against unchanged production UI:26cases,14failures (10missing prose,
2legacy labels,2Chinese canonical labels),12passing controls;7.879s/exit1.
The same unmodified V4 test then passed after the minimal source/copy correction.

| Gate | Result | Wrapper elapsed | Bound |
|---|---|---:|---:|
| Focused V4 |26passed|6.942s|30s|
| Typecheck V4 |pass|12.741s|90s|
| Lint V4 |pass|32.011s|90s|
| Full units V4 |5470passed/202files,0failed/pending/todo|91.598s|120s|
| Clean production bridge/build |pass;4chunks scanned|9.559s|210s|
| Browser increment types |pass|12.701s|90s|
| Browser increment lint |pass|34.106s|90s|
| Production Chromium |2passed,0unexpected/skipped/flaky|23.554s|240s|

Focused tests pin literal50percentage points/3seconds at ranks1/2/20/unlearned,
current/next costs and cooldowns, cap/L1/no prerequisite, allocation aliases,
localized canonical/legacy statuses and unchanged tag/Poisoned labels. An actual
registered debuff is replaced with1ms/1point, while immutable authored UI values
remain50/3000. Actual authored display fixture replacement restores its original
array entry in finally. Native learning0→1→2 changes the whole player only in exact
rank/point fields; no point refusal, combo availability without auto-add, and real
recorded-wave learning/upgrade preserve all recording values and original event-array
identity. Imported ranks/points/Teeth are scaffolding, not earned progression.

All gates ran serially without source edits. No engine edit or separate engine
rerun/RED is attributed. The ordinary15s full-unit target is missed; the reviewed
120s bound passes. Existing Browserslist-age, >500kB chunk and2.57MB manifest-not-
precache warnings remain. No performance acceptance follows.

## Production browser observations

Browser commit `67034d6` adds two paths and uses clean production preview, no bridge
or hidden store mutation. App source matches the accepted build; browser-only edits
do not justify claiming duplicate full-unit/build/engine validation. Fixed Date
preserves native simulation/playback timers. Actual first attempt passed en10.221s
and zh-CN10.155s; report22.419855s, wrapper23.554s, no retries/skips/flaky tests.

Fresh Necromancer L1/1point precedes explicit imported L1/Teeth1/2points/Teethcombo.
All nine slots exclude the unlearned curse. Native Allocate+Enter learns0→1→2;
whole exported player equals preparation except exact points/rank changes.
Current MP15/CD3 and next CD3 then2.9 plus localized status/prose remain truthful.
Paused native wave DOM log/cards/resource bars remain equal after both allocations.
Full hidden recording/event identity is unit-only proof. Explicit Flee precedes
combo editing. Native option-index Home/ArrowDown/Enter adds curse slot2; ordinary
removal/readdition retain Teeth slot1. Existing combo-edit replay is preserved.

Explicit Save→Saved→close page→new page→Continue under the same Date preserves
entire SaveCurrent including meta, then detail and both combo slots. This is finite
Chromium/same-context disk-save evidence, not all-browser storage acceptance.

Each locale checks nine CSS sizes:360×640,412×915,640×360,375×667,393×851,768×1024,
1280×800,1920×1080,915×412. Eighteen original screenshots,14px prose, minimum measured
controls80×48,486/486 clear grid hits and no horizontal overflow. Actual Chinese
font use is Noto Sans CJK SC33glyphs plus DejaVu Sans4glyphs; both page console
warning/error arrays are empty. Command logs separately retain Node color warnings.
Small/landscape screens scroll to remaining stats. Existing unrelated nav/skill-node
glyph boxes remain visible. Native Enter/select keys do not establish Tab reachability
or full accessibility. No native Amplify cast, earned campaign, mercenary, balance,
performance, native touch or all-browser acceptance is claimed.

## Provenance and disposition

Independent GD/TD/QA/producer approved source `857164c`; QA approved concrete browser
config/spec/contract before installation. Final GD/TD/QA/producer approve bounded browser acceptance and BUG070/P08a02D
closure. QA personally viewed all eighteen original PNGs; root viewed two original
360×640 screenshots. All readers released before output cleanup. Nine bounded command records contain932unique PID/birth identities;
fresh checks find all absent including zombies, zero errors/signals. All17 browser
freeze hashes match at browser execution, before any later closure-document edits.

Root owns RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amplify-ui-0bebeotd`.
Source drafts, original failures/reviews, all logs/reports/browser bodies/33extracted
attachments/18PNGs and fingerprints remain. After browser commit `67034d6` and all readers released, root freshly verified
17 source hashes and 932 absent process births, then removed exactly 761 files /
40,979,677 bytes (760 build files plus task Vitest result) and ten dist directories.
No outputs remain and no cleanup failed. Shared Vitest cache parents are retained. Lossless durable archive and independent byte
verification must precede exact RAW cleanup. Preserve empty RAW root, shared cache
parents/dependencies/fonts/browsers/tools/source/history. FullD04/P08/C1/private-v1/
C0–C4/G0–G7 remain open. No remote action.
