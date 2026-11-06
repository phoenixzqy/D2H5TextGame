# Native mercenary Blessed Aim — BUG-380

Native repair implements the user's cheaper mechanic on parent
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, preserving the existing uncommitted
native delivery, Frozen Armor and Pilfer changes. Broader acceptance and BUG-380
remain Open. Native repair is verified by the final ordinary suite and bounded
static/build evidence. Contract: [D04 Blessed Aim](../decisions/D04-merc-blessed-aim-v1.md).

## Behavior and authority

The actual factory-qualified Blessed Aim merc grants living, currently allied,
originally player-side bodies a nonstacking **30% relative weapon miss
reduction**. A 15% miss chance becomes 10.5%; a 35% miss chance becomes 24.5%.
Presence is passive: no cast, action, mana, cooldown, buff status or selected-aura
slot. The source must retain its native owned bar, integer valid level/rank,
current player allegiance and exact native registration. Source death or loss of
qualification withdraws the benefit. Native summons, including later summons,
and the source itself qualify as recipients; converted original enemies do not.
Every fresh wave/replay rebuilds qualification and preserves captured bare fallback.

For authenticated native direct melee/ranged weapon attempts and known projected
weapon basics, the existing ordinary hit probability H is changed only after its
ordinary dodge/penalty and 5% minimum: `H + max(0, 1-H) * 0.30`. The prior 5% hit
floor therefore becomes 33.5%; no new 95% maximum is imposed. H=1 remains valid
and malformed H>1 preserves the existing RNG rejection. Zero/absent reduction
preserves exact arithmetic and draw parity; always-hit attacks still skip the
accuracy draw. There is no extra accuracy draw. A converted miss naturally adds
ordinary damage/crit draws. Removing the old inert cast intentionally permits Jab
sooner and does not promise whole-battle RNG parity across that timing change.

Physical damage or `basicHit` alone cannot establish weapon authority. Native
primary-melee delivery qualifies only the direct primary recipient. Spells,
unknown/custom skills, ambient/periodic/reflection/armor damage, traps and
auxiliary bolts receive no Blessed Aim adjustment and preserve their existing
resolution behavior. Projectiles privately capture the
original native RegisteredSkill at launch and revalidate current reference,
semantics and delivery at impact. Same-ID replacement, mutation, custom launch,
source death or dead shooter cannot gain the benefit. Ranged accuracy remains
separate from impact contact: projectile contact stays `none`.

Closed exact-ID JSON tuning and strict schema/resolver validation replace the
single mercenary placeholder. Bilingual skill/recruitment text and the gacha
design row describe miss reduction. No Attack Rating system or save-version
change is introduced. Separate selected Paladin Blessed Aim retains its existing
Attack bonus.

## Frozen primary and supplemental coverage

`src/stores/merc-blessed-aim-primary.test.ts` remains byte-identical to the
independently reviewed primary, SHA256
`430746c44390b50451591937345f739c7e243686fa6cf8a6e9a90fe3b4cbecb2`.
Four actual pool→factory→projection→recorded battle cases cover ranks1/20 with
literal dodge0/.2. Causal RED fails all four intended accuracy assertions:
.85 remains .85 instead of .895; .65 remains .65 instead of .755. No setup,
collection or timeout failure occurs. RED input2119 map:
`060b58bfe0ed60a2e60b85035e0376c87d5c35dc12568854d126f1ab7331b020`;
report SHA256:
`b0e64ca01048e48d1192396ca6f746a73c4b1ff55998542dd1ce4999a282965e`.
The unchanged primary passes after repair. Imported survivors isolate native
wiring and do not establish earned play.

Definition24, damage18, native combat53, store lifecycle6 and supplemental
exclusions5 cover schema bounds/identity/immutability, literal hit thresholds,
zero/absent parity, H=1/H>1, 100% reduction, always-hit, native weighted/enchant
weapon attempts, independent hit sequences, original allegiance, source
qualification, nonstacking, late summons, projectile authority/withdrawal and
fresh-wave/replay behavior. Existing recording/base/save inputs stay immutable.
Exclusions explicitly prove Power Strike carrier .895 versus auxiliary .85,
source death between direct attempts and paid Hydra ordinary accuracy alongside
an active allied weapon control.

A fully native hostile Aim-recipient versus merc Frozen Armor matchup is
unavailable because both require original player side. Independently approved
separate native proofs show a genuinely paid merc Frozen Armor does not chill
an enemy ranged hit but does chill a melee control, with an allied .895 weapon
control confirming active Aim. Imported taunt controls targeting only; no forged
paid armor or synthetic hostility establishes the claim. Existing active ranged
.895 coverage and impact contact-none checks remain separate evidence.

## Retained failures and exact corrections

The first combat run fails seven fixture/oracle cases. Independently reviewed
exact corrections fix native source identity, actual action timing and expected
ordinary RNG paths; no production workaround is introduced. The reviewed
53-case rerun passes. An initial type run finds three supplemental test typing
issues, corrected in that same reviewed candidate.

