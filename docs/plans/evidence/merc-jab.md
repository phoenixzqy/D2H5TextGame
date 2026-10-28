# Native mercenary Jab — BUG-370

Native implementation checkpoint, 2026-10-28. Base:
`8b279e6d55b69b4597493fb872190d85d9c4ed7a` in the existing claimed
human-worktree-2. Historical unfiltered validation stopped after a boundary
breach; the revised ordinary unit inventory now passes. Browser, earned recruitment,
balance and full-feature acceptance remain open.

## Contract and repair

[D04](../decisions/D04-merc-jab-v1.md) restores the gacha-spec's advertised
three physical attempts and +50% physical damage for all six Act II mercenaries.
It explicitly reconciles two previously unspecified details: each attempt adds
100% current Attack to authored flat 18–28, and the 50% bonus adds to ordinary
increased damage. These are new scoped decisions, not old-stub behavior.
For flat 20 / Attack 100, a landed noncritical attempt gives 180 before
mitigation; another +30% increase gives 216, not 234. Attack zero gives 30.

Closed exact-ID JSON/schema tuning and an immutable validated resolver replace
only the Jab stub. An optional effect-local increase enters the ordinary damage
input with default zero. The existing hit sequence makes independent attempts
against the original enemy and stops on target or caster death, including
reflection. One action and 1s cooldown cover the sequence; zero MP and no rank
growth remain. Both locales describe three hits, Attack and the damage bonus.
No additional combat loop, RNG stream, acquisition or persistence change is used.
Player Amazon Jab and other skills retain their separate contracts.

## Causal evidence and preserved corrections

The original two-case seed-7 primary uses actual loaders, the owned factory,
projection and default registry. Constructed surviving parties isolate the
mechanic; this is not earned recruitment evidence. Native RED exits 1 with two
failures in 9.791339s. Both Attack 100 and 200 produce one damage event, amount 19,
instead of three Attack-sensitive attempts. Its 2,063 inputs are unchanged at
`a8c248e612e0c1716204cfa81de31a5e43c5148faf269130ba056846630b014f`.
BUG-370 was filed after RED and before production edits.

The original primary oracle omitted Holy Freeze's existing Chill ×1.1 physical
combo. Independent review approved changing only two literal arrays and their
explanatory comment before production edits. The numeric successor obtains a
fresh native RED in 8.911689s at unchanged input map
`caea1351f48f95dd3d4a882c8ca1b2e859816739d06ed098139f0fbfbed08afc`.
Its expected arrays are Attack 100 `[194,202,198]` and Attack 200 `[359,367,363]`.
That successor GREEN passes both cases after implementation in 8.402117s.

Initial focused execution preserves 222 passes / one failure: a new playback
test incorrectly equated raw carried statuses with ambient presentation Chill.
The reviewed correction retains player status equality for all six, explicitly
checks Holy Freeze's raw `[hold]` and presented literal `[hold, ambientChill]`,
and keeps direct enemy status equality for the other five. Initial typecheck
also preserves one local inferred-optional-property diagnostic; the existing
`PlaybackStepResult` annotation and conditional initialization fix it without
widening production types.

Initial lint preserves seven errors from Vitest asymmetric matchers returned
by map callbacks. Independently approved `: unknown` return annotations erase
at compilation. Both affected source versions emit byte-identical JavaScript
under identical installed-esbuild options; the retained proof includes the
initial interrupted artifact-script attempt and corrected source hashes.

The complete original primary SHA256 is
`ba38b3ba36c49360b18ebdadca54779281eea52b20dadd6640c03cec7089e3d5`.
The numeric successor is
`d42d9b87eb12f7f856822d132a6c2588a5c0d97ba45f408cd666e3a232a132a5`;
the typed successor is
`9d01f9db5b8519e0818d1d1878e81cdc9b94e19b93f4a9decaa946b8f797cf63`.
Original and successor source/bindings/receipts remain retained. No typed-source
RED is claimed.

