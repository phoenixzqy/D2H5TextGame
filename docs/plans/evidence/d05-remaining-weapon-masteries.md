# D05 — Polearm, Spear and Throwing Mastery / BUG169–170

2026-10-24. Base `44477e9`; existing human worktree, root sole writer.
Implementation: `1617315` (obtainable bases/fixture reconciliation),
`12b6d6d` (mastery consumers/schema/UI). Implementation/local verification complete. Independent reviewer/QA,
earned class builds, acquisition/balance and complete acceptance remain open.
[Controlling contract](../decisions/D05-remaining-weapon-masteries-v1.md).

## Behavior and boundaries

All six Barbarian weapon masteries now share one canonical weapon-slot consumer.
Polearm/Spear: authored3%physical/+0.5ppdirect-hitcrit per rank. Throwing:
2.5%physical/+1%attack speed per rank, no critical bonus. Unlock6/cap20,
maximum valid exact alias once; wrong class/weapon/offhand/level grants nothing.
Physical increases use existing direct-damage composition without increasing
Attack or elemental damage. Throwing multiplies fresh equipment/endurance
cadence; no passive casts, cooldown/cost, ammo/range or RNG changes.

New ordinary Spear and Throwing Knife bases have current early one/two-hand
stats, en/zh names and existing art fallback. Positive-weight normal Act I trash
entries make both reachable through existing seeded drop/materialization.
Existing War Pike/polearm identities and unique templates are unchanged.
Strict schemas require exact weapon metadata and correct finite coefficient
shape, including speed rather than crit for Throwing. Both locales describe
actual effects and next-wave timing. No save-shape/migration or derived bonus
persistence. New loot entries alter future seeded outcomes; no consumed action
is replayed and no diagnostic state is promoted to the earned campaign.

## Verification

- Availability:2causal RED/1classification control before adding bases. Then40PASS
  across availability/catalog integrity; historical base/socket/metal assertions
  remain explicit, with only two new bases/two metal IDs added.
- Corrected frozen composition:10RED/1identity control, fixed seeds1–32. Initial
  fixture used incorrect runBattle/event APIs; corrected before credited run,
  original failed attempt retained. Real direct hits, critical outcomes, attack
  count and Increased Speed interaction now pass.
- Strict-schema/UI frozen run:9RED/3existing controls (3schema,6bilingual cases).
  Final initial engine/composition group24PASS/3files; bilingual details12/2.
- Native lifecycle11PASS: all six learn while unarmed; next-wave weapon changes,
  original resource carry, fixed current recording, reset/replay/no new income,
  no compounding and validated import for six equipped weapon types.
- First engine run5832PASS/8FAIL: all8failures are the stale76-base count in the
  historical Nightmare affix matrix. Corrected to prove76historical+2new=78,
  preserving all per-base legal-affix assertions. Final engine5840PASS/183files,
  135.61s, exit0.
- First typecheck exposed an optional offhand fixture; normalized to null.
  Production runtime/data are unchanged by either test correction. Final
  focused138PASS/11files,27.55s; typecheck passes. Lint also identified an
  optional fixture-slug index; explicit guard added, final types pass, full
  unit/types/standard lint pass. The earlier focused/engine run predates only this test guard.
- Explicit VITE_E2E=false production build passes; emitted JS chunks scanned
  with all five repository bridge-forbidden patterns. Existing bundle/PWA
  manifest/Browserslist warnings remain unresolved.
- Production Chromium4/4 en/zh-CN×1280×800/360×640,95.79s; zero retries, skips,
  flaky cases or captured browser errors. Ordinary skill allocation,44px
  controls, fractional current/next rows, three unique-owned equipment swaps,
  passive combo exclusion and four exact Save→close→Continue pairs pass.
  Mobile Chinese Throwing/desktop English Spear screenshots inspected.
  Constructed L30 eligibility/gear; no earned build/balance claim.

- Initial full run11848PASS/1FAIL/2existing skips,469files,602.96s: only the
  positive earned-equipment fixture no longer earns its selected boots after
  TC expansion (BUG171). Retained18bounded diagnostic clock observations;
  fixed clock1792497600017/runSeed2330410292 legally earns original glove5
  andboots3 in one farm with unchanged expected resources. Original tiny
  recipe remains unchanged; no discovery loop remains in required tests.
  Fixture30/30PASS, final full11849PASS/469files+2existing skips,491.28s/exit0.
  All ownership/resource/isolation assertions preserved, exact run seed added.
- Final typecheck and standard lint pass. A separate attempt to lint the
  normally ignored simulation file first reported its ignored-file warning;
  forcing that extra scope found three unchanged pre-existing findings at
  earned-adapter.test.ts:172,173,386. No configuration or assertion weakened.
- Code/evidence self-review: canonical identity/weapon gating, strict authored
  tuning, physical-only damage, cadence/crit outcomes, native recording/resource
  safety and bilingual display are covered. Bounded functionality is proved;
  independent review/QA and earned balance remain incomplete.

## Evidence, retention and remaining work

[Fixture directory](fixtures/barbarian-remaining-masteries/) retains complete
raw evidence in `raw-evidence.tar.gz`, per-file hashes, verification/source/build
provenance, four exact browser save pairs and two inspected screenshots. All34
raw files were archived and verified byte-for-byte before their temporary
originals and empty scratch root were removed. Historical scratch root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-remaining-masteries-i5r4g6lk`.
All task processes terminal; build/browser staging removed, port4453closed;
remainingDisposable[]/failures[]. Versioned evidence remains for full-v1 review.

Exploratory next-work evidence in the archive compares repeated skill-schema
compilation with one shared compilation, each performing720validations:
2625.93ms versus81.98ms on the current host while tests ran. It establishes a
candidate for investigation, not application/device performance acceptance.

The authoritative earned Rite resume must retain decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`,
L33/nextNormal402. Constructed browser levels/gear and native test finisher
establish functionality only. Earned Barbarian builds/acquisition rates/balance,
independent review/QA, remaining advertised skills, pacing/economy/endgame,
C2–C4/G0–G7 remain open. No push, PR, merge or deployment.
