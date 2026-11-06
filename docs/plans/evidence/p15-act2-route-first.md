# P15 — Earned Act II attempts before recovery training

2026-11-04 local date. The opt-in
[route-first policy](../decisions/P15-act2-route-first-v1.md) is implemented and
one bounded Bow continuation completes Act II at level17, starting at level13.
It attempts each area at actual earned power; only a settled loss authorizes
training to the failed attempt's terminal level plus one. The former controller
trained toward planner maxima18/20/22/26/28/32 before first entry. Historical
level32 results remain valid under their original acquisition policy, but are
not representative first-entry power. Production combat, data and saves are
unchanged by this increment.

## Controller and verification

The eight-file increment covers the Act II controller/audit, native and CLI
dispatch, execution policy, outer recovery audit and their regressions. It
skips both boundary and first-entry training, preserves the real quest graph
and income, permits at most three route attempts per area, and enforces the
level32 ceiling plus inherited training/nonwin bounds. Recovery selects a
previously cleared area whose complete challenge maximum is at least two
levels below the hero. An audited continuation retains pending recovery and
spent budgets. Technical, interrupted or mismatched failures cannot authorize
training or retries.

- The final affected recovery selection passes26 cases, with120 intentionally
  filtered skips. Earlier route-first controller/dispatch selection passes21,
  with118 filtered skips. These are overlapping selections, not47 distinct tests.
- Scoped strict TypeScript passes with zero diagnostics across993 transitive
  files, including the native driver/freezer. Explicit `--no-ignore` ESLint
  passes with zero warnings; CLI `node --check` passes. These are scoped checks,
  not a full-project certification. Saved after-hashes still match all eight
  repository code files; this documentation continuation requires no rerun.
- [BUG736](../../../production/bugs/BUG-736-act2-recovery-source-audit.md)
  fixes an outer audit that accepted Act II string prefixes but rejected valid
  cleared Act I recovery areas. Canonical area identity and `actId` now own that
  check; detailed eligibility, custody, overlap and unmatched-loss checks remain.
- [BUG737](../../../production/bugs/BUG-737-retained-reader-mercenary-death-carry.md)
  fixes only a versioned external reader. The mercenary dies at Lost City
  ordinal120/wave3; native carry correctly omits it from wave4. Reader v2 checks
  entry identity and exact living carry, with seven negative controls plus nine
  admission-accounting controls. Original v1 reader/failure remain.
- [BUG738](../../../production/bugs/BUG-738-retained-analysis-health-orbs.md)
  fixes only versioned external analysis: health-orb events restore life
  separately from skill `heal` events. Ordered life accounting and four negative
  controls pass. Original failing v1 analysis remains; no analysis JSON was
  created by that failed attempt.

Root reviewed the exact558-line incremental patch against retained before-files
on correctness, readability, architecture, security and performance. The code
keeps opt-in historical policies, uses existing canonical resolver/settlement
paths, bounds work and adds no dependency, network or production permission.
No required finding remains in that increment. This is self-review and separate
retained-output verification by root, not independent final approval. Security
check: pass; local authorized controller/reader/docs only. No holdout data used.

## Frozen experiment and result

The sole source is the retained earned Act I Bow completion at level13, next
Normal ordinal117, SHA256
`c55f62c61e47ef8edd4e634051b346583f7a308177ee42a6c092a13ca6e356e2`.
No Act I route replay occurs; previously cleared Act I areas supply recovery.
The first freeze rejected historical/current profile mismatch before gameplay.
The corrected freeze explicitly pins exactly two previously adopted changes:
`bow-volley-once-learned-v1` becomes `bow-volley-at-target-v1`, and the hero
weapon policy becomes `physical-offense-v1` at level1. All other fields match.
The original rejected freeze/scripts/manifests remain. This is not a controlled
mode-only before/after comparison.

Prospective limits:100 admissions,7,200,000 combat ms,90,000 driver-wall ms and
64MiB compressed journal. Between-wave stopping preserves every settled reward;
a paid wave may overshoot timing thresholds. No limit is reached here.

| Area | Route ordinal(s) | Entry → terminal levels | Outcome |
| --- | --- | --- | --- |
| Rocky Waste | 117 | 13 → 13 | Win |
| Dry Hills | 118 | 13 → 13 | Win |
| Far Oasis | 119 | 13 → 13 | Win |
| Lost City | 120,134 | 13 → 14;15 → 15 | Defeat, then win |
| Arcane Sanctuary | 135,143,155 | 15 → 15;16 → 16;17 → 17 | Two defeats, then win |
| Tomb / Duriel | 156 | 17 → 17 | Win |

