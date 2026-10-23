# Horadric Staff: recover, assemble, claim and insert

2026-10-23, integrated data/save commit `6b23f8e`; runtime identified by the
retained 806-file source manifest. [Accepted contract](../decisions/D11-staff-assembly-v1.md).
This completes the Staff item path, not Act II or C2. C0/C1 retain their
historical acceptance; C3/C4 and full G0–G7 remain open. Local only.

Explicit Map Recover obtains Staff of Kings at Far Oasis and the Viper Amulet
at Lost City in the Staff quest's authored order. Inventory Assemble requires
the actual owned Cube and both parts, retains the Cube, consumes both parts,
creates the Staff and completes the ordinary Staff quest. Separate Claim pays
the existing 6000 hero XP / 4500 fielded-merc XP once. Explicit Insert at the
canonical Tal Rasha orifice consumes the Staff and sets only Seven Tombs' opening
objective. It grants no kill, clear, reward or access change. Tainted Sun's
independent localized altar action does not acquire the amulet.

Save v14 validates the frozen v13 Book/Cube domain before a copy-only migration.
Component/output definitions and receipts form a reciprocal graph: output needs
owned Cube and consumed parts; consumed Staff additionally needs its own valid
Seven Tombs opening flag. Missing legacy receipts remain legal; import infers
nothing. Explicit recovery/assembly/insertion can repair internally complete,
completed/claimed rows while preserving their flags, status, claim and rewards.
Books retain their existing behavior. Shared guards, synchronous lock,
prospective validation and participating-domain rollback cover the item actions;
failed restoration is explicit. No crash or observer-wide atomicity is claimed.

## Validation

- Full unit: **9011 tests / 299 files PASS**, exit0,221.96s.
- Engine: **4331 / 111 PASS**, exit0,59.20s.
- Focused data/save: **571 / 8 PASS**; combined service/UI/Book/Claim/Cube:
  **143 / 6 PASS**, including20 Staff service and2 Staff UI cases.
- Final typecheck, lint, clean production build and4-chunk debug-bridge scan PASS.
- Production browser: **2/2 PASS**, en/zh-CN,119.570s, retry0, no skips,
  unexpected/flaky results or page errors. Final806 source /760 build /2 harness
  /1 input hashes match the frozen manifest, drift[]. Preview port34463 closed.

Causal evidence: data/save23fail+66controls before implementation; service16fail
before the new action APIs/behavior; UI2fail before controls. Frozen v13 and
legacy repair cases are included. One lint error was corrected by removing a
redundant optional chain after the same conjunction already proves the entry
exists. That equivalent narrowing is the only runtime change after the full
unit run; final types/lint/build/browser cover it. The initial failed lint log
remains retained.

An initial browser attempt was interrupted when the manifest assertion caught
an obsolete JS chunk retained by a second build to an external outDir. The shell
had launched the browser despite that failed assertion. Its exact owned runner
was stopped; logs/report and interruption receipt remain retained. The accepted
run follows a clean `--emptyOutDir` build, successful scan and sequential freeze.
No gameplay assertion failure, retry or weakened assertion is hidden by this
staging correction. Full unit/engine exceed the documented loop budgets; the
existing bundle-size/art-manifest precache warnings remain outside this slice.

## Production player proof

Input is the exact committed earned Cube fixture,
`c83afd7ebc8f2f4dc67009baf68263250e3208c6c842e64de9188cff38d4f53d`.
Import changes only version13→14. Ordinary UI starts Seven Tombs, refuses amulet
recovery before the shaft, then recovers both parts. Keyboard Assemble/Insert
and exact full-save comparisons prove the described receipt/flag deltas.
Separate Claim changes hero L12→13 (XP388,5 stat/1 skill point) and merc XP
23476→27976; all unrelated fields remain exact. This verifies the reward
transport, not an independent progression-formula audit.

Save-close-new-page Continue is exact at shaft, parts, assembled, claimed,
inserted and both legacy stages. Reimports preserve parts/output/claim/insertion
states. Duplicate disabled actions change nothing. Close restores Inspect focus.
Five viewport sizes per locale include360×640,412×915,landscape,1280×800 and
1920×1080, with44px controls and no document/main horizontal overflow.
All4057 unique earned gear identities and allocation survive every exported
stage:4042 bag/stash,8 hero equipped,7 merc equipped. ActIII stays locked in the
ordinary chain. There is no combat, new clear or production test bridge.

A separately constructed v13 completed/claimed/flag-only clone proves no import
backfill and explicit Cube→parts→assembly→insertion repair without reward or
progress changes. It is not an earned Duriel victory or fresh campaign proof.

Versioned fixtures and the exact browser script:

- `fixtures/staff-inserted.json.gz`, SHA256
  `7323e45c7ef0acafc10278e132c5897d07f7d09b25af3e8c2c0190f3b7ef06dd`.
- `fixtures/staff-legacy-repaired.json.gz`, SHA256
  `9c443e33c6a46fc7af1a589f874e10be00387f44bac7c1fb826a2dff9346d79d`.
- `fixtures/staff-acquisition.spec.ts.txt`.

Producer-H2 APPROVE/security PASS and independent QA-H2 APPROVE/security PASS
cover final source and evidence. Both independently rehashed every frozen file;
QA also compared complete raw saves, gear values/order/allocation and the exact
versioned fixture/script copies. No material findings; all readers released.

Raw logs, reports, bilingual saves/screenshots and manifests remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-staff-xmyimd7c`
through H2/C2/umbrella consumers; root removes retained evidence when they finish.
Exact task-owned dist, browser-output and attempt-1-browser-output are removed
after all consumers and processes finish. cleanup.json verifies remaining[] /
failures[] and closed preview port; artifact-inventory.json lists retained
evidence. Installed/shared caches are preserved.

Next: canonical qualified Duriel credit and explicit quest-table Claim, keeping
ordinary boss loot separate; then earned Act II continuation. Producer's next
contract fixes an authored level32/five-pick/MF0 quest-table context and requires
a recorded decision before implementation. Tainted Sun's promised permanent
resistance reward and nonexistent Canyon unlock metadata remain unfinished.
