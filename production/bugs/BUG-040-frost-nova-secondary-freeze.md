# BUG-040 — Player Frost Nova drops secondary Freeze

Status: fixed within bounded player Frost runtime scope; final independent review approved.
Severity: Medium; advertised crowd control never reaches production engine.
Owner: engine-dev/content-designer; independent producer/QA review.
Card:P08a04, bounded player Frost Nova secondary status only.

## Expected / actual

Expected: actual player Frost Nova retains current Chill and applies documented
10% Freeze to each successful hit; no proc on a miss. Preserve one damage result
per target, current exact duration/rank/resource/targeting rules.

Observed baseline source: authored sorceress.json row includes [chill,freeze], but
`src/engine/skills/dataCatalog.ts` effectsForSkill selects appliesStatus[0] only;
the baseline DamageEffect supports only singular applyStatus. Registry loads JSON after
legacy builders, so the builder cannot restore the missing production tail.
The initial investigation claimed no runtime outcome; subsequent A/B evidence follows below.

## Reproduction plan and environment

Isolated root worktree2, branch feat/playable-foundations; representation input
9f2eb48 includes accepted quest b4d2764 and authored cast-name/browser fix9f2eb48.
Behavior input ea1d4c3 includes accepted representation A. Node24.21.0, Vitest pure-engine project; locale/viewport
are not relevant to runtime status transport. Use actual JSON→schema→adapter→
registry→runBattleRecorded, no substitute registered Frost definition. Record
actual input SHA and genuine raw RED before source changes.

Contract:[D04 Frost Nova](../../docs/plans/decisions/D04-frost-nova-secondary-v1.md).
The design spec Sorceress table pins Freeze10%; D04 timing pins current1000ms
ordinary/500ms boss duration and exclusive expiry. Per-target independent rolls
append after existing Chill chance1. Analyst seed hypotheses5success/1failure/
4miss and AoE5 require actual executable verification; do not assume they pass.

## Scope and next actions

Representation child: strict opt-in secondary metadata/schema/shared types and
ordered engine list representation, with legacy compatibility, no live row change.
Behavior child: Frost JSON + adapter + shared damage-status loop; first prove
actual missing Freeze, then exact real-action suppression/expiry/AoE/rank/
resource/replay/legacy controls. Independent reviewed RED before each fix.
Do not enable unrelated multi-status tails or change Chill speed/monster Frost/
old two-turn conditional prose/UI/save/engine seed ownership. Security-check
PASS for local authored JSON and seeded engine behavior; no credentials/network/
dependencies/permissions/hooks. Final evidence/review/cleanup still pending.


P08a04a plan refinement approved by root/producer/QA before RED: opted-in
appliesStatus is exactly [nonempty non-Freeze primary,freeze], with damage and
damageType, unique IDs and closed required Freeze chance metadata. Overlong
opt-in arrays fail; identical opt-out arrays and existing legacy oddities remain
accepted. This uses an Ajv-strict closed tuple without weakening the validator;
general engine nonempty readonly applyStatuses remains unrestricted in length.
Input cast runtime is now accepted commit9f2eb48; Frost code remains unchanged.


## P08a04a representation RED before source edits

At9f2eb48, only loader.test.ts changed. Revised frozen test SHA256
`fb9dfc5a63d4f782835cebd307f7c2fd752da6c494927c84dd1fdcb53c32923e`.
Command: npx vitest run --project ui src/data/loader.test.ts --reporter=verbose.
Result:11failed/184passed/195total,0skips, runner3.05s/wall4.349s, exit1.
The actual Frost row validates unchanged; adding only reviewed Freeze metadata
fails with exactly one Ajv additionalProperties error for additionalStatusEffects.
All10other desired acceptance cases fail for the same unsupported field; legacy
controls/current283rows load unchanged. This is genuine schema RED, not runtime
Freeze evidence. Actual Sorceress JSON is independently verified metadata-free.
Opt-out fixtures clone the actual row and strip opt-in metadata so they remain
valid during B; no persistent assertion forbids B's intended content change.

Separate typecheck exits2/wall10.168s solely for desired applyStatuses positive
acceptance (TS2561); it is type-contract evidence, not behavioral RED. Negative
static controls require nonempty/exclusive forms. Test ESLint exits0/wall5.789s.
Initial run17fail/178pass also contained six test-harness failures because
Vitest spread array rows; revised fixtures use object rows. Initial TSC also
caught the same fixture typing and ESLint dynamic-delete issue; corrected
without any source edit or relaxed acceptance. Keep both attempts for reviewers.

