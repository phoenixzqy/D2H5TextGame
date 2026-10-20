# BUG-045 — Publish coherent derived stats when allocating attributes

Status: A fixed in this commit; root/producer/QA final APPROVE/ADEQUATE.
B draft/UI/browser remain open. Regressions: stat-allocation.test.ts and the
source-reconciled warmth-composition.test.ts.
Severity: High (attribute spending leaves persisted/displayed derived stats stale).
Owner: engine-dev / frontend-dev; root integration, independent producer/QA.

## Reproduction

Input head67e4019, runtime baseline5f14aa7. Linux/Node24/Vitest ui/jsdom;
viewport, locale and RNG seed are not applicable to this synchronous store
reproduction. Separate UI gap is source-confirmed in CharacterScreen143–185:
unspent points are displayed but no allocation control exists. No native
allocation/save/reopen acceptance is claimed in A.

1. Create an unarmed L4 Sorceress: base10/25/10/35, statPoints1,
   derived life120/144, mana102/114, attack28, defense29, attackSpeed125.
2. Call the real playerStore.allocateStatPoint('vitality').
3. Observe vitality11 and points0, but unchanged lifeMax144 (expected146).
   Energy35→36 similarly leaves manaMax114 instead of116. Export serializes
   this stored player; combat adapter recomposition does not repair it.
4. Repeat with current inventory gear and stale player.equipment decoy;
   expect current authoritative equipment exactly once and one publication.
5. At numeric legacy balances0.5 and base499.5/500/501, attempt one point.
   Current source subtracts a full point or exceeds the authored base cap.

Expected: one base+1 and one available point−1 with full canonical derived
recomposition at current level/current inventory.equipped in one publication.
Preserve/clamp current HP/MP without refill. Refuse without publication when
no player, balance<1 or prospective chosen base+1>500. Preserve all unrelated
state and legacy values; equipment bonuses do not gate base allocation.

Actual: playerStore165–180 only updates base core/pool, retaining the original
derivedStats reference. It has no cap and accepts any positive fractional pool.
Root cause: the allocation mutation omits the canonical equipment composition
already used by gainExperience and does not enforce the full spend boundary.
Workaround: later recomputeDerived/combat composition can rebuild derived stats;
neither makes the allocation publication or persisted state correct.

## Controlling sources and scope

[Allocation contract](../../docs/plans/decisions/P11a01-stat-allocation-v1.md).
progression-curve§4.2 explicitly caps each base stat500; equipped-stats9–25
preserves current pools and composes gear. D09 lossless ingest v1d and existing
XP composition establish inventory.equipped authority. save/validate.ts8,133,162
accepts fractional numeric core/point values, so guards inspect prospective
values without coercing or rewriting old saves. Existing0.2 Energy/sec recovery
is unchanged; no formula, class growth, combat tuning, healing or save version.

Security check: pass. Scope: owner-authorized local allocation state/validation.
No credentials, external execution, permissions, networking or policy bypass.

## Existing oracle reconciliation

warmth-composition.test.ts137–145 currently says:

```ts
it('derives a core allocation even before cached derived stats are recomputed', () => {
  arrange(199, { statPoints: 1, skillLevels: {} });
  const before = player().derivedStats;
  usePlayerStore.getState().allocateStatPoint('energy');
  expect(player().coreStats.energy).toBe(200);
  expect(player().derivedStats).toBe(before);
```

The identity assertion explicitly preserves this bug. Replace only that test's
name/identity oracle with literal coherent manaMax350/current102; preserve the
existing adapter manaMax350/recovery40/no-fire-bonus assertions and unchanged
frozen-recording/next-wave integration. Independent source review is required
before the test change. Original whole-file SHA256:
b3602a8d271eab384b041a051967b0e1425584a4a374d9f5957b2823f23ff5e7.
Producer and QA independently approved this exact source-backed correction
and revised five-file runtime scope before amendments.

## Evidence

Documentation checkpoint precedes genuine focused RED/freeze/review and runtime
implementation. Raw logs belong to root's task-isolated stat-allocation scratch
directory until independent evidence consumers finish; exact commands, hashes,
counts, timing limits and final cleanup will be recorded here.

## RED development and oracle correction