The initial complete engine suite exits 1 in 262.002080s with 11,197 passes and
one existing test failure. Its absent/zero Attack-metadata control depended on
the retired one-hit Jab stub. Independent review approves replacing only that
dependency with a unique local ordinary physical 18–28 fixture. Seed, stats,
complete recording/result equality, input immutability and literal 18 remain.
The exact original test and failing native run are preserved; no timeout occurs.

## Current verification

The final corrected source has 2,067 inputs at
`8c756b191d283b41cba9f5a59f5121e3256b725ed82fe554c5e6a20881885010`.
The unchanged typed primary passes two cases in 8.391146s; focused verification
passes 237 cases across 11 files in 17.515579s; scoped lint passes with zero
warnings in 9.711329s; project typecheck passes in 135.313762s; the complete
engine suite passes 11,198 assertions across 418 files in 287.948324s. Before/after
inputs match for each. Independent corrected-source/design/coverage/security
review approves this exact source map with no findings and readers released.

The four new test files supply 64 cases: authored/schema 37, combat 18,
primary 2 and public lifecycle 7. They cover literal arithmetic and additive
stacking, misses/criticals/mitigation, rank/MP/cooldown boundaries, early death,
all six real configurations, immutable replay and public playback convergence.
Historical unfiltered full-unit validation is incomplete. That run discovered the closed
P15 harnesses: the screen self-test's `beforeAll` invoked
`withP15Realm → loadP15Source → readFileSync(policy.source)`, accessing the
protected earned-endgame4 retained fixture. The measurement self-test also
completed four frozen benchmark attempts. These actions breached the standing
execution boundary; they do not earn acceptance. The independent import audit
confirms both paths. No further protected access or closed execution is allowed.

One screen test expected a draw (`null`) but observed a player victory. The two
failure markers refer to that one failing test. Its live-wave draw premise is
brittle; attribution to Jab is unproved. Neither changing the expected winner
nor rerunning the closed screen is an approved repair. Extracting policy-free
classification controls alone would leave other closed execution paths intact.

Root stopped only the four verified task-owned processes. The native receipt
records exit -15 after 1026.365767s, unchanged 2,067 inputs at the map above,
and terminal execution. This is an intentional boundary stop, not a timeout or
pass. No completed native full JSON report exists. Original source, logs,
receipts, stop actions and the independent diagnosis are preserved; see
[BUG-371](../../../production/bugs/BUG-371-ordinary-suite-closed-harnesses.md).
Full zero-warning lint/engine-purity passes in 243.853414s and the external
production build passes in 14.875969s, both on unchanged inputs at the same map.
The build retains large-chunk and oversized-manifest precache warnings; stale
Browserslist data is also reported. No dependency or budget change is made.
Those receipts precede the following structural boundary repair. No historical
full pass or completed local checkpoint is claimed. Bash stays queued.

## Ordinary testing boundary repair — BUG-371

Producer approved the concrete proposal and clarified that the earlier blanket
no-discovery-change wording was an agent diagnosis, not an independent user or
repository restriction. The original implementation task authorizes a reviewed
structural repair. Protected-source/closed-policy restrictions remain unchanged.

Default discovery now separates the engine/UI/constructed contracts from the
explicit diagnostic workspace. All 36 original diagnostic tests are byte-identical;
none of their assertion sets or runtime bodies was changed. Original codec,
store observation and wave classifier bodies initially move unchanged into the policy-free
contracts directory. Old consumers retain compatibility exports; the ordinary
publication test changes only two import specifiers. Three constructed classifier
cases preserve the original victory/dead-hero/draw assertion sets and supply no
earned-gameplay or diagnostic acceptance.

The root config checks default discovery/startup/resolution settings and transitive
runtime source edges as data before Vitest loads tests. Independent source review
found missing mock edges, unmodeled/ambiguous configuration and cross-function
identifier ambiguity. Four native control groups fail before correction (10 pass /
4 fail), then all 14 pass. The reviewer approves the corrected guard and permits
focused/ordinary unit execution. This is a bounded structural safeguard, not an
adversarial JavaScript sandbox. [Testing boundary](../../qa/unit-test-boundary.md).

