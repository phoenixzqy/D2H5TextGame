# Native mercenary Bash — BUG-372

Native repair verified; browser/earned feature acceptance pending, 2026-10-28. Base:
`75cb704378c9c017c709bc6ed36a8cace9aa245f`, after the independently reviewed Jab
and ordinary-unit boundary checkpoint. Existing claimed human-worktree-2;
no changes in the original checkout.

## Contract and repair

[D04](../decisions/D04-merc-bash-v1.md) restores the gacha-spec's advertised
two physical attempts for the actual `mercs/act5-barbarian-battle-orders` loadout.
Flat25–40, CD2s, zero MP, unlock1/cap20 and no rank growth remain. The previously
unspecified chance granularity and duration are explicitly reconciled as25%
stun per landed attempt, no proc on misses, base1000ms/boss500ms, ordinary
refresh without stacking. No Attack contribution or Jab damage bonus applies.

Closed exact-ID JSON/schema metadata and a copied/frozen resolver replace only
the Bash stub in the default registry. Existing sequence, ordinary damage,
on-hit status, target/caster death and cooldown settlement remain authoritative.
JSON status metadata has no `id`; the runtime effect supplies canonical `stun`.
Both locales explain two hits, per-landed chance and ordinary/boss duration.
No shared runtime primitive, persistence, acquisition or cast-order change.

## Causal evidence and current checks

The frozen seed-7 primary uses actual loaders, owned factory, projection and
default registry, retaining Battle Orders. Constructed surviving resources
isolate mechanics; they do not prove earned recruitment. Native RED exits1 with
two failures in12.031306s: both Attack100/200 observe one damage event instead of
two. Its2076inputs stay at
`63ccb4475e0a423515896fdbac75e35c7ff55b25154dac4e5e038ea98494be8d`.
BUG372 was filed after reproduction and before production edits. The unchanged
primary GREEN passes2cases in11.539700s on2077inputs at
`f53e2293fdc9198adf108347afc63796479f5c393fa48621dc99ab4741fdd812`.

Schema/resolver and sibling checks pass on2078inputs. The complete new coverage
has65cases across four files: schema/resolver40, combat22, primary2, public
lifecycle1. Initial focused256/10 passes19.573909s on2080inputs at
`0e01a0fd6558eb58966d401b363bfdc7bd00cec334327c6c3b712df44ce80d99`.
Before final project types, a test observer replaces ES2023 findLastIndex with
ES2022 findIndex after the first damage. It changes no fixture or expectation;
the six relevant cases assert exactly two damage events before observing proc
position. Original passing source and correction receipt remain retained.

Final focused256/10 passes21.211030s and source audit passes on2080inputs at
`e896e27f724b72f13ecdf0a73eb1d3a3090468d1067b6a64eac6822891526696`.
Scoped lint exits1 with one actual action-event narrowing error at combat
test159; project types exit2 in126.840550s with the same sole TS2339. Both failed
native receipts and their unchanged source map remain retained. The corrected
filter imports the exported timed RecordedBattleEvent alias and supplies an
explicit action-event type predicate. Installed esbuild0.21.5 targetES2022 emits
byte-identical JS before/after; fixtures, runtime and assertions are unchanged.
Independent source review approves this erased correction.

Successor2080inputs at
`a03076fd0a18739fab895e46af5bea54ef370a642c4b9f021ab29889d30cc1a0`
pass focused256/10 in21.469175s and scoped zero-warning lint in10.952822s. External
production build passes19.437913s on the same unchanged map, retaining chunk,
precache and stale Browserslist warnings. Successor project types pass in
173.193773s on the same unchanged input map. Engine11260/420files passes311.804652s and full zero-warning lint/engine
purity passes357.042346s on that unchanged map. Ordinary units then terminate
exit1/1234.562202s:21101tests pass/one fails,992files pass/one fails. BUG373 is
the sole failure; no timeout occurs. Original source/assertions remain retained.

Native unchanged-fixture trace reproduces BUG373: FINISHER at400ms misses one
41HPFallen; native merc Bash22+20 kills it at400ms before any Blaze cast. The
root is an invalid paid-field fixture premise, not a demonstrated production
Blaze defect. Only hero Blaze priority moves before synthetic FINISHER; the
native companion and every old replay/removal/resource/carry assertion remain.
New native checks establish400ms cast,22MP debit, statusBacked buff, source/rank5,
400..3400 status clocks and unexpired terminal carry. Observer code is removed.
Actual syntax-preflight and matcher-any lint failures are retained; reviewed
corrections change only the new test observations, without weakened expectations.
[BUG373](../../../production/bugs/BUG-373-runeword-wave-blaze-status.md) records
the full native failure/source lineage and exact causal trace.

Final2080map
`12bc75977a677d12f79052428bef445167eb475a3df6694718a3bbc19a59b562`
differs from the broader predecessor only in that wave test. Targeted12/12 passes
12.970964s and scoped zero-warning lint passes9.800919s; independent producer
approves diagnosis, fixture and additive ordinary runner. Final ordinary units
pass21102tests/993files with zero failed, pending or todo tests in1584.117326s.
Final project types pass280.345979s; full zero-warning lint/engine purity passes
540.454492s. Each native receipt records unchanged2080inputs on that final map.
Exactly one source input differs from the broader predecessor: the corrected
wave test. Engine/build production inputs and frozen Bash primary are unchanged;
their prior results remain predecessor evidence, not successor reruns.
Independent final evidence review and exact staged/committed blob binding govern
the local checkpoint; retain their receipts in the same validation packet.
These runs exceed nominal budgets and establish no timeout cause or speedup.

The tests use literal numeric outcomes and native seeded draws for first/
second/both/neither proc, misses and criticals. Narrow fixed-base/always-hit
fixtures isolate ordinary arithmetic. Actual status records verify finite
ordinary/boss expiry and action interruption. Cooldown, death/reflection,
unchanged inputs and public playback convergence are covered. No elapsed-time
threshold, production damage helper oracle, skip or weakened assertion is used.
The repository has no validate:data npm script; real-loader and schema tests
validate the complete affected mercenary catalog with its actual skill schema.

## Retention and limits

Root retains frozen primary, actual native reports/logs/receipts/input maps,
source predecessors and reviews at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-bash-txtr1cps`.
Root owns eventual exact-path cleanup through unfinished Bash/umbrella acceptance.
The exact external disposable `build` was removed after reader release:
762files/42282854bytes/10directories, verified absent with no cleanup failures.
Native build logs/receipts and exact inventory remain in `build-cleanup.json`.
Shared caches/tools/history and the registered worktree remain preserved.
The final ordinary runner and its four observed descendants have all exited;
their exact PID/start-time observations and absence checks remain retained.

BUG372 remains Open for browser/earned/feature acceptance; BUG373's invalid
paid-Blaze fixture is repaired and verified by the final ordinary suite, types
and lint. Player inventory stays212bounded/oneunverified. Campaign/economy/
build/pacing/defeat-retry/devices/locales/a11y/performance/PWA/actualCI/human/
soak/full-v1 acceptance remains unresolved. H3 remains terminal
`H3_PREREQUISITE_FAILED_NO_APP`; no app/browser retry. No protected fixture
access, closed diagnostic/policy execution, new acquisition/lineage/gameplay
replacement experiment, timeout-cause claim, push, merge or deployment occurs.
Umbrella goal and worktree stay active.
