# BUG-439 — Cold validation import outlasts the structural test's default deadline

Status: fixed locally, uncommitted (owner excludes commits).
Severity: Medium (QA reliability; no save-validation behavior failure).
Build: HEAD b5a0898 plus local private-v1 work, WSL/Node24.21.0,
Vitest1.6.1 engine/Node project; browser/viewport/locale not involved.
Affected systems: save regression execution budget; root sole writer.

## Reproduction and evidence

1. Run ordinary engine/sim-contracts sweep: compile-laziness times out at5000ms.
2. Run just `src/engine/save/compile-laziness.test.ts`: same5000ms timeout.
3. Run the unchanged isolated test with diagnostic `--testTimeout=15000`:
   every original assertion passes, test body6380ms (Vitest7.01s, wrapper19.132s).

Evidence in retained packet `d2-counted-source-z3jj3xa1`:
`p15-unit-unreached-engine-v1`, `p15-compile-laziness-isolated-v1` and
`p15-compile-laziness-budget-diagnosis-v1` logs/receipts. All completed owned
processes exited. This is a repeated default deadline failure, not an assertion
mismatch to hide or a proved production performance defect.

## Diagnosis and correction plan

The test intentionally resets the module graph and cold-imports the complete
real validation dependency graph through Vite. Its promise includes real schema
compilation, four changing validation outcomes, input immutability and explicit
compile-count/function-identity checks. Its stated contract is structural reuse
and lazy compilation, with no five-second product latency requirement. The
measured valid test needs6.380s; the implicit5000ms budget cuts it off.

Set an explicit bounded15000ms deadline on this one cold-import test, keeping
all original functional, negative, compile-count, unused-version and identity
assertions unchanged. Do not warm imports, mock compilers, cache validation
outcomes, raise global timeouts or change production. Verify with the ordinary
focused command without timeout override, strict types and scoped lint.
Production-browser public import independently exercises real save behavior.

Security check: pass; scoped local test execution budget, no validation guard,
credential/network/dependency/permission/CI/publication change. Root-cause
review: separate the deliberately cold structural test from the runner's
implicit generic deadline; preserve the actual structural resource contract.


## Verification

The sole cold-import test now has an explicit15_000ms deadline and an explanatory
comment. All assertions and production validation remain unchanged. Ordinary
focused command without a CLI timeout override: `p15-cold-validation-green-v1`
9PASS/2files20.596s (cold validation body7663ms; native elitePack8cases also pass).
Strict types PASS15.048s; scoped lint PASS13.827s. Exact owned process receipts
report no live descendants. The original broad and isolated timeouts remain
failed evidence; this focused result does not relabel either broad run green.
