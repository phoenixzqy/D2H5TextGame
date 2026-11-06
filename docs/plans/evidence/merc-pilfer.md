# Native mercenary Pilfer — BUG-379

Native repair is implemented and independently reviewed on parent
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, retaining the uncommitted native
damage-delivery and Frozen Armor changes. Native repair is verified by the
ordinary unit suite and static/build checks; broader acceptance and BUG-379
remain Open.
Contract: [D04 Pilfer](../decisions/D04-merc-pilfer-v1.md).

## Behavior and authority

The gacha specification promises Pickpocket a +30% GoldFind fight bonus. D10
keeps no gold: the existing `goldFind` input increases rune-shards through the
unchanged `(1 + find / 100)` formula. Native Pilfer therefore grants **30
percentage points of shard find for one winning wave**, added to hero find
before each existing reward floor. It does not multiply a rounded reward.

The actual original Pickpocket must own its native bar and make an ordinary
native paid cast. Its authored attack is physical14–24, cooldown2s, zeroMP,
ranks1–20, with no added Attack/rank scaling. A miss still activates the reward
bonus. Repeat casts and multiple eligible sources do not stack; paid activation
survives that source's later death in the wave. Dead/blocked/cooldown sources,
wrong templates, heroes, summons, invalid levels, missing owned bars and
same-ID replacement skills cannot activate it. Every simulation starts inactive:
next wave, new run and ordinary replay compilation must cast again. No saved or
unit-carried paid state is introduced.

Closed exact-ID JSON metadata, strict Ajv validation and copied immutable native
resolution supply the tuning. Factory projection and engine eligibility guard
the actual native source. The engine's primitive paid result is captured and
validated before naming callbacks, then privately bound into the recorded-wave
receipt. Public recording/team/result edits cannot authorize or increase it.
Ordinary eligible non-summon kill bags and legitimate Find Item extra bags share
the same wave bonus. Defeat/flee grant none. Hero equipment find is preserved;
mercenary equipment find is not globally added. Reward seeds and unrelated item,
material and wishstone rolls remain unchanged for the same reward context and
seed. Changed combat outcomes may change that context. No extra RNG call is
introduced.
The authored attack correction intentionally replaces the obsolete15–25 stub.

Native payout identity, replay deduplication, constructed locked-replay policy,
bare-merc fallback and rollback/recovery rules remain in force. Skill copy
states the shard behavior in zh-CN/en. The stale gold-theft recruitment lore was
also corrected in both locales after the ordinary suite passed; its exact
copy-only validation and rebuilt product are recorded below.

## Frozen causal primary

`src/stores/merc-pilfer-primary.test.ts` remains byte-identical to the independently
reviewed primary, SHA256
`e5f2c0feb90f4b2538fab2306dbcfb9b088b598f9f4ace6b9531499ba9792b37`.
The actual pool→factory→recorded combat cases cover literal ranks1/20. The native
staged/receipted victory cases settle to inventory with hero find0/50 and an
independent reward-seed oracle using literal heroFind+30.

Causal RED fails all four intended assertions: no result bonus at both ranks,
78 shards instead of101 at hero find0, and120 instead of144 at hero find50.
There are no collection/setup failures or timeouts. The unchanged primary then
passes all four after repair. Imported survivor stats and a synthetic finisher
isolate wiring; neither fixture establishes earned progression.

## Corrections and regression coverage

The first two definition runs fail strict Ajv collection because local conditional
schema declarations lack required object/physical typing. Only schema declarations
are corrected. Exact failed schemas and correction manifest remain retained;
the unchanged29 definition tests then pass. The first broad engine run passes
11750/fails4 across436 files. All four failures are historical unrelated-stub
identity loops expecting the superseded Pilfer15–25 placeholder. Independently
reviewed exact corrections explicitly assert native Pilfer identity and preserve
the remaining unchanged stub assertions. Corrected repair153/5 passes.

Initial type checking finds four narrow issues: physical tag inference, optional
test damage access and two explicit undefined optional reward inputs. Reviewed
exact typing corrections preserve production intent and all assertions. The first
expanded focused run passes215/fails1: a miss fixture's seed7 actually lands14
because high dodge still leaves the existing5% minimum hit chance. The reviewed
fixture-only correction selects seed4 only for that miss case. Every assertion
and the frozen primary remain unchanged; focused216/8 then passes.

