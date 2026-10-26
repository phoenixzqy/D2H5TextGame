# BUG-273 — Preserve Command-boosted Mage preparation and elemental identity

- Severity: High — a legitimate paid party buff removes the advertised Mage
  attack types, and prevents a mastered Mage skill from preparing any bodies.
- Status: Fixed locally in `49dea62a`; independent/full-skill acceptance open.
- Owner: root, engine/QA responsibility; no delegation or independent approval.
- Environment: Linux, Node v24.21.0, pure TypeScript engine under Vitest; browser,
  viewport and locale do not apply. Synthetic fixtures, not earned campaign.
- Baseline: `4b1b22cc2d1cb8dd5a213c0f2ba7e975d8cf1783`.
- Seeds: 7 for actual Command payment; 19 for the next wave.

## Reproduction

1. Run a real registered Battle Command from a living rank1 commander with
   exactly11MP and a living hero recipient. End the wave before expiry using a
   deterministic test finisher; retain the actual opaque engine carry.
2. Start the next wave with the same recipient identity,22MP and learned
   Skeletal Mage rank1,6 or20. The commander need not remain present.
3. Assert actual paid Mage bodies, damage types, enemy HP, replay equality and
   caller immutability. No imported marker supplies Command authority.

Expected: effective ranks2/7/21 retain elemental F/C/L/P cycling, effective body
stats and whole-batch22MP payment. Command's contract permits potency beyond the
allocation cap; the authored count curve therefore yields2/4/9 Mages. Paid body
potency and identity persist after the Command grant expires.

Actual: rank1 and6 bodies exist with boosted stats but attack physically;
rank20 creates zero bodies. All three regression cases fail after the actual
Command payment and carry authority assertions pass.

## Cause and evidence

`prepareSummons` compares effective count against the count derived for the
maximum learned rank. Effective21's nine bodies are refused as though learned
rank21 had been allocated. The later elemental provenance check requires raw
learned rank to equal effective rank, rejecting every legitimate +1 payment.

The controlling `D06-battle-command-v1.md` rules5 and7 explicitly separate
allocation authority from uncapped paid potency. Preserve malformed/over-cap
allocation refusals and existing preparation semantics; do not clamp effective
potency to make the case easier to pass.

Original evidence is root-owned under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-mage-command-lq57fr2h`:
`red-test.ts`, `red.log`, `red.json` (exit1, three failures,3.891s).
The initial rank20 assertion expected eight rather than nine bodies; that oracle
is corrected from the controlling Command/count contracts before production
changes. Zero actual bodies proves refusal under either expectation. Preserve
the original failed source/log and the corrected RED separately.

Workaround: omit Command carry, which forfeits the intended party benefit.
Regression: `src/engine/combat/skeletal-mage-command.test.ts`.
No skill inventory credit, full Mage signature acceptance, balance approval,
genuine campaign action, save migration or remote publication follows this fix.

## Local implementation checks

The correction validates learned capacity against the catalog allocation limit,
then stages the actual effective count. Elemental assignment compares the raw
integral allocation with the effective rank minus the authenticated paid bonus.
Corrected RED is3failed/3cases, exit1/3.757s; the initial18-case family suite and
existing preparation/Mage/Druid/Fire tests finally pass399/6files in8.878s.
Three additional native-composer cases pass34.015s. These use two synthetic native
heroes to exercise party carry; they are not an ordinary single-protagonist UI
campaign reproduction. Strict types pass148.413s; build/bridge/precache pass.
Full units and full lint remain running at this checkpoint, so no broad pass or
final closure is claimed here. Source hashes are frozen in the command receipts.

## Final bounded verification

Commit `49dea62a` contains the runtime repair and both regression files.
Full units pass18401tests/848files with two existing opt-in skips,997.951s.
Production SHA256 stays `142f847dfefb77ef4ecffa55feb73f02109cc2b165ab2fc4d699c73be3aa0acf`.
Two new test files lost only redundant narrowed-discriminant checks during the
full run; hence its receipt says inputsUnchanged:false. Their preserved exact
diff and final21/2file pass13.402s establish the final test versions separately.
Final strict types156.877s and full lint259.384s pass; build/bridge18.591s and
756URLprecache0.251s pass. No full Mage signature, earned or independent acceptance
is implied. Task evidence remains active through Iron/Hydra/browser consumers;
root owns final retention and cleanup.


## Superseding terminal closeout

The [unified final evidence](../../docs/plans/evidence/d06-command-summon-capture.md)
records the later unchanged-input full pass of 18,414 tests / 849 files (two
existing opt-in skips), plus eight separately checked native Iron cases. Its
canonical earlier-build 18-case browser matrix and latest-build four startup
cases remain distinct. Original failures and observer corrections are retained.
The task-directory references above are historical: the directory and task-owned
`dist/` were archived, read-back verified and removed. Root retains only the
three exact archive/sidecar paths listed in that report through BUG273–276 and
full-v1 evidence consumers, then owns their removal. Independent acceptance,
earned balance, Mage signature effects and full private v1 remain open.
