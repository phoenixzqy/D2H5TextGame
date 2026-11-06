# Intended Traps — continued late Blade investment

BUG651 is fixed for campaign allocation. The profile now spends earned skill
points on Blade Sentinel after its original targets are filled, up to rank20.
This changes campaign preparation only; production combat and authored numbers
are unchanged. Earlier targets, prerequisites, stats and priority are retained.

## Evidence and limits

The [Act IV checkpoint](2026-11-03-traps-act4-checkpoint.md) remains failed at
level49/next717. All three Izual attempts714–716 timed out, despite a surviving
hero and ample Mana. The native terminal save holds five unused points with
Blade8. No attempt is renewed and no Act IV clear, claim or Act V entry occurs.

Seven affected regression cases pass, with161unrelated cases filtered. They
cover sequential/batched growth, the existing early physical/lightning fields,
native purchase conservation, unchanged save domains, no resets and idempotence.
The new supplied-XP fixture is an allocation test, not earned campaign evidence.
Scoped strict types and explicit lint pass. The original external diagnostic
fails types on readonly construction and optional projection fields; V2 fixes
its immutable construction/narrowing before any battle. Original errors and
frozen inputs are retained; compiler strictness is unchanged.

Exactly one control replays the retained first Izual input (ordinal714/index4,
run seed3335028484) with every event and final party field identical. It draws
at60,000ms, leaving Izual3,448Life. Five real native purchases from the terminal
save raise Blade8→13/points5→0, with the full save otherwise unchanged. The
candidate transplants only native skillLevels and assassinTrapRanks into the
retained hero; seed, party, gear and every other input stay identical. It wins
at46,477.800407331975ms, hero1,143Life/525Mana, no living enemies. Isolated combat
does not change native stores or settle rewards. This supports the allocation
policy; it does not establish an earned route, population balance or pacing.

## Provenance and cleanup

Root-owned packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Prefix `p15-traps-late-blade-v1`; final inputs use `diagnostic-freeze-v2`,
`driver-v2`, `launcher-v2` and `tsconfig-v2-archive`. `diagnostic.json`,
`control.json`, seven-case `green-final.json`, check receipts and `closure.json`
are retained. Single launch wrapper5,170.861926162615ms; driver1,027.281062ms.
The candidate wall344.6256859999994ms includes post-battle manifest checks;
it is not an isolated engine-performance measurement.

All2,151production inputs match the preceding checkpoint; all131campaign inputs
are checked, with exactly the growth JSON and regression test changed. The
production tree remains
`2afb8a4d83a2b445f4cee5ed36b5e1f8c042232c87eec5967a44413340bdd83d`.
Closure verifies all recorded processes absent and exact owned caches/configs
removed; both config contents and hashes remain archived. Root retains the
required evidence and human2 worktree through umbrella review and owns eventual
cleanup/release. No completed route, unrelated test suite, seed search, reset,
new dependency, agent, commit, push or publication occurs.

Intended five-act completions remain three; full privatev1 and formal0/210
balance acceptance remain incomplete. Continue other unfinished implementation
or retained eligible checkpoints without renewing exhausted route budgets.
