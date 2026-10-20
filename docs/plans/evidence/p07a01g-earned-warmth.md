# P07a01g — Ordinary earned Warmth production evidence

Date: 2026-10-20. Status: accepted bounded ordinary-earned production/save proof; root, producer and QA APPROVE / ADEQUATE.
Runtime: `775eab7`, with independently accepted P07a01f recovery and store adapter.
Controlling contract: [D05](../decisions/D05-warmth-recovery-v1.md).
Regression: `tests/pwa/warmth-earned.spec.ts`, dedicated production PWA config.

## Ordinary route and evidence boundaries

Fresh Sorceress at fixed Date `2026-10-20T12:00:00.055Z`, Fire Bolt rank1 as the
sole nine-slot combo entry, ordinarily hired free Inner Sight mercenary. Native
timers run normally; no injected game/save state, fake elapsed timers, debug
bridge, or direct store access. DOM observers own only their sampled test data.
IndexedDB access is read-only and used only to compare committed saves.

Win only wave1 on challenge ordinals0–4, worth160/180/200/220/240XP. Flee paused
wave2 before any additional award. Learn Warmth1 during paused ordinal1 wave1;
upgrade to Warmth2 during paused ordinal4 wave1. The paused DOM remains exactly
equal across allocation, and resumed literal observations prove the old rank.
The automatic next wave uses the fresh rank. No manual wave reset or combo
change substitutes for the transition.

Final hero is L3,335/1558XP,10stat points,0skill points, unchanged Energy35,
Fire Bolt1/Warmth2. Total earned XP1000 equals100+565+335. Mercenary earns750XP
and reaches L4,446/527XP. The test compares the whole expected player, including
unspent core stats, true maxima, persistent pools, skill ranks and combo. Loot
is an observed persistence baseline, not an asserted loot-distribution oracle.

## Independently reviewed literal boundaries

| Recording | Hero casts | Enemy actions | MP | Rank counterfactual |
|---|---:|---|---:|---|
| Ordinal1 old wave1, rank0 after learning1 | 7 | Quill Rat B,7th | 99 | rank1 would100 |
| Ordinal1 fresh wave2, rank1 | 7 | Shaman B,6th | 101 | rank0 would100 |
| Ordinal4 old wave1, rank1 after upgrading2 | 4 | Fallen I,4th | 108 | rank2 would109 |
| Ordinal4 fresh wave2, rank2 | 3 | Shaman C,3rd | 109 | rank1 would108 |

Each assertion requires ordered cap,8MP spend, then literal log tail and MP
with the exact hero/enemy action counts. Observer indices and wall-clock log
timestamps are not oracles. Simulation boundaries are10780/10920/6960/5460ms;
fixed Date makes displayed log timestamps identical. Current rank2 composed
rate is the represented Number `7.5600000000000005`, not a rounded7.56.

Old rank1's resumed first critical is74 fire damage after the upgrade; rank2
would75. The reopened supplementary battle ordinarily unfields the mercenary
before entering fresh ordinal0, removing its RNG draws, and checks the rank2
critical75. This supplements the actual old/new-wave proof.

Cast-name canonical fallback `sorceress.fire_bolt` is observed identity;
BUG033 still tracks localization. Warmth remains passive and outside the combo.

## Persistence and matrix

The test compares full export before/after Save, read-only IndexedDB, close,
new-page Continue, committed IndexedDB, and another full export. It also checks
retained locale, all nine combo slots, Warmth2 passive tooltip1%→2% fire and
4%→8% regeneration, production bridge absence, and no horizontal overflow.
Transient regeneration/carry/integral/damage metadata must be absent from saves.
Console warnings/errors and page errors are collected on both pages.

Cases: en/zh-CN ×1280×800 desktop/360×640 mobile. Retries0; per-test180seconds.
Final native matrix: **4/4 passed**,0 failed/skipped/flaky/retries; runner212.159s,
checker wall213.547s. Desktop en98.347s, zh-CN100.591s; mobile en97.175s,
zh-CN99.320s. Both pages in every case asserted empty warning/error collections.
After reopen,110cap→102cast→103MP at Fallen B’s first1740ms action proves
recovery resumes. The previously reviewed109vs108 boundary distinguishes rank2.

Frozen spec SHA256:
`128eb18a49bb38093403a45015ae068771d33dc4c5bf1b2855df1bbb31d30d03`.
Config SHA256:
`ca32c864e08d64c5eaf1554b98cf00289bffb3b346746b4a2ca68a991bfde837`.
Final native JSON reporter SHA256:
`af1f1ea2150d479a87a7e8732b177874d53dae15e730671f1d0ec21f5fbdd0ca`;
raw log SHA256:
`cf90c3d39ccb961a68c9901dd4edb123f35ac5f4b8b907081af637ce0781a07b`.
The report retains both earned-wave and reopened DOM timeline attachments for
all four cases, including the ordered literal boundaries.

## Validation, review and cleanup

Native discovery passed84.868seconds, errors[], with expected earned player and
mercenary progression. Root, producer and independent QA APPROVE / ADEQUATE
bounded discovery and final test design. Supplementary75, Chinese literals and reopened102→103
now pass in all four final native cases. Root, producer and independent QA
reviewed all raw reporter attachments, source and command outcomes: APPROVE / ADEQUATE.

After all consumers finished, root removed and verified the exact task scratch
`/tmp/d2h5-root-warmth-g` (136 files,24 nested directories), task-owned `dist/`
(760 files,9 nested directories) and `node_modules/.vite/` (1 file,1 nested
directory). Installed dependencies/browsers and source/history are preserved.
The commands below name historical evidence destinations; raw logs were consumed
before deletion, with decisive results/hashes preserved here. Ports4387/4388
verified closed. Root worktree2 remains claimed for continued full-v1 work.
No publication.

Exact final browser command (environment):

```sh
PLAYWRIGHT_BROWSERS_PATH=/home/felixzhao/.cache/ms-playwright PWA_PORT=4388 \
PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/d2h5-root-warmth-g/earned-warmth-final-report.json \
npx playwright test --config tests/pwa/playwright.config.ts warmth-earned \
  --output /tmp/d2h5-root-warmth-g/pwa-final-results --trace off --reporter=line,json
```

Typecheck exit0/wall9.600s; explicit ignored-test-file ESLint
`npx eslint --no-ignore tests/pwa/warmth-earned.spec.ts tests/pwa/playwright.config.ts --max-warnings=0`
exit0/wall5.590s; complete `npm run lint` (including engine purity) exit0/wall25.860s.
The browser webServer command builds real production and verifies the debug
bridge is shaken out. Existing build chunk/precache, Browserslist-age and
NO_COLOR/FORCE_COLOR tool warnings remain; no browser-page warning/error.
Earlier complete combined runtime validation is recorded in BUG038; this child
changes only browser regression/config/evidence, with no runtime edits.

Engine/related/full-suite timing budgets and existing build chunk/precache
warnings remain open as recorded in BUG038. This evidence does not accept
whole C0–C4/G0–G7, campaign, offline/bundle performance or whole-screen a11y.
