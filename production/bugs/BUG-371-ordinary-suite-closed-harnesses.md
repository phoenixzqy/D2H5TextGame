# BUG-371 — Separate ordinary test discovery from closed production harnesses

Status: Open — structural repair reviewed; ordinary unit and corrected focused/
lint checks pass; final project types pass on the successor. Final review and
source commit binding are recorded separately. Historical unfiltered run stays
failed.
Severity: High — ordinary full-unit validation cannot safely run under the
standing closed-policy and protected-fixture restrictions.
Owners: technical-director / qa-engineer; producer reviewed the import closure.

## Observed reproduction — do not repeat

- Base commit: `8b279e6d55b69b4597493fb872190d85d9c4ed7a`, with the Jab
  working changes at unchanged 2,067-input map
  `8c756b191d283b41cba9f5a59f5121e3256b725ed82fe554c5e6a20881885010`.
- Environment: Linux, native Vitest via `npm test`; browser/viewport not used.
- Locale: engine invariant; neither locale UI exercised.
- Seed: existing closed screen's seed 1; four measurement attempts use its
  frozen policy. No new fixture access or execution was used for this report.

1. The already-recorded unfiltered `npm test` run discovers
   `tests/sim/production/p15-build-screen.test.ts`.
2. Its `beforeAll` calls `withP15Realm → loadP15Source →
   readFileSync(policy.source)`, reading the protected earned-endgame4 fixture.
3. Ordinary discovery also runs `p15-build-screen-measure.test.ts`, which
   defaults to benchmark mode and executes two builds × two repetitions.
4. Root discovers the forbidden dependency and stops only the four verified
   owned processes. Do not reproduce these steps again.

## Expected and actual

Expected: ordinary unit verification respects the standing protected-source and
closed-policy execution boundary. Classifier unit controls do not depend on a
saved earned-gameplay realm or a particular native combat outcome.

Actual: the ordinary suite imports closed policy, reads the protected fixture
and completes four benchmark attempts before the stop. One screen assertion
expects `winner === null` but observes `player`. Two failure markers represent
one failed test. Causal attribution to Jab is unproved and unnecessary for the
discovery diagnosis. Root should have checked the import closure before launch.

The run ends intentionally with exit -15 after 1026.365767s, inputs unchanged.
No completed native full JSON exists. This is neither a timeout nor a full pass;
it provides no additional gameplay, build, balance or pacing acceptance.

## Evidence and diagnosis

Root retains exact originals and evidence at:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-jab-r33hewez`.

- `full.log`, `full-result.json`, `full-policy-boundary-stop.json`.
- `full-policy-boundary-audit.json`: independent closure diagnosis and original
  test/evidence copies with SHA256 bindings.
- `boundary-original-screen-test.ts`, `boundary-original-measure-test.ts`.

Import sites: `p15-build-screen.test.ts:10,22`,
`p15-build-screen.ts:28`, `p15-build-screen-measure.test.ts:16`.
The classifier premise is at `p15-build-screen.test.ts:71`.

Root cause: ordinary discovered self-tests couple policy-free classification
with closed fixture preparation/authentication and benchmark execution.
Additionally, the draw classifier test assumes a live seed-1 wave always draws.

## Reviewed structural repair

Producer approved the concrete source-only proposal and corrected the earlier
authority wording: this report's blanket prohibition on discovery changes was
an agent diagnosis, not a separate user/repository restriction. The original task
authorizes a reviewed structural fix. Protected-fixture and closed-policy
execution restrictions remain binding; no permission hold is required for this fix.

The default workspace retains the existing engine/UI projects and discovers
policy-free `tests/sim/contracts` controls. All 36 original production diagnostic
test files remain byte-for-byte unchanged in an explicit standalone workspace.
The old diagnostic npm entrypoints select that workspace explicitly; they must
not execute in this task. No test is skipped, assertion weakened, winner changed
or combat tuned to recover the old draw.

Codec, store observation and wave classifier bodies initially move unchanged
into the policy-free contracts directory, with compatibility exports for old consumers.
The ordinary publication test changes only its two helper import paths. Three
constructed classifier cases retain the original victory/dead-hero/draw assertion
sets without a saved realm or gameplay run. These controls do not establish
diagnostic or gameplay acceptance.

The root Vitest configuration invokes a source-only preflight before default
test discovery. It checks supported workspace/startup/resolution settings and
the transitive runtime source graph without evaluating inspected modules;
unsupported or ambiguous forms fail closed. Native guard controls cover the old
discovery boundary, mock loaders, configuration ambiguity, binding ambiguity and
symlinks. CI runs guard self-tests before its existing coverage gate.
See [testing boundary](../../docs/qa/unit-test-boundary.md).

Independent review initially found three guard gaps. Four new control groups
failed (10 pass / 4 fail), then all 14 passed after correction. The reviewed
source audit records 989 tests / 1,571 source modules; all 36 diagnostic hashes
match. Focused native verification passes 280 tests / 13 files. The ordinary unit
run passes 21,037 tests / 989 files, with no pending/skipped tests, in 1205.158348s
on unchanged 2,075-input map
`c28a0073249b5bc222841725e70669e8a5f161e166dfe4e8ed790e02340fda8c`.
Native file discovery exactly matches the source audit. Full lint/engine purity
and production build pass on the same map. This does not meet the nominal test
runtime budget or establish performance/timeout-cause acceptance.

An additional explicit lint check on the otherwise lint-ignored contracts finds
one inherited redundant null condition. Project types find one new helper-kind
annotation allowing undefined under exact optional-property rules. Both failed
receipts and source predecessors are retained. Independent review approves only
removing the null condition after the earlier null return and narrowing the
required kind annotation with `NonNullable`. The first is semantically equivalent;
the second emits byte-identical JavaScript. No fixture value or assertion changes.

After all active predecessor checks terminate, those two corrections produce
2,075-input successor map
`c4ea68c9147f886609c53d613e87419db9cb472b03ef603adab7227994d82cf4`.
Exactly those two source paths differ. Corrected publication/classifier checks
pass 43 tests / two files in 10.840405s; explicit zero-warning scoped lint passes
13.282558s. Final source audit retains 989 tests / 1,571 modules and every original
diagnostic hash. Final project types pass in 127.519487s on unchanged successor
inputs. Separate final review/source commit bindings govern the local structural
checkpoint. The complete ordinary run is predecessor evidence, not a second run
on the successor map.
The historical `full` runner remains refused; the permitted gate is named `unit`.
Bash remains queued until the Jab checkpoint is bound to local commits.