Focused new test initial12:8failed/4controls; expanded28:20failed/8controls.
First combined48:24failed/24controls,0pending. Newtest original frozen SHA
4b9e9dd2ebcbd275668c87707672366953d041ec298a47bfe1548d42ff5bbadd;
Warmth06e32670b38acf5bf468071ee107a573a46a63031d6bce00f4feb20f14acd392.
Report7f43cb65e3ec2e3719e4ad2a421a7324000de5c6f7dca9fdd067141d1d83a28f.
No runtime edits. Producer approved; QA required subscriber snapshots at callback
time to detect incomplete publication followed by in-place mutation. Corrected
that evidence gap without changing semantics. Root separately checked native
IEEE754: `0.05 + 26 * 0.002 === 0.102` is false (actual0.10200000000000001).
Source stats121 proves exact decimal equality is an incorrect test oracle.
Use12decimal-place dodge comparison inside full derived equality, retaining
all other assertions. Original frozen sources/reports retained through review.
No production formula or acceptance threshold is changed.

Revised frozen newtest SHA256
5f5c3f70a10701bf86fb596e8ec21ae9fa82f1689365b229ed8b8d54ab71c49a;
Warmth remains06e32670b38acf5bf468071ee107a573a46a63031d6bce00f4feb20f14acd392.
Revised report00f759eed84efbfbfffb02dec0ce91d8ff15f8d3ca2208255a0eddcfea353fd2.
Command: `npx vitest run src/stores/stat-allocation.test.ts
src/stores/warmth-composition.test.ts --reporter=json
--outputFile=$RAW/red-reviewed.json`. Exit1,48total/24failed/24controls/0pending,
4.555s wall. Runtime unchanged during RED.

Full lint first failed only newtest70/73 (void expression and matcher `any`
assignment). No suppression or removed assertion: type the real action binding
as returning unknown and bind the matcher to unknown. Producer approved these
semantics-identical typing changes. Scoped lint passes. Original reviewed
freeze remains in raw evidence; typed test
cae351e687ab57d77b09a63ad09af47c58a590a910cac6abdaacdcf7c17db89d.
Replayed against exact16d2f44 runtime source, then restored approved runtime
bytes in finally and verified both hashes: typed RED48/24failed/24controls,
exit1/4.327s, report4e96fc82aa0be21751386a260b42fc43d599fc110f23356de83b62a282d9b9da.
Warmth test remains unchanged at06e32670…acd392.

## Final A validation

Runtime playerStore SHA256
be3fe95bf2f539497200092b5d5cd9b672b882d4276310defe1ce2bf24b2b2f8;
stats0844625a5c1522094082158a72719a36e3ea3ed476bc4681b91c7bb995b2df8a.
Producer/QA independently approved the source and48focused/987engine GREEN.
The final typed assertions remain intact.

RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-stat-allocation-cugdyonk.
Each command's stdout/stderr is its `<label>.log`; JSON reporters are written
to `$RAW/<label>.json`, coverage to the explicit task-local directory.

| Label | Exact command (RAW paths abbreviated) | Exit | Wall seconds | Result | Log SHA256 |
| --- | --- | --- | --- | --- | --- |
| red-typecheck | `npm run typecheck` | 0 | 9.755 | pass | 53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47 |
| green-focused | `npx vitest run src/stores/stat-allocation.test.ts src/stores/warmth-composition.test.ts --reporter=json --outputFile=$RAW/green-focused.json` | 0 | 6.927 | 48pass/0fail/0pending, 2files | fa9cf826c299daea603ac436057b478fb9e6d6b4086b218cda9d18e83c386db3 |
| green-engine | `npm run test:engine -- --reporter=json --outputFile=$RAW/green-engine.json` | 0 | 6.845 | 987pass/0fail/0pending, 51files | a4d4bfe273c4909c0035a74337e55137363bdee685b057e1a9745f3648916bda |
| related | `npm run test:related -- src/stores/playerStore.ts src/engine/progression/stats.ts --reporter=json --outputFile=$RAW/related.json` | 0 | 30.053 | 954pass/0fail/0pending, 62files | 0e4168689ae0d769bee296941a99e59f1511ad4adf0487f78ff7d034964ca6cd |
| typecheck | `npm run typecheck` | 0 | 16.349 | pass | 53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47 |
| lint | `npm run lint` | 1 | 53.266 | see recorded failure above | 201f15f91a0744e492e88bacbf64527cce4ec003ca1ad8c573771225de41e120 |
| full-coverage | `npm run test:cov -- --reporter=json --outputFile=$RAW/full-coverage.json --coverage.reportsDirectory=$RAW/coverage` | 0 | 45.066 | 2341pass/0fail/0pending, 137files | 670cc1a6938d900f9cfaa766f2292e9df1750ee47f90121c1085b8958f9df350 |
| bridge-build | `npm run check:test-bridge-shake` | 0 | 17.869 | pass | b020bbc31ac6ff4f0f043588482ff44538a9dc83a300a6a79c7a9967e11176de |
| typed-scoped-lint | `npx eslint src/stores/stat-allocation.test.ts --max-warnings=0` | 0 | 5.034 | pass | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| red-typed | `npx vitest run src/stores/stat-allocation.test.ts src/stores/warmth-composition.test.ts --reporter=json --outputFile=$RAW/red-typed.json` | 1 | 4.327 | 24pass/24fail/0pending, 2files | 663fbe9f6401baba8f32fd5e282ad170cff6b040a386eeca10ce3aed81658c33 |
| final-typecheck | `npm run typecheck` | 0 | 19.374 | pass | 53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47 |
| final-lint | `npm run lint` | 0 | 47.873 | pass | 64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f |
| final-full-coverage | `npm run test:cov -- --reporter=json --outputFile=$RAW/final-full-coverage.json --coverage.reportsDirectory=$RAW/final-coverage` | 0 | 44.339 | 2341pass/0fail/0pending, 137files | c64b04147e4701e0a467ec1cc3dc22cb983bde5a14c9cc8e097919b6dd440eec |