All40 admissions and180 waves reconcile: nine route admissions,31 recovery
admissions,177wave victories and three defeats. Recovery uses Burial Grounds
(20admissions) and Dark Wood(11);13 precede the Lost City retry and18 precede
the Arcane retries. There is no boundary preparation, interrupted/unplayed
wave or recovery defeat. All five Act II quest Claims arrive exactly once;
the exact native successor is level17/Normal ordinal157.

The branch earns381,322XP and1422items, salvages1290items and inserts28owned
socket materials. Separate readback conserves ordered item custody, currency,
materials, XP, points, companion hire/death carry, quest transitions, clock,
seeds and ordinals. All2252 production inputs and135 campaign contracts remain
stable. It does not independently derive damage/loot laws, planner levels,
equipment scores or mercenary XP.

Total branch combat is1,563,980.808ms(26.07minutes). Recovery accounts for
1,162,217.222ms(19.37minutes); route attempts account for6.70minutes. Driver
wall time is27.624seconds and measured wrapper time32.734seconds. Retaining
all parent costs gives157 admissions and1.48773 combat hours through Act II;
combined driver/wrapper times are51.728/69.854seconds. Combat excludes reading,
menus and decisions, and cannot certify the12-hour Act II or30–50 active-hour
campaign target. This substantial pacing gap remains an explicit P15 concern.

## Duriel pressure in this sample

Duriel wins no wave here: the player defeats him in32.871 simulated seconds,
inside the proposed20–50second band for this one sample. Hero/Prayer levels
are17/18. Hero enters419/470HP and finishes317HP; minimum observed life268HP.
Recorded incoming damage is279physical+6cold, offset by160actual skill healing
and23health-orb healing. The first critical Charge removes156HP. Defense190,
physical resistance32% and cold68% are earned, rather than synthetic mitigation.

Recorded outgoing direct damage is4462from hero and21,194from mercenary
(82.61% of the total; these event totals may include overkill). Mercenary attack
is349, hero attack107. These are diagnostic contribution/pressure observations,
not grounds to certify a win rate or tune all builds from this single branch.
BUG731 stays open. Next qualify a bounded representative melee/caster/summoner
set at earned first-entry states, reusing retained Act I sources and this
controller; do not repeat broad completed campaigns or tune against forced32.

## Required evidence and cleanup

Root retains this exact packet through full-v1 acceptance, then removes it
after all consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-route-first-02brsjk1`.
It contains source snapshots, exact incremental patch/manifests, RED/GREEN and
scoped checks, rejected/corrected freezes, native report/journal/export, process
receipts, both reader/analysis versions, self-review and final cleanup receipt.
The native run and reader/analysis are terminal; the exact cache is absent.
No disposable task path or live owned process remains, as verified in the final
cleanup receipt. The packet itself is required evidence, not disposable output.

| Artifact under `bow-route-first-v1/` | SHA256 |
| --- | --- |
| `bow-route-first-v1-plan.json` | `8eec3d4eccd67a664f2d21e260fbba0b5a70360e81ef6766bc9448d3f0d466a1` |
| `bow-route-first-v1.json` | `56304d48f4f8089f7331d211e5bda9cb00a4f76b90e228390238f75889870891` |
| `bow-route-first-v1.journal.jsonl.gz` | `28bba1fb0d1a9ecf30c215000d46db8461dde323b459be8544c3b775b2467974` |
| `bow-route-first-v1.native-export.json` | `72d75e2b70dabe01369a6c442ddd0961876ccb904d959881b62920f08379dac3` |
| `bow-route-first-v1-readback-v2.py` | `f8bf83bec17c3c491fde6522a3fde7029b7a2359c3565315f4b6781eb7f1a687` |
| `bow-route-first-v1-analysis-v2.py` | `23ff13cb016c900ba124de3422e7b57ebd76c081380d71881a8ec26b180b84b8` |
| `bow-route-first-v1-analysis-v2.json` | `58cc4b27ef5cf62f406efe4864ec078db7f7606ceb20a06c51188a2cff8bb28d` |

Counts remain14/14 intended Normal completions,210/210 supplemental candidate
sources and0/210 formal balance acceptance. Full privatev1 and broader
acquisition/economy/pacing, difficulty/endgame, app/mobile/a11y/performance/PWA,
soak and independent acceptance remain unfinished. Browser works; CI is
excluded; no pending question or user hold. The preceding goal turn was a
status-only report and made no implementation progress. This continuation
resolves retained analysis and completes durable review/evidence; no combat or
broad test suite is replayed. Existing human2 claim stays owned by this session.
