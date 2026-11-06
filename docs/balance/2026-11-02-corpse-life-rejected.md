# Corpse Explosion corpse-life experiment — rejected, 2026-11-02

The provisional 50%-of-consumed-corpse maximum-life addition is rejected under
its frozen retention rule. All 13 candidate source/test/UI files are restored
to their exact pre-experiment bytes. The separately justified corrections to
two summon tests remain. Authority57 and an independent file enumeration verify
all 2,141 inputs: only those two tests differ from authority55; production and
game data match55. Accepted balance cells remain **0/210**; full v1 is unfinished.
The [proposal](../plans/decisions/P15-corpse-life-scaling-v1.md) is historical,
not the current skill contract. D06's original flat Fire curve remains active.

| Outcome, 100 paired seeds | Baseline | Candidate |
| --- | ---: | ---: |
| Full-area wins | 5 | 97 |
| Defeats | 32 | 3 |
| Draws/timeouts | 63 | 0 |
| Intended elite reached | 39 | 100 |
| Intended elite won | 21 | 99 |
| Victorious full-area median seconds | 133.061 | 46.564 |

There are 92 loss→win pairs, five win→win and three loss→loss; no baseline-win
regression. However, seeds29/84/93 change from timeout to defeat, violating the
predeclared prohibition on newly fatal seeds. The aggregate improvement does
not override that rule. No further coefficient was fitted to these outcomes.

## What the failures establish

An authenticated retained-log reader examines all six baseline/candidate raws
for those three seeds, without new combat. Each baseline times out at wave2.
Candidate29 wins wave2 and dies at wave3; candidates84/93 win through wave3
and die at wave4. Thus these are additional-exposure deaths, not a measured
same-wave survival regression. Candidate terminal-wave minimum mana is389/391/391;
mana starvation is not supported. The actual mercenary entry/end resources,
incoming direct/periodic damage and skill timestamps remain in the diagnosis.

This finding does not reverse rejection, prove safety or establish an engine
defect. Stop coefficient sweeps and curse-timing adjustments on this retained
sample. The next balance work must use the planned intended-power/first-clear
fixture review, matched-role populations and disjoint holdouts, preserving
whole-area failures and legal retry/adaptation costs. Faster advancement alone
must not be described as proof that the same encounter became less survivable.
The formal acceptance bands and all 210 cells remain unchanged and open.

## Verification and corrections

The candidate completed100 new areas in57.007 execution seconds, using100
authenticated baseline areas and retaining14,913,181 compressed raw bytes.
The separate reader reconstructs859 wave settlement deltas and verifies1,263
retained-unit HP/mana/cooldown transitions. No combat was replayed for analysis.

Reader v1 incorrectly compared historical baseline origins at authority52 to
the immediate pre-candidate authority55. The frozen policy already records
the exact four-file noncombat52→55 bridge. Reader v2 checks historical origins
against52, authenticates that bridge, the original frozen reader and its own
exact documented corrections. The original reader/policy/failure log remain.
No outcome or retention condition changed. A diagnosis v2 also corrects the
mercenary kind identifier (`merc`, not `mercenary`); its v1 remains superseded.

Before simulation,490 distinct affected cases across10 actual files passed,
with scoped strict types/lint and catalog schema loading. Those candidate
passes do not make rejected code current. The two retained summon-test files
contribute183 passing cases:122 engine and61 native. Their old expected stats
predated [approved owner-level growth](../plans/decisions/P15-skeleton-owner-growth-v1.md).
The replay mana expectation is independently reconstructed as
`300 - 2*15 - 2*8 + floor(5*3.88) + 12*50 = 873`, with0.4 fractional carry and
zero compensation. Exact replay/carry equality remains asserted; no skips or
weakened assertions were introduced. Temporary instrumentation was removed.

Rollback verifies original hashes and preserves those two corrections. Earlier
valid checks on the restored source are reused; no broad suites or browser
checks of discarded UI are repeated. Candidate bytes remain archived for review.

## Evidence custody and remaining scope

Root retains this packet through full-v1 review:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.

- `p15-corpse-life-v1.policy.json`, `.json`, progress/run logs and100 candidate
  compressed raws: frozen policy, completed run and all outcomes.
- `p15-corpse-life-v1-readback-v2.json` and `-reader-correction-v2.json`:
  independent reconstruction and exact correction record; v1 failure retained.
- `p15-corpse-life-v1-fatal-seed-diagnosis-v2.json`: six-raw exposure/resource
  diagnosis; v1 explicitly superseded.
- `p15-corpse-life-v1-original-bytes.json`, `-rejected-bytes.json`,
  `-stale-summon-test-original-bytes.json`, `-rollback-v1.json` and
  `-rollback-readback-v1.json`: exact restoration, review and custody.
- `p15-campaign-harness-source-audit-v56.json` and `-v57.json`: candidate
  authority and current restored production authority.
- Affected green logs, initial failures and scoped type/lint evidence remain.

All task processes are terminal and the exact simulation/authority Vite caches
are absent. The worktree and packet remain required, with root responsible for
eventual cleanup/release. No install, commit, push, publication or source-checkout
edit occurred. Browser works; CI excluded; no pending answer or external blocker.

Still open: Corpse/curses progression and population balance, fresh campaigns
and acquisition/funding fairness, independent holdouts, representative recruitment
and Hell economics, defeat/retry/manual-idle, BUG592 initial inventory opening,
calibrated30–50 active-hour pacing, integrated G0–G7, two-hour soak and independent
review before owner playtest. This experiment accepts none of those requirements.