Final full coverage report SHA256 0c461f80f596b4e1315e0e3d2abee90f4c87ec7883031383e6ef8b7b4b1247b5.
Unchanged configured80% engine thresholds; observed63files: s8105/8585, f296/315, b1893/2106.
Full coverage runs the complete2341-test/137-file unit suite,0skips/failures.
Final coverage includes the frozen48focused cases, all passing; the prior
focused/engine/related runs used the same runtime with only lint typing later
changed. Timing budgets remain exceeded (engine6.845>3s, related30.053>5s,
full44.339>15s); checks ran with concurrent independent validation, not a serial
performance benchmark. No budget/threshold was weakened.

Build succeeds with existing Browserslist-age, >500KB chunk and2.57MB optional
manifest-precache warnings. Purity51passes. No native browser evidence belongs
to A: cancellable draft controls, earned allocation/save/reopen and Den remain
unaccepted. No migrations or save schema changes.

Producer and QA independently verified all final hashes/counts/command rows,
approved the final source/evidence, and released retention. Exact A RAW/dist/.vite
were removed and absence verified after all consumers finished. B plan/runner
remain at /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-stat-draft-t93wb8_t
for the next slice; root owns their eventual removal. Original checkout clean;
root worktree claim continues. No push/PR/merge.

## B intake — Missing cancellable native allocation

A runtime810900f and ledger40c535e are accepted. CharacterScreen still exposes
no allocation control, despite progression-curve§11's cancellable +/- Apply
requirement. B delivers that missing path in separately reviewed bounded slices:
atomic bulk mutation/lifecycle fence, localized UI, then earned browser evidence.
No existing point-loop can promise one publication or whole-draft refusal;
the B1 diagnostic preserves that source limitation explicitly. No claim that a
new, absent bulk API already has a lifecycle bug. B's detailed controlling
contract is appended to the linked decision; same stat/equipment/resource rules
as A. Runtime, economy, combat and save schema remain unchanged during intake.
Security check: pass, same local character-state scope without external access.


## B1 atomic draft boundary — implementation and evidence

Input6f0fa0b; independent producer/QA revised plan and frozen RED APPROVE before
runtime. New bulk allocateStatPoints validates exact player reference, four own
nonnegative safe-integer fields/safe total, zero/budget/positive-attribute cap in
fixed precedence. No refusal mutation/publication; successful mixed draft copies
base/pool and canonically composes authoritative equipment once, one full player
publication, current resources preserved/clamped. Existing one-point action and
formulas unchanged. Synchronous applyStatDraft first fences hydration and pending
real import/delete; persistence is imported only by feature controller.
Security check: pass, local character state only, no external access/schema change.

The initial store discovery had2cases (1missing feature failure/1passing loop
partial-spend diagnostic); expanded28 had27missing feature failures/1diagnostic.
Final store78 had29missing API failures/49controls. Independent review found live
ref checks could miss in-place mutation; strengthened pre-call player/inventory/
basis data snapshots and old-basis success assertion, retaining all old oracles.
Revised immutable RED78=29failed/49passed/0pending, runtime unchanged.
Original store freeze SHAa060f206e28328a0e92c2f5b94940a319b2e59483dbc033176ff6c5411b2eee2
and original report49f6f23c477395b0e80b34cd52a363212535a64ce98cdda3be22ce0952b80e9e retained through review.