Exact raw root:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frost-representation-rdc_xho_
Labels frost-a-red-final, frost-a-red-final-typecheck, frost-a-red-final-lint.
Root/producer/QA independently APPROVE / ADEQUATE genuine schema RED before
representation source edits. Frozen tests remain unchanged for GREEN review.

Final RED log SHA256: `1fb005e06c9d7099c439bafa5a36a6c80b7aabc9b400d6482f41c39aa7b1dc2a`.


## P08a04a bounded representation source and GREEN

Tests/docs checkpoint5fe184b; frozen tests unchanged. Only four source files
changed: skill schema, shared skill types, effect types and dataCatalog import/
local JsonSkill type. No adapter construction, content or combat change.
Closed opted-in exact-two schema preserves legacy rows; secondary chance is
required. General DamageEffect type uses a full ordered readonly nonempty rest
tuple exclusive with legacy scalar; no-status constructors remain valid.

First GREEN exposed Ajv strictRequired requiring property declarations in the
conditional branches (94failed/101passed); engine compilation also reported
the same schema error. Added explicit if property declaration and then damage/
damageType refs, retaining strict settings and frozen tests. Final focused
195/195,0skips,runner2.41s/wall3.585s,exit0. Typecheck exits0/wall9.887s, making
the positive readonly tuple and negative exclusivity/nonempty assertions real
static evidence. Lint exits0/wall27.396s,purity50files. Broader final checks
and independent source/final review follow.

Source SHA256 at GREEN:

- src/data/schema/skill.schema.json: `d938a98a4a8468fb856c4fa5102b3da89bb88fc702b03f6376687480f54e8a15`
- src/engine/types/skills.ts: `cd0be4ef4c2244e9d48dee041712c485d6f277bd5bb80dc8f0074f8313046801`
- src/engine/skills/effects.ts: `467f0b9977207f4501f7190f767110950d3a6ad82d733598d373fbb80697e7a1`
- src/engine/skills/dataCatalog.ts: `2372be32736f22127edf43065c5afc020cdcaff930daddac2108040a7982f8b5`


## P08a04a final combined validation

Root/producer/QA source/focused APPROVE; all source/frozen test hashes above
remain unchanged. Complete final checks, each exit0 (no unit skips/failures):

| Label | Test/files; runner / wall seconds |
| --- | --- |
| frost-a-green-final | 195/1;2.41/3.585 |
| frost-a-engine-final | 893/50;4.77/5.798 |
| frost-a-related | 1142/61;21.89/23.384 |
| frost-a-full | 1998/127;27.08/28.631 |
| frost-a-typecheck-final | 18.188 |
| frost-a-lint-final | 42.447 |
| frost-a-build-final | 12.572 |
| frost-a-coverage | 1998/127;35.14/38.793 |

Exact command arrays and real exits/wall are recorded in per-label result JSON
under the A raw root above. Engine893/50 covers current scalar/legacy registry
behavior; related1142/61, full1998/127 and coverage1998/127 pass. Final coverage/
typecheck/lint overlapped; engine/related/full/coverage units were sequential.
Configured80% engine coverage gate passes; schema/type-only changes add no new
engine executable behavior. Engine3s/related5s/full15s budgets remain exceeded;
no performance acceptance. Build7.88s has existing large chunk and2.57MB
nonprecached manifest warnings;756precache entries37327.57KiB.
Engine-only coverage 60files: s 7980/8470 (94.21%), b 1808/2031 (89.02%), f 291/310 (93.87%); this does not measure schema validation.

Final log SHA256:

- frost-a-green-final: `420d4b88ebeb5d8e3d5308823151a906532a0b2ce09df44a28f7128e19cc8e74`
- frost-a-engine-final: `47a488a5b3cd9d06cca0b63d4d6a73f8bf4222bcac6e4e67748e70b9cb9cbafe`
- frost-a-related: `a740905c6084ca95163c51ff545f3ed96c7057149c63f129bbefdf676c09acf5`
- frost-a-full: `ad506009ae6eab6ce5ddbc3f91934315f89e3d9b3b98073e94488f6f4e267e46`
- frost-a-typecheck-final: `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`
- frost-a-lint-final: `f993e44b236baecc1c859ee65eddb3e93dd84768b4b42839e265cb8901074f9e`
- frost-a-build-final: `ab86e12bb62f6a3c99648b4d671d956b9a1a930cea922e87be48a154f4845e4a`
- frost-a-coverage: `e583fb60b4a64b3f35686a5f290bb1e7bfd61f34c6dcbd8c5c8496ce2bc4fa78`
- coverage-final.json: `1415bb2f474900495e62808154ad2c50a5eddcef339fb2dab26b15e2e3dbf36e`

