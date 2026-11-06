# Double Throw unlock-time reset — 2026-11-03

The intended Double Throw policy now completes one earned Act I campaign at
level 13. Retain the five policy/test files under the prospective Act I-clear
criterion. BUG626 is fixed for this declared route; representative acquisition,
holdouts and population balance remain under BUG611. Formal acceptance is
still 0/210. Earlier rejected trials remain rejected and were not extended.

## Change and scope

The retained loss showed rank-2 Double Throw while Bash/Swing retained early
investment. The existing town skill reset refunds actual allocated ranks and
has three independent free uses. The campaign policy now learns Find Potion1,
builds Swing5 before level12, and uses the native Akara reset at12. It keeps
one rank in each prerequisite/support skill and invests the refund in Throw.
Recovery precedes attacks; Howl follows them. Original final skill targets,
stat distribution, gear selection, production skills/formulas, loot, native
admission limits and other build policies are preserved.

`skillResetPolicy: double-throw-unlock-v1` opts in only the intended Throw
profile. The reset uses `prepareTownRespec`/`executeTownRespec`; no direct rank,
point, currency or save injection occurs. An empty committed reset resumes
allocation without spending another use. No unused free reset, active combat
or an unavailable town refuses before reset state changes.

## Frozen execution and result

Plan: `p15-throw-reset-v1-plan.json` in the root-owned packet below, created
before the candidate. Root plan/security review: ready/pass. One fresh campaign,
creation timestamp1793469600000, `level-training-v1`, `act1-training-v1`,
unchanged bounded Den acquisition and existing owned-equipment policy.

| Observation | Result |
| --- | --- |
| Native outcome | Act I complete, level13, next ordinal118 |
| Admissions / waves / victories | 118 /354 /352 |
| Nonwins | Den ordinal43 wave3; Dark Wood ordinal106 wave5 |
| Den acquisition | 62 admissions;61 wins/1 loss; earned level12 |
| Reset | Akara at12; refund13; free skill uses3→2; stat uses unchanged |
| First boss admission | Catacombs117; all six original waves won |
| Boss admission hero casts | Throw41, paid recovery16; Throw rank10 |
| Earned XP / item additions / removals | 222496 /3437 /3299 |
| Logical combat / native driver / launcher | 4574745.216520 /25434.199076 /37692.350799 ms |

Dark Wood recovery farms nine already-cleared Cold Plains admissions, earns13,
and wins retry116. Both losses remain in the costs and grant no victory income.
This is one declared acquisition history, not a population or causal comparison.
Logical combat is about76.25minutes; human decisions/reading time are unmeasured,
so this result does not establish the five-hour Act I or30–50hour campaign band.

## Verification and retained evidence

Ten affected checks pass,112 unrelated cases skipped: sequential/batched native
growth through80, original final targets, exact reset/refund/counter accounting,
Den grant/no-grant, refusal, interrupted recorder/resume, route priority,
prerequisites/registry and the early attack projection. Scoped strict types and
explicit unignored five-file lint pass with zero warnings. Initial type config
omitted Vite's ambient declaration; its corrected receipt and original failure
remain. Initial lint findings were corrected without changing runtime behavior.

The separate Python reader derives admissions, clocks/seeds, all354wave outcomes,
training boundaries, item custody, XP/currency/material balances,12stat and28skill
allocations and the complete final export from the retained journal. It verifies
the13point native refund, one counter decrement, no healing or currency payment,
and all other save domains unchanged by the reset. It does not independently
recompute the reset's derived-stat formula or certify drop probabilities,
typical acquisition, browser persistence, holdouts or balance. No combat replay.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Required files: `p15-throw-reset-v1-{plan,baseline,source}.json`,
`p15-throw-reset-readback-v1.{py,json}`, check logs/receipts, exact backups,
`p15-throw-reset-native-v1/` and `p15-throw-reset-v1-closure.json`.
The production manifest retains2151unchanged inputs, source tree hash
`3d965a5eb1179cf546d6ec3bc2bc7be51d5b838bc2e25efb68a8aeaba40bf850`;
the candidate contains131campaign inputs, exactly five changed paths.

Earned Throw successor in that directory:
`barbarian-double-throw-intended-v1.native-export.json`,93427bytes, SHA256
`55821eb6ad481c8eff49f44c27f9f084d23b732a9e94bd3d1b9c6bca40367e12`.
Both Act I quest rewards are claimed. This is a separate build continuation;
the main Corpse/Bone final-Eve-Claim successor at75/NormalV19-of-19/next1658
remains unchanged. All consumers terminal; disposable type config removed and
verified absent. Root retains the required packet and claimed human2 worktree
through umbrella review and owns eventual cleanup/release. No agents,
installation, CI, commit, push or publication.