The27 combat supplemental cases cover exact authored damage and2000ms cast
intervals, miss activation, post-payment source death, multiple-source nonstacking,
source negatives, custom same-ID refusal and forged/carried-state refusal. The17
native lifecycle cases cover private capture before naming, malformed scalar
refusal, immutable public playback, lost/restored loadout/level, replay payout
identity, captured bare fallback, new-run reset, real Find Item extra bags,
no rewards after flee/constructed defeat and participating-store rollback after
generation/inventory-observer failure. Locked replay uses constructed lock
metadata; it is not native Iron Golem payment evidence. Mercenary find exclusion
uses imported find stats500, not an actual equipped-gear case.

Final lint initially fails one new test callback's void shorthand. The separately
reviewed braces-only correction preserves every assertion/argument/fixture.
Installed native supplemental SHA changes from089b041a… to0de19ead…;
production and primary remain identical. The predecessor is retained.

## Validation and input binding

Focused216 tests/eight files pass in18.409933s, with no failures/pending/todo.
Types pass in130.774906s. Boundary audit passes1023 test files/1615 source modules
in3.733212s. External Vite/PWA build passes in14.693585s. All four preserve the
same2118-input map:
`9cc6a6447392afa8f743167727d4906902c18dbacd85738064cdd63ee39fab0b`.

Full lint rerun passes, zero warnings, in267.813032s with byte-identical
before/after2118-input map:
`5d69193d94c20ff1f50853f23b4b4655563a359d187d54ff6c1e90d8b1bcdaa6`.
The sole map difference is the reviewed braces-only native test correction.
Independent producer review approves the focused source/result checkpoint,
all static checks, the correction and this exact map delta.

The ordinary default Vitest workspace (`pilfer-final-unit`) passes **21708 tests
in 1023 actual files**, exit0 in1204.503028s, with zero failed/pending/todo tests
and the unchanged2118-input map `5d69193d…` above. Report SHA256:
`e850266a490bf841ba2f1ea9cfe2034ae6e16d3d9853d1b117d6beab45fbbc52`.
Independent producer review verifies the complete report/log/receipts/maps and
primary4/4. No timeout recurrence or unhandled errors appears. Nonfatal
React/router, fixture and missing-art warnings remain. This is the ordinary
audited suite; it establishes no diagnostics, earned or broader acceptance.
BUG180/366 are not established fixed by this pass.

The final recruitment-copy correction changes only
`byId.tavern-thief-pickpocket.lore` in each `mercs.json` locale. Parsed JSON and
exact candidates verify only those two leaves changed; mechanics/tests and
frozen primary remain identical. The final2118-input map is:
`f570c1791fc468eded7b46d84a95b31344dc70424df7eff03db01adce8135097`.
A fresh external build (`pilfer-copy-build`) passes exit0 in14.202214s with
identical before/after maps and existing warnings only. Independent producer
review approves this exact delta and rebuild; JSON structural validation plus
rebuild suffices for these two strings, with no repeated ordinary suite.
Exact runner absence checks verify driver3608997, npm3608999 and build3651081
absent without process termination.

## Retention and unfinished acceptance

Required frozen primary, schemas, source/test predecessors, drafts, RED/GREEN
reports/logs, exact before/after maps, terminal receipts, independent reviews and
runner remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-pilfer-sd868yw1`.
Root retains this evidence through unfinished consumers and owns eventual
exact-path cleanup. After independent build readers released it,
`pilfer-build-cleanup.json` records762 files/42319951 bytes removed and verifies
the exact task-owned external `build` directory absent. The subsequent final-copy
build recreated only that same path. After all readers released it,
`pilfer-copy-build-cleanup.json` records762 files/42320094 bytes removed and
again verifies the exact build path absent. Both inventories and cleanup
receipts remain. No live task check sessions or disposable build outputs remain.

BUG-379 stays Open beyond bounded native verification. Earned play, browser,
campaign/economy/14-build viability/pacing/defeat-retry, device/locale/a11y,
performance/PWA, actual CI, human playtest, soak and full private-v1 acceptance
remain unresolved. H3 remains terminal failed-no-app; no app/browser/retry,
protected fixture, diagnostics/closed matrices, new acquisition/lineage/gameplay
replacement run, remote/deployment or worktree action is authorized by this
checkpoint. BUG180/366 timeout recurrence stops source continuation.
