# Native mercenary Telekinesis — BUG-376

Native repair verified; browser/earned feature acceptance pending.
Base: `9d2bae89d04ae9eda7416fea8126c21c312e4d8f`.
Contract: [D04](../decisions/D04-merc-telekinesis-v1.md).

The exact authored mercenary row now resolves to immutable ordinary Arcane20–32
damage, zeroMP/CD2/flat ranks1–20/no Attack. The no-movement adaptation replaces
advertised50% Knockback with50% landed Stun1000ms ordinary/500ms bosses, through
the existing damage/status pipeline. Player Telekinesis remains separate utility.
Schema closure rejects ignored metadata, the exact stub is removed and both
locales describe native behavior. Shared runtime/types/persistence/recruitment,
dependencies and CI are unchanged.

## Causal and public evidence

The independently approved actual pool/factory/projection/default-registry
primary was frozen against the committed War Cry base before execution.
SHA256:`b7385d9e7b4084947ee7e1fbdfa4c54bfb8ea2d91f47c92d813918e947e676ee`.
Seed3 requires first1700ms damage20/Stun to2700; seed9 requires damage31/no Stun.
Causal RED fails3/3 before BUG376 filing and production edits: missing control,
seed9 damage29 and contradictory registry metadata. Unchanged-primary GREEN
passes3/3. Constructed surviving resources isolate mechanics, not acquisition.

Four new files add80cases: resolver48/combat24/primary3/public lifecycle5.
Coverage includes immutable copied metadata, schema rejection/catalog siblings,
native hit/base/crit/proc/mitigation/dodge, personal/party Arcane increases and
overflow, rank/Attack invariance, single hostile/summon/reverse-side targeting,
ordinary/boss expiry and action resumption, refresh/expired records/source death,
payment/carried cooldown/paid residual/recast/basic fallback and death/retaliation.

Five public cases preserve actual signature and hireable Fire Iron Wolf bars.
Fire Iron Wolf's real Fire Ball→Telekinesis→Fire Mastery sequence deals literal
63Fire at1700ms,26Arcane at3400ms with seed3; distinct fixture Freeze prevents
intervening main-RNG use. Stun expires4400 ordinary/3900 boss. Signature cases
deal20Arcane at1700; source-death case dies2000 while finite control survives.
Publication/playback converges exactly for living statuses/resources/stats/buffs/
enrage. Explicit engine corpse statuses and empty playback corpse presentation
are asserted; only expected dead-body display is normalized. Saved/input/recording
remain immutable and deterministic.

The residual cooldown fixture initially uses21HP and dies at1700 because periodic
accrual removes1 before damage20. Independently approved22HP preserves the intended
death2000/residual1700 oracle; failed predecessor retained. Two combined event
filters need discriminant narrowing for types/lint; always-present JSON cost/tag
guards and an unsafe matcher property assignment need test-only corrections.
Reviewed successors preserve membership, event order and literal values. The
primary never changes. Focused successor passes235/8files; scoped lint has zero
warnings and boundary audit passes1005tests/1591modules.

An external wrapper ownership registration race aborts a typecheck driver after
child launch but before a started receipt. Its child exit is unknown, with no
success claim; subsequent exact-worktree command/stdout-FD observations find no
matching child. No process is terminated. Independently reviewed wrapper repair
locks the same ownership handle through read/update/flush and avoids unnecessary
writes. Full refusal still precedes snapshot/registration/test subprocess. The
lost run, predecessor wrapper and repair remain retained; the fresh receipted typecheck
passes exit0 in123.894217s on the unchanged final input map. This is bookkeeping evidence, not a game-code repair.

## Native gates

Final2094 permitted input map:
`1d1860b2d0c10b98031b51d64aacc01cb27d03e34540f2a9f02265214fba57d7`.
Diagnostic workspace/protected paths are excluded before snapshot reads.
Focused235/8files, zero-warning scoped lint, boundary audit1005tests/1591modules,
receipted types(123.894217s) and external production build(19.257976s) pass on
unchanged maps. Independent producer approves terminal types/build and wrapper
lineage. Large-chunk/precache warnings remain; performance/PWA acceptance stays
open. Engine passes11476tests/426files(323.827726s), with zero failed/pending/todo.
Full zero-warning lint/engine purity passes(373.375180s); independent producer
approves completed engine/lint and permitted report paths. Audited ordinary units
pass21345tests/1005files with zero failed/pending/todo in1141.879416s. All1005
unique reported paths belong to permitted inputs and match audited discovery.
Before/after/current permitted maps are identical. These results establish
native mechanics, not pacing, performance budgets or earned feature acceptance.

## Retention and unfinished acceptance

Root retains required sources/predecessors, logs/reports/maps, reviews and safe
runner through unfinished acceptance at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-telekinesis-1wffcccm`.
Root owns eventual exact-path cleanup. Disposable external build762files/
42293934bytes/10directories is removed, independently verified absent with no
cleanup failures. All32 recorded child/driver PID observations are absent after
terminal gates; no process was terminated. Independent final evidence and exact
staged/committed blob/tree/parent reviews govern the local checkpoint.

BUG376 stays Open for browser/earned feature acceptance. Player inventory remains
212bounded/oneunverified. Campaign/economy/build/pacing/defeat-retry/devices/locales/
a11y/performance/PWA/actualCI/human/soak/full-v1 acceptance stays open. H3 remains
terminal failed-no-app: no app/browser/retry, protected fixture access/replay,
diagnostic/closed-policy execution, new earned-lineage/gameplay replacement run,
remote action, deployment or worktree release. Umbrella goal remains active.