A has no authored opt-in, adapter construction or combat change and no runtime/
ordinary-browser Freeze acceptance. BUG040 stays open for B. Root/producer/QA final independent
combined APPROVE / ADEQUATE. All raw consumers finished before root removed
and verified absence of the exact A scratch, task-owned dist and local .vite.
Dependencies/shared caches/source/history preserved. No task processes remain.
A representation is accepted; BUG040 remains open for behavior B.


## P08a04b actual authored/runtime RED before behavior edits

Input ea1d4c3 (accepted representation A). Only two test files changed; actual
Sorceress JSON/dataCatalog construction/combat and A schema/tests are unchanged.
Command: npx vitest run --project engine src/engine/combat/frost-nova.test.ts
src/engine/skills/registry.test.ts --reporter=verbose. Final reviewed RED:
22failed/71passed/93total,0skips,runner1.69s/wall3.042s,exit1.
Typecheck0/wall9.951s; scoped test lint0/wall6.257s.

The real Frost row is validated against the accepted strict schema before each
actual engine case, then loaded unchanged through default production registry,
never replaced through registerSkill. Six rank1/20 ×trash/boss/chapter cases
retain literal canonical action1300ms,33/90cold and20mana/zeroMP controls before
failing exactly on missing secondary Freeze after Chill. Other failures cover
missing actual10% metadata/list, downstream failed-proc RNG transport, missing
Freeze at real1000/500ms expiry cases, ordered AoE independent draws, lethal
status-before-death, A/B/A and general plural primitive handling. No RNG mock.

32 new tests comprise four registry and28engine cases. Scalar/no-status opt-out
controls, natural seed4 miss-before-second-target, mana19/level5, inside/exact
CD controls, actual Fire Bolt/Plague Javelin/Amplify controls pass. Synthetic
ordered-chance0/1/stack/DoT and scalar-vs-one-entry-list probes are labeled and
never replace actual Frost. Main real input/JSON/registry snapshots are compared
before/after first execution; repeat/normal-recorded parity is additionally
asserted in intended GREEN. No ordinary-earned/browser/fullskills acceptance.

Initial run had the same22/71runtime result, but TSC/lint caught a test-only
incorrect exported result type name, explicit undefined optionals, wrong
listSkills return assumption and a numeric test-name interpolation. Corrected
using actual existing signatures, omitted-field construction and String(), no
source change/suppression/oracle weakening. A later instrumentation-only test
refinement validates actual JSON before every registry load and checks first
execution immutability; final22/71 remains unchanged with clean TSC/lint.

Frozen SHA256:

- engine test: `0758b395c67a47e5959760933c31047c9caecccc9ddc20d96c8f85920619c578`
- registry test: `b0ccd69d511820c395947c35d56e6c25752ac260491b710bee3750a8b8600b36`
- unchanged A loader tests: `fb9dfc5a63d4f782835cebd307f7c2fd752da6c494927c84dd1fdcb53c32923e`
- unchanged combat: `e5fdfc6134f58c8e97665ea446cfd06b782055187b814e00d95f1c1ebcc692c1`
- unchanged adapter: `2372be32736f22127edf43065c5afc020cdcaff930daddac2108040a7982f8b5`
- unchanged Sorceress JSON: `9c633b4a752cf3c42a914a54289c0e4a77b4d6cbffe292728c5f761f4a0c9e16`

Root raw directory:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frost-behavior-jssq614n
Final labels frost-b-red-reviewed, frost-b-red-reviewed-typecheck and
frost-b-red-reviewed-lint. Initial attempts retained separately for reviewers.
Reviewed RED log SHA256:
`fe5f47644a99e1398c90a7ea69828fb7b0fbbe01c84994bfa458da2b767beea5`.
Independent producer/QA RED review precedes any behavior source edits.

Root/producer/QA independently APPROVE / ADEQUATE frozen B tests and genuine
actual runtime RED before source edits. QA classified22failures as3registry,
17actual Frost combat and2explicit synthetic primitive probes;9combat controls
pass. No test change requested. Later assertions still require real GREEN.

## P08a04b bounded behavior source and focused GREEN

Tests/docs checkpoint a936182. Exactly three source files changed: player
Sorceress JSON adds Freeze chance0.1, adapter emits complete ordered opted-in
primary+secondary or unchanged legacy scalar/no-status, combat normalizes both
forms into one loop after hit gating and before existing death finalization.
No A schema/types/tests, status lifecycle, scheduler, RNG or target-order change.
Frozen tests remain unchanged. First GREEN93/93 across2files,0skips,exit0,
runner1.36s/wall2.577s. No failed behavior-fix attempt or oracle modification.
All previously unreachable assertions now pass, including rank1/20×three-tier
real suppression, exact1000/500ms expiry, independent AoE rolls, lethal order,
CD/resources, replay/A-B-A/input immutability and scalar compatibility.
Root/producer/QA source/focused APPROVE / ADEQUATE; final combined pending.