Initial lifecycle attempt was a missing-module beforeAll suite error: actual
assertion statuses were3pending (misleading reporter top-level said3passed).
It is feature-absence smoke only, not a preexisting lifecycle defect or useful
behavior RED. Revised14cases each explicitly fail new-controller absence,0pending:
3hydration states,6bulk refusals,1full mixed synchronous success,4real pending
import/delete×IO success/failure. Only Dexie IO controlled; immediate rejection
handlers/finally awaits prevent unhandled failures or queued restore leaks.
Literal L1 Vit11/Energy36 gives lifeMax122/manaMax104, current120/102 preserved.

Frozen revised store SHA25636d96879acc8a615ae7534c40645db405114cf9ee433bbdcf0f9e6e37a57cf3e;
lifecycle cfc2a923d015e0423c457242447a6aefcd6c944a4335a9552a93af6acfa859be.
Reports store1beb1b30e55f1ee5ac2d82c07edc045965d215a147ce3efa3bfc65e26246b9ce;
lifecycle0e2de02d7bdf7e860d8772a7480276b82eedd6404b4b15804692a25e2b39afbc.
Both independent reviewers approved before source. Tests remain byte-identical.

Initial full lint rejected !deltas as statically unnecessary for public CoreStats.
Use explicit unknown input binding and runtime null/typeof check; same malformed
input refusal semantics, no suppression or assertion change. Producer/QA reviewed.
Final playerStore SHA25603be194da5b2a0680458cce2a786209eddae906ce4a4c5e1ce2276408542c293;
controller62e513b621b2b0d33ac39915ccaabb965d9c3d6615f0ed628f70e2b495a086ac.

Initial related run791passed/1failed (production measurement source/data drift)
while concurrent production build ran; no source edits during measurement. Cause
unconfirmed; transient build/config interference is only a hypothesis. Preserve
failure, run final related without concurrent build/source edits:792/59 allpass.
No harness, gameplay, threshold, fixture or production test was changed to pass.

RAW=/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-stat-draft-t93wb8_t.
Each label owns .log/.meta.json and any named JSON report, with exact argv/exit/
wall seconds. Commands below abbreviate only the exact RAW prefix as $RAW.

