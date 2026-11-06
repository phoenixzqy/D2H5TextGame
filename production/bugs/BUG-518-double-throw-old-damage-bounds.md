# BUG-518 — Include existing allocated Attack growth in old Double Throw bounds

Status: local uncommitted fixture correction; both failed rank cases pass. Severity: Low. Owner: root / QA.
Environment: WSL / Node24 / jsdom store causal fixture; locale not applicable.
Base HEAD: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, current dirty source.

Reproduce: `bug517-green-store-v1-exit.json` records the exact command.
The rank2/rank20 cases of `src/stores/double-throw.causal.test.ts` compare
against flat base/rank damage only. Existing JSON/registration already adds
20percentage points of snapshot Attack per rank above1. With fixture Attack100,
rank20 adds380, so actual526 exceeds the obsolete170 upper bound correctly.
These fixed original pools contain no hostile summons; BUG517's selection
revision cannot alter the missing Attack term.

Expected: literal per-attempt lower/upper bounds include100*0.2*(rank-1).
Actual: the test omits that established contribution. Correct only its bounds;
retain misses, two total throws, original pools, per-target health, mana,
immutable replay/playback and every other assertion. No game tuning or source
change. Evidence and exact pre-edit bytes remain in root's packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`.
Run only the failed rank cases and scoped types/lint. Existing18passes retained.
Security check: pass; local fixture arithmetic only, no grant or audit bypass.

## Completed local verification

Completed: bug518-corrected-v1 passes rank2/rank20 (2/2); retain18 other store
passes from bug517-green-store-v1. Final bug517-types-v2/lint-v2 pass including
this fixture. Source before/after hashes and exact receipts are retained.
No production damage formula or balance change.
