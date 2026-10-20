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
