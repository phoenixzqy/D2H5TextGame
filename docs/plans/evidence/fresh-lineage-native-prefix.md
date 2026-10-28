# Fresh public character lineage — terminal collection failure

Date: 2026-10-28 UTC. Base: `33cf626fbb8ad7cbe8e2d2e6ffd30f845d0a6def`.
Status: sole invocation consumed; native exit 1 during collection, before test
registration, worker admission or gameplay. No fresh-character acceptance credit.
[BUG-360](../../../production/bugs/BUG-360-fresh-lineage-file-url-collection.md)
remains Open. The frozen experiment is retained as executed; it must not be retried.

## Scope and implementation

The test-only policy registers `fresh-native-normal-blood-moor-once-v1`, lineage
`d2h5-fresh-lineage-gxhxzxtj`, parent null and a fixed owned external packet.
Its intended public route is empty-state persistence initialization, one unchanged
Sorceress creation, actual adapter/decoder save/load across fresh module realms,
then one default manual Normal Blood Moor challenge and at most three settlements.
Only owned Dexie constructor/table IO is emulated. This route was not reached.

The `.once.ts` entry is outside ordinary workspace discovery. The installed public
`startVitest` launcher uses a dedicated root, exact include, jsdom, one isolated
fork, no inherited setup, no retry/watch/installation and unchanged
5000/10000/10000ms test/hook/teardown defaults. Parent code/signal, task tree,
unhandled/start/worker/close diagnostics and a flushed footer are retained.
A durable exclusive launcher record prevents a second parent invocation.
Worker admission would exclusively flush a permanent consumed marker before
native imports/actions; collection failed before that admission.

Deterministic policy controls cover exclusive admission, callback failure,
source drift, finite action budgets and first-stop refusal. A 4900ms monotonic
action deadline plus permanent runner failure/finished signals guard resumed
callbacks without changing Date or the installed timeout. These controls do not
prove the unreached native creation, combat or persistence assertions.

## Frozen inputs and ordinary validation

The 1,872-input source-only map has SHA256
`9215f46349ac536db82d64d18250454a7006dd3a55e1899b9ceb066d0ba90f78`.
It excludes docs, saved fixtures and ancestors, and differs from the preceding
5,346-input map. All final before/after maps match; post-invocation source and
11 installed-runtime fingerprints also match. Actual environment:
Node 24.21.0/npm 11.19.0, Vitest/runner 1.6.1, jsdom 24.1.3, Vite 5.4.21,
Tinypool 0.8.4. CI Node 20 was not run.

Frozen source SHA256 values:

| File | SHA256 |
| --- | --- |
| `tests/sim/production/fresh-lineage-policy.ts` | `d515f387c4b7eae4ea41436db7b32e704d1d84184f86c04e996921270c6dfe61` |
| `tests/sim/production/fresh-lineage-policy.test.ts` | `57744e9bdf4b56e163bd7e14a54a3ec2aff0912dc4b78514697b0ebb508b6c3d` |
| `tests/sim/production/one-shot/fresh-lineage.once.ts` | `8755d7f7011b58487c76e346a1b1ce624d1329178bae15be9fe278dce1c7477a` |
| `scripts/measure-fresh-lineage-once.mjs` | `3e5693aedd40644f01d83a6f2117b9b2d39e2391eaab5e4e997c45f87136dcab` |

| Final check | Native result | Evidence |
| --- | --- | --- |
| Focused policy contracts | 0; 20 passed | `primary-lifetime-*`, outer session 86310, 1.369s |
| Unfiltered full unit suite | 0; 21,242 passed, two unchanged skips, 993 files | `full-final-*`, outer session 24421, 1013.763s |
| Typecheck | 0 | `typecheck-final-*`, outer session 93674, 110.086s |
| Lint and engine purity | 0; 401 engine files checked | `lint-final-*`, outer session 22670, 200.021s |
| Launcher syntax | 0 | `node --check`, no native experiment |