Source SHA256:

- Sorceress JSON: `27ac6eda7c44610b932e28ccbad8aa778cd52ef0bee375044a2cb3c41f07e2c6`
- dataCatalog: `9f78ab8da6ccd9dea2c28ba515f29f5f79e2bd13e42bc143f873421268567194`
- combat: `6c4429e485a812c6ce3616962ace0ade3a1b4f3118a7359956705933ef5d5b43`

Focused GREEN log SHA256:
`8450771d185ca843da3cae8ca4b9a921b2c1cb53b4b6e939645fde148d95642a`.

## P08a04b final combined validation

All source and frozen test hashes above remain unchanged. Every check exits0;
no unit skips/failures. Final engine925/51files, related1388/74,
full2030/128 and coverage2030/128 pass. Typecheck, lint/purity51files and build
pass. Engine5.32s/related25.99s/full28.86s runner durations exceed3/5/15s
budgets; those are open performance caveats, not performance acceptance.
Build8.61s has existing large-chunk and2.57MB nonprecached-manifest warnings;
756precache entries37327.78KiB and stale Browserslist-data warning. Coverage
runner31.12s/wall34.622s. No UI/browser/ordinary-earned gate is inferred.

Configured80% engine coverage gate remains unchanged. Coverage60files:
statements7993/8478(reporter94.27%; mathematical ratio94.2793%),
branches1834/2053(reporter89.33%),functions291/310(reporter93.87%).
Whole dataCatalog229/229statements,100/105branches,7/7functions;
whole combat1136/1167statements,395/440branches,46/46functions.
Changed-added-line selection (git diff --unified=0 versus a936182):
select statements whose statementMap.start.line is an added line, and branches
whose branchMap.line is an added line, counting every arm of each selected
branch. Adapter21/21statements23/23arms; combat8/8statements8/8arms.
QA independently selected branches by any location overlapping the added lines:
adapter25/25arms,combat13/13arms. Both selections are fully covered; their
different counts reflect location-selection methods, not contradictory results.
Coverage is engine-only; schema/content validity is established by loader/tests,
not coverage. These changed-location counts do not imply full-module100%.

Exact commands, checker wall seconds and log SHA256:

- frost-b-green: `npx vitest run --project engine src/engine/combat/frost-nova.test.ts src/engine/skills/registry.test.ts --reporter=verbose`; exit0, wall2.577s; `8450771d185ca843da3cae8ca4b9a921b2c1cb53b4b6e939645fde148d95642a`.
- frost-b-engine: `npm run test:engine`; exit0, wall6.425s; `cb0490aeb1a89a5c83d256a1d64f6898f20b968727da17d3cc24be01861e99cc`.
- frost-b-related: `npm run test:related -- src/data/skills/sorceress.json src/engine/skills/dataCatalog.ts src/engine/combat/combat.ts`; exit0, wall27.645s; `b9367089aef619426c767bbd7ee1d92aa0cefdfae3d1da03980256567492c242`.
- frost-b-full: `npm test`; exit0, wall30.36s; `8ab195d32f96ac66f1768a9fbcc576bda56624b3576bbb0bfd1a518867114a9d`.
- frost-b-typecheck: `npm run typecheck`; exit0, wall11.616s; `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47`.
- frost-b-lint: `npm run lint`; exit0, wall37.962s; `64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f`.
- frost-b-build: `npm run build`; exit0, wall13.9s; `487227ca44b5739b3c34e0fe89d6f74348b7fcfcf99f9c6dc225a997c5248536`.
- frost-b-coverage: `npm run test:cov -- --coverage.reportsDirectory=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frost-behavior-jssq614n/coverage`; exit0, wall34.622s; `9388d02b4aded7e00f04fcf577ad41dc718c28a72490c065d8c13cb28c5bdc6f`.

coverage-final.json SHA256: `d9a88aecceff6201472cb5e1d7da61baa4c4d084ff63377fd5253faac05a6cd9`.
Root/producer/QA final combined APPROVE / ADEQUATE. All independent B raw
consumers finished; exact root-owned raw/build/cache cleanup follows.
Existing React unit-test warnings remain; no browser/runtime console claim.
No fullskill/campaign or C0–C4/G0–G7 gate accepted.