Historical120 passes116/fails4 only because three suites still expect the old
Aim placeholder. Reviewed exact migrations add native identity assertions and
exclude only Aim from unrelated stub loops, preserving other assertions. The
first broad engine run later passes11880/fails1 across441 actual files: Warmth
also expects the obsolete undefined-trigger Aim stub. Its reviewed migration adds
Aim to the existing native passive exclusion table and retains the legacy
undefined-trigger self-buff assertions using an explicitly synthetic fixture.
No runtime code changes for these migrations.

Supplemental exclusion predecessors preserve three independently reviewed
fixture corrections: AS100 schedules1700ms rather than1000ms; contact seed19
lands where seed7 legitimately misses; and the full chance stream includes two
ordinary trash-enemy HP/MP-orb rolls. Final exclusions5/5 pass. Every failed
predecessor and exact review/install receipt remains retained; the frozen primary
is unchanged.

## Validation and input binding

Exclusions5/5 pass in10.309496s. Types pass in219.400349s. Boundary
passes1029 test files/1622 source modules in4.459293s. External Vite/PWA build
passes in20.025580s. These checks preserve the2125-input map
`d90bfad125fc78110493dc96c151aef58378530c67570fd3cd5f6844b0c1a5db`.
Build warnings remain: stale Browserslist data, chunks over500kB, external output
not automatically emptied and the2.57MB generated asset manifest excluded from
precaching. Build success does not establish browser or offline acceptance.

The corrected actual engine suite passes **11882 tests/441 actual files**,
exit0 in311.376286s, with zero failed/pending/todo and unchanged map
`cb8a8d2b5a678170369983d1d9951dd193c2484475b376890ea2ee9d1b4bf321`.
Engine report SHA256:
`4d4640daec2919fd5717827e3a3b168a6c4978b17a38dad2a59af2e026b4b273`.
The sole delta from d90bfad is the independently approved Warmth test migration.

The first full lint attempt exits134 after engine-purity passes: Node exhausts
its default approximately4GB heap. An independently approved environment-only
retry with `NODE_OPTIONS=--max-old-space-size=8192` completes and reports one
unbound-method rule error in the projectile test. The captured
original method is intentionally invoked through `original.call(this,...args)`.
An independently reviewed targeted lint comment explains that receiver; no
executable/fixture/assertion changes occur. Both failed lint predecessors remain.

Final full lint passes, exit0 with zero warnings, in387.242002s using the recorded
8GB setting. Its unchanged2125-input map is
`b6d7ad8ead29e527a96e7273fc4dabdd87465d54c2f37900a66a1d3ffb4d6073`.
The sole delta from cb8a8d2 is that explanatory test comment. Engine evidence
carries forward through this executable-identical delta. Types/build/boundary
are explicitly predecessor-map evidence spanning the reviewed Warmth migration
and lint comment; production and import structure remain unchanged. No type
check or build is claimed to have run on the final map.

The final ordinary default Vitest workspace passes **21819 tests/1029 actual
files**, exit0 in1559.095521s, with zero failed/pending/todo and identical
before/after b6d7ad8 maps above. Report SHA256:
`c39687278a10c472dacbf4befa5ebba7d949d0b4bf12d09d8f1398ad0087cad1`.
Log SHA256:
`43c0e555b6833d7f6ec5bf3d59cea679c5b9255a728f84c97b81334e3093b56e`.
The frozen primary passes4/4. Full logs retain nonfatal React act(...) and Router future-flag warnings, missing
monster-art keys and fixture/guard messages for unknown skills, unknown class
and absent player. No timeout recurrence, unhandled error or fatal-error markers
appear. This is the ordinary audited suite and establishes no diagnostics, earned or broader
acceptance. BUG180/366 are not established fixed by this pass.

Independent producer review verifies final engine/lint/full-unit terminal
reports, before/after maps, exact test-only deltas and frozen primary. Exact
captured task-tree absence checks verify3837435/3837436/3837455/3837456/3837488/
3837520/3837522/3837554/3838484 absent without process termination. No task check
or disposable build remains. Documentation-only checkpoint installation does
not change any of the2125 mapped implementation/check inputs.

## Retention and unfinished acceptance

Required primary, contracts, predecessor/candidate pairs, RED/GREEN reports,
full logs, exact maps, terminal receipts, independent reviews and audited driver
remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-blessed-aim-mhfj125a`.
Root retains this evidence through unfinished acceptance and owns eventual
exact-path cleanup. Independent build readers released the only disposable
external `build`; its inventory and cleanup receipt record762 files/42323259
bytes removed and verify that exact path absent.

BUG-380 remains Open beyond bounded native verification. Earned play, browser,
campaign/economy/14-build viability/pacing/defeat-retry, device/locale/a11y,
performance/PWA, actual CI, human playtest, soak and full private-v1 acceptance
remain unresolved. H3 remains terminal `H3_PREREQUISITE_FAILED_NO_APP`; no
app/browser/alternate launch/retry, protected fixture, diagnostics/closed
matrices, new acquisition/lineage/gameplay replacement experiment, remote,
deployment or worktree action is authorized by this checkpoint. BUG180/366
timeout recurrence stops source continuation.