`ordinary-suite-proof.json` compares the exact two existing skips and confirms
all 20 new contracts pass, with the `.once.ts` entry absent from ordinary discovery.
The skipped identities remain the declared authentic Rocky Waste continuation
in `fresh-campaign-continuation.test.ts` and bounded authenticated farming policy
in `fresh-campaign-economy.test.ts`. No test/configuration/timeout was weakened.

The initial missing-helper RED has zero assertions and only structural RED credit.
The first typecheck fails because `cacheDir` was put in CliOptions; the final
version puts it in the fourth Vite overrides argument. Review v1 also identifies
async timeout continuation; v2 approves the lifetime guard, security pass, no
remaining findings. Failed/intermediate evidence is retained. The final source
review approves only the exact frozen invocation, security pass/findings[], SHA256
`184eb768c9165e166175a4adf429071cede477d3f4ec2042dc57c6ccfb12df00`.

## Actual terminal result

Exactly one `node scripts/measure-fresh-lineage-once.mjs` invocation ran from
the claimed worktree; outer tool session 18415 returned native exit 1.
The parent retains child exit code 1, signal null and wall duration
1671.784203ms. Vitest reports one failed suite, zero registered tests and 916ms.
The footer records `closed=true`, `success=false`, `error=null`,
`sourceError=null`, `unhandled=[]`, and the collection error diagnostics.
No close error or hanging-process diagnostic was observed.

At `tests/sim/production/one-shot/fresh-lineage.once.ts:38`,
`fileURLToPath(new URL('../../../..', import.meta.url))` throws
`ERR_INVALID_URL_SCHEME: The URL must be of scheme file`. The entry assumes
its module-relative URL is a Node file URL under the jsdom/Vite environment.
The rejected URL itself was not retained, so its exact protocol and
transformation remain unverified. No second diagnostic invocation was performed.

This top-level expression precedes `it()` registration and `withFreshAdmission`.
The exclusive `launcher-invoked.json` exists and is retained permanently for this
attempt; `attempt.consumed.json` is absent because worker admission was never
reached. Its absence does not permit a retry. There are no genesis, creation,
reload, action, policy-result or worker-finally observations. Zero characters,
runs or settlements occurred; no seed, win/defeat, reward, source mix, material
income or actual save/load result was observed. This is a terminal harness failure.

Independent terminal review accepts the failed-invocation evidence, security
pass, with finding FL-03 (the collection defect), SHA256
`019fa37f1044cfeb77a637583245af9a27355c56b9d0744d4ff59c1658a76457`.
This accepts the recorded failure, not native gameplay acceptance. Independent
document review has no material findings, security pass; final hashes and cleanup
confirmation are retained in the packet review receipts.

## Acceptance limits

The existing material journal remains
`kind=constructed-ordinary-kill-control`, `highRuneEarned=false`,
`activeHourAcceptance=false`. The lineage envelope supplies auditable experiment
continuity only. Human active time remains unobserved; runner wall time is not
combat simulated time or active play time. Actual IndexedDB/browser durability
was not tested even by the intended emulated IO route.

BUG304/180/354/355/356/357/358/359 stay Open; BUG360 is added for this harness
failure. Skill inventory remains 212 bounded plus one unverified Cobra.
Earned high-rune source mix/affordability, 30–50 active-hour pacing,
14 builds × five acts, defeat/fresh retry, whole-app locales/devices/a11y/
performance/PWA, actual CI and human/soak/full-v1 acceptance remain unresolved.
H3 remains terminal `H3_PREREQUISITE_FAILED_NO_APP`; no browser retry or replacement
card occurs. No publication, merge, deployment, bug closure or full-v1 completion.

## Retention and cleanup

Root retains exact raw validation/native logs, source/runtime maps, manifest,
launcher invocation record, failed diagnostics and independent reviews under:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-fresh-lineage-gxhxzxtj`.
Retention lasts through unfinished goal/review consumers; root owns eventual
verified cleanup. The configured native Vite cache is absent. All 54 exact logged contract
temporary directories are absent. After document-review readers released the
applied draft, root removed that exact file and verified its absence. The final
cleanup receipt records these paths, no remaining disposables/processes and
failures[]. Shared caches and the active claimed worktree are retained.
