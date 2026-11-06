# Invested Blizzard growth — local verification

2026-11-04; base HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, retained
human2/`feat/playable-foundations`. [Decision](../plans/decisions/P15-blizzard-investment-growth-v1.md)
changes only Blizzard `scaling.damagePerLevel`8→80. Rank1 stays85–125;
rank20 becomes1,605–1,645. All other authored JSON fields compare exact.

## Native constructed checks

One cast at1,500ms, seed1, Cold75/MR146 target, no enemy resistance penalty;
Cold Mastery source reduction is0or91. Exact observed noncritical damage:

| Blizzard rank | No mastery | Mastery20 |
| --- | ---: | ---: |
| 1 | 1 | 1 |
| 2 | 1 | 45 |
| 20 | 255 | 1,715 |

Each cast pays35MP, attempts one hit, applies Chill and retains the4s registered
cooldown. Seed4 naturally misses and still pays; MP34 falls back to a physical
basic attack without a Cold/status/resource effect. Very high MR retains the
one-damage floor. Attack1→99,999 leaves every event and enemy result identical.
Representative ordinary/recorded replay, source data and input immutability pass.

Original RED has3failures/7passes. The first runner configuration discovered no
tests; its log is retained, and explicit root/workspace correct discovery. Initial
post-edit run has79passes/3failures: my estimates wrongly assumed ActV automatically
adds35enemy penetration. Read-only inspection confirms actual Frozen Terrors have
no `resistPenalty`; corrected values above follow the actual pipeline. No enemy,
production formula or chosen coefficient changes to fit this error. Corrected
three cases go RED against the exact old JSON, then all10new cases plus the two
selected Blizzard geometry/Summoner cases pass. The72already-passing catalog,
preview/schema and Cold Mastery cases are not rerun. **84 unique affected cases
pass**, with scoped strict TypeScript and explicit three-file lint.

The Summoner test preserves all original seeds/assertions; its now-stale rank20
bounds96–126 become1,122–1,152 from raw1,605–1,645, Cold25 and MR81. Unrelated
tests are filtered out by name, not disabled. No broad suite/build/typecheck.

## Evidence and limits

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-blizzard-growth-hcw0sxn5`.
Contains plan/preimages, original/corrected RED, initial/corrected post-edit checks,
scoped types/lint commands/results, exact source diff,2,097before/2,098after input
hashes, production delta, local review and cleanup. Only the JSON coefficient,
two stale test expectations and new combat test differ among watched sources.
Task check PIDs are absent; exact task cache/configs removed and absence verified.
Root retains required evidence and human2 through umbrella review, then owns
eventual cleanup/release; no disposable paths or cleanup failures remain.

This verifies the authored growth locally, not campaign viability, independent
QA or formal balance. [BUG643](../../production/bugs/BUG-643-cold-static-field-priority-starvation.md)
stays Open. Cold remains73/next1225; original training and rejected diagnostic
budgets remain spent. No retained encounter replay/native admission/preparation
or reward occurred here. No agents/install/commit/push/CI/publication.14intended
ActI/7intended Normal/formal0of210; full privatev1 remains active/incomplete.