The reviewed source audit covers 989 tests and 1,571 source modules without
diagnostic runtime edges. Focused native verification passes 280 tests / 13 files
in 19.431953s on unchanged 2,075-input map
`c28a0073249b5bc222841725e70669e8a5f161e166dfe4e8ed790e02340fda8c`.
That map now includes the new standalone diagnostics config and extracted helpers;
it must not be equated to the old 2,067-input map. Original guard RED/GREEN,
full source audit inventory, 36-file identity receipt and independent approval
are retained in the packet. No diagnostic workspace is executed.
The external runner still refuses its historical `full` mode before any snapshot
or subprocess; the new permitted gate is explicitly named `unit`.

The ordinary unit run passes all 21,037 tests across 989 files with zero pending/
skipped tests in 1205.158348s. Native discovery matches the audited file inventory
exactly. Full zero-warning lint/engine purity passes in 363.855911s and the external
production build passes in 31.776340s. All before/after inputs match at the
2,075-input map above. The long unit duration does not meet the nominal budget;
neither performance nor BUG-180/366 timeout-cause acceptance follows.

Expanded explicit lint of otherwise ignored contracts reveals one inherited
redundant null condition, and project types expose one new classifier fixture
annotation permitting undefined. Both actual failures and source predecessors
remain retained. After active checks terminate, independent review approves only
removing the redundant condition after the earlier null return and narrowing the
kind argument to `NonNullable<CombatUnit['kind']>`. The codec is semantically
equivalent after this correction, not byte-identical. The annotation emits
byte-identical JS; no fixture values or assertions change.

Exactly those two helper paths differ in successor 2,075-input map
`c4ea68c9147f886609c53d613e87419db9cb472b03ef603adab7227994d82cf4`.
Corrected publication/classifier checks pass 43 cases / two files in 10.840405s
and explicit zero-warning scoped lint passes in 13.282558s. Final source audit
still covers 989 tests / 1,571 modules and all 36 diagnostic hashes match. The
complete ordinary run, full lint and build are predecessor-map evidence; they
were not rerun or relabeled as successor-map checks. Final project typecheck
passes in 127.519487s on unchanged successor inputs. Separate final review and
commit-binding receipts govern the local source checkpoint; no broader
acceptance follows from it.

## Retention and acceptance limits

Root retains readiness, original/successor primary lineage, native failures,
reports/logs/receipts/input maps, source copies, diagnoses and independent
reviews at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-jab-r33hewez`.
The packet remains necessary for unfinished Jab and umbrella acceptance; root
owns eventual exact-path cleanup. The exact disposable external build was
removed after completion: 762 files, 42,280,626 bytes and 10 directories.
Absence is verified; all recorded task process IDs are absent/non-running.
`boundary-build-cleanup.json` retains the final removal inventory;
`boundary-checkpoint-verification.json` records final input, diagnostic identity
and process checks. The earlier cleanup receipt remains historical evidence.
There are no cleanup failures. Shared caches, history, tools and the registered
worktree are preserved. The evidence packet remains for unfinished consumers.

BUG-370 remains Open for browser/earned/feature acceptance; BUG-180/366 timeout
causes remain Open. Passing workloads do not establish a timeout cause/fix or
speedup. Player-skill inventory remains 212 bounded / one unverified. Campaign,
economy, build matrices, pacing, defeat/retry, devices/locales/accessibility,
performance/PWA, actual CI, human, soak and full-v1 acceptance remain unresolved.
The 30–50-hour target is player campaign length; accelerated simulations and
selected real-time playtests verify pacing. The separate two-hour stability
soak remains pending.

H3 remains terminal `H3_PREREQUISITE_FAILED_NO_APP`; no app/browser retry occurs.
Correction: the earlier draft incorrectly claimed no protected access or closed
policy execution during this Jab validation. The full run did both, as recorded
above. The pre-correction draft is retained in the packet. Historical unfiltered
suite passes do not establish boundary compliance either; their older claims
are not revalidated here. No fixture modification is observed. No new
acquisition/lineage/gameplay replacement experiment, push, merge or deployment
occurs. The full goal and claimed worktree stay active.