| Label | Command | Exit | Seconds | Log SHA256 |
| --- | --- | --- | --- | --- |
| store-red-initial | `npx vitest run src/stores/stat-draft.test.ts --reporter=json --outputFile=$RAW/store-red-initial.json` | 1 | 3.103 | d1f31f51e1ca95beffa8ab87b2bf2bf3a1767dbc54219092c601a5fd6d9a1e84 |
| store-red-expanded | `npx vitest run src/stores/stat-draft.test.ts --reporter=json --outputFile=$RAW/store-red-expanded.json` | 1 | 3.01 | 1ba46ef5366a9ab668649e81c047ee0b64f361f3b8f5f2e89e3850735a08488d |
| store-red-final | `npx vitest run src/stores/stat-draft.test.ts src/stores/stat-allocation.test.ts src/stores/warmth-composition.test.ts --reporter=json --outputFile=$RAW/store-red-final.json` | 1 | 4.499 | a2aae419bf306cc2eeb6ba264816bbffde8e24e380315bb1d41dd2ce5ca81eaf |
| store-red-typecheck | `npm run typecheck` | 0 | 10.145 | 53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47 |
| store-red-lint | `npx eslint src/stores/stat-draft.test.ts --max-warnings=0` | 0 | 5.194 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| store-red-immutable | `npx vitest run src/stores/stat-draft.test.ts src/stores/stat-allocation.test.ts src/stores/warmth-composition.test.ts --reporter=json --outputFile=$RAW/store-red-immutable.json` | 1 | 4.562 | 7decd9e6b102e7c539e46a8499573d00c24951ebc57c8dba0ff2d02b0ff0642b |
| lifecycle-red-initial | `npx vitest run src/features/character/applyStatDraft.test.ts --reporter=json --outputFile=$RAW/lifecycle-red-initial.json` | 1 | 4.35 | ebeeee398789d88ec9e433881b76c2d3b48883bb1bbe8c2c41eaf98b63377946 |
| lifecycle-red-expanded | `npx vitest run src/features/character/applyStatDraft.test.ts --reporter=json --outputFile=$RAW/lifecycle-red-expanded.json` | 1 | 4.544 | dcc88fba9b4917e5e87a66f8507d52dd412e4212c23b48439e9ad8a4551f24b2 |
| red-final-typecheck | `npm run typecheck` | 0 | 9.934 | 53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47 |
| red-final-lint | `npx eslint src/stores/stat-draft.test.ts src/features/character/applyStatDraft.test.ts --max-warnings=0` | 0 | 5.411 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| green-focused | `npx vitest run src/stores/stat-draft.test.ts src/features/character/applyStatDraft.test.ts src/stores/stat-allocation.test.ts src/stores/warmth-composition.test.ts --reporter=json --outputFile=$RAW/green-focused.json` | 0 | 4.573 | b2777b81f336c57dbde4f66a716e9d1152c72a748b3eea7d9cf6d622a1267b81 |
| green-typecheck | `npm run typecheck` | 0 | 9.943 | 53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47 |
| green-lint | `npm run lint` | 1 | 40.195 | 73e834c2735a9449cddb4c9ba9a9f3deb07292d0675186fdc258d051808d5fe5 |
| green-related | `npm run test:related -- src/stores/playerStore.ts src/features/character/applyStatDraft.ts --reporter=json --outputFile=$RAW/green-related.json` | 1 | 29.52 | 5eec000c374ae2f54038cc07584ab6d39e42c7f06c156cdeb511f94cf4f2d04a |
| green-full-coverage | `npm run test:cov -- --reporter=json --outputFile=$RAW/green-full-coverage.json --coverage.reportsDirectory=$RAW/coverage` | 0 | 44.727 | b9532c4ed174d0ae152f9e943752e5b598a98a7d013edf9e4a84c6fc985afd8b |
| green-bridge-build | `npm run check:test-bridge-shake` | 0 | 15.749 | e6597f5f63f7092306e34c676cc3ab401b28beeebdcd1744a291cf13fe882d05 |
| final-related | `npm run test:related -- src/stores/playerStore.ts src/features/character/applyStatDraft.ts --reporter=json --outputFile=$RAW/final-related.json` | 0 | 29.043 | b9c9681da9ca1050d2e7c85f985bc926102dd3578f860a549342576587fdc2e9 |
| final-typecheck | `npm run typecheck` | 0 | 19.407 | 53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47 |
| final-lint | `npm run lint` | 0 | 35.41 | 64ef18bd16f812a048e5d016a57900763eaa6c02c2e7a32bb2a3cbbdaed0531f |
| final-full-coverage | `npm run test:cov -- --reporter=json --outputFile=$RAW/final-full-coverage.json --coverage.reportsDirectory=$RAW/final-coverage` | 0 | 41.857 | 852ce6143da4b5ce21f8c33d963b25595bf64769bf53bdc228b3a2b5d0706840 |
| final-bridge-build | `npm run check:test-bridge-shake` | 0 | 8.936 | 8226d8444a53170db06ac9b7301ba17383e333c2ca2c4b2c05a9156be253d407 |

Final related report2fc05356b89d9a24deca907498de5f131f3f73b47b236ee7ff6780889187e7b8.
Final full coverage reportf3be46c3af408eca15ba5bea478ba32b554b2f6ab556c16f89ae4d1118bd4dc0:
2385passed/139files,0failed/skipped/pending, includes all92focused frozen/control
cases. Full coverage runs complete units, satisfying full-unit gate. Unchanged
configured80%engine gate63files:8105/8585statements,1892/2105branches,296/315functions.
FinalTSC/lint/purity51 and production bridge/build pass. Related29.043>5s and full
41.857>15s budgets exceeded; concurrent validation walltimes are not a serial
performance benchmark. Build retains Browserslist-age, >500KB chunk and optional
2.57MB manifest-precache warnings. No engine source edits require a separate
engine rerun; full coverage includes engine cases.

This accepts only B1 after final independent evidence review. UI controls, native
earned Apply/Save/reopen and Den/campaign/C0–C4/G0–G7 remain unaccepted. RAW and
task dist/.vite retained until consumers finish; root owns exact removal. The
B2 plan is prepared separately, with no B2 source edit in this increment.

Final independent producer/QA source/evidence APPROVE/ADEQUATE; all B1 consumers
released retention. Exact B1 RAW/dist/node_modules/.vite removed and absence
verified. B2 plans/runner copied byte-for-byte before cleanup to
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-stat-ui-250vnt4d;
root owns removal after B2 consumers finish. Design/producer B2 detailed plan
APPROVE, UI RED/source/browser acceptance still pending. Original checkout clean;
claimed worktree continues. No push/PR/merge.
