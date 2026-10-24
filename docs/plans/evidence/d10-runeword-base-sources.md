# D10 — Reachable normal runeword bases

2026-10-24; local source `18db5d3`. Root implementation/source/artifact review;
independent design, balance and integration acceptance remain pending. Resolves
the catalog/acquisition defects BUG162/163 locally, without accepting earned
crafting, Diablo/C2, C3/C4 or full G0–G7.

The genuine pre-fix regression found seven unavailable words: Obedience had
no compatible base; Insight, Infinity, Heart of the Oak, Breath of the Dying,
Beast and Last Wish lacked a compatible reachable normal-item source. Add one
level41, five-socket Battle Scythe and its normal Act IV pick, plus one normal
Act V pick for the existing level62 Thunder Maul. The
[specification](../decisions/D10-runeword-base-sources-v1.md) freezes exact
stats, weights and level bands. All75 previous bases, all35 recipes and every
previous treasure-class entry/weight/metadata are deeply unchanged. No runtime
algorithm, matcher exception, schema/save field or migration is added.

The [native catalog/acquisition audit](fixtures/runeword-base-sources380/catalog-and-acquisition-audit.json)
uses the actual matcher/capacity ceilings and377 real campaign plans across29
areas to retain a reachable normal-source witness for every shipped word.
Four diagnostic boundary samples of4096 seeds each exercise actual native
drop/materialization. Scythe levels41/81 produce101/98 acquisitions with all
capacities0–5; Maul levels62/102 each produce112 with all capacities0–6. Both
new picks are refused immediately outside their own authored level bands.
Their added eligible selection shares are6.42–6.98% and6.27%; prior pick
probabilities correspondingly decrease. These are diagnostic source samples,
not earned acquisition, affordability, drop/hour or pacing acceptance.

The [browser audit](fixtures/runeword-base-sources380/browser-audit.json)
checks four ordinary production-UI tests: en/zh-CN at360×640 and1280×800,
zero retries or browser errors/warnings. Constructed native saves contain an
actual diagnostic seed299 drop, never an earned campaign item. Five ordered
inserts spend exactly Hel→Ko→Thul→Eth→Fal, create Obedience only on the last
insert and increment the material ordinal exactly five times despite double
confirmation clicks. Level40 equip is inert; level41 succeeds. Derived attack
437 versus115 after removal, exact resistances and Life13/Mana17 are checked.
Save-close-Continue preserves all participating domains. Sixteen native
exports and four constructed inputs remain distinguishable in the evidence.
Both mobile screenshots were visually inspected; preview controls remain
legible,44px targets and no horizontal overflow are asserted in all four cases.

## Validation and original failures

- New catalog and Obedience regressions genuinely fail before the data fix.
  Focused final run:105 tests/6 files PASS,6.78s.
- First full unit:11666 pass/8 fail/2 existing skips,453 files,486.81s,exit1.
  All eight failures are the stale75-base count. Only that count changes to76;
  the real per-base level99–102 magic/rare affix assertions remain intact.
- Final `npm test`:11674 pass/2 existing skips,453 files,457.15s,exit0.
  `npm run test:engine`:5748 pass/177 files,74.02s,exit0.
  Final `npm run typecheck` and `npm run lint`:exit0. Node24.21.0/npm11.19.0.
- Ordinary `npm run build -- --outDir <task-root>/dist --emptyOutDir`:exit0,
  VITE_E2E unset.
  Seven built JS files are bridge-free. All760 build hashes match before
  cleanup. Existing bundle/PWA/Browserslist warnings and test-time budgets
  remain unresolved; no corresponding gate is accepted.
- Final browser command uses `CRAFTING_UI_ROOT=<task-root> PWA_PORT=4440
  npx playwright test --config tests/pwa/crafting.config.ts runeword-bases.spec.ts`:
  4/4 PASS,66.34s,exit0. The archive retains original import-loader failure,
  mobile navigation failure, wrong expected Chinese copy and the explicitly
  stopped second attempt. Corrections use Vite SSR for JSON modules, close the
  normal item dialog before navigation and expect existing authored `服从`.
  SSR websocket support is explicitly disabled; no source-rule bypass follows.
  The initial lint non-null assertion failure and stale focused expectations
  are also retained with their corrected runs.

The [final summary](fixtures/runeword-base-sources380/final-summary.json)
records terminal command handles and cleanup. Its911file final manifest differs
from the built-source manifest only in that engine test count; runtime source
is identical through the final full test. The
[archive manifest](fixtures/runeword-base-sources380/manifest.json) verifies65
files, including every original failed report, audits, logs and native browser
attachments. Archive1164655bytes has SHA256
`10aee2c854791c4907c1780f0453e4fc5db63747b3b5b2a1ab2fdc7e3ade816c`.
All task processes are terminal; preview4440 is closed. Exact owned build and
two caches are removed and absence verified, cleanup remaining[]/failures[].
Root retains required raw evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/obedience-base380`
through campaign/full-v1 consumers, then removes that exact directory.

The [genuine save through379](d11-earned-tyrael-and-river-through379.md) remains
unchanged at level31/nextNormal380, decompressed SHA256
`b0972bad81133bba925939ed6c412307e2338df2e65795a2f6b48fa70735a64f`.
No earned action, rune spending, equipment swap or Diablo attempt occurs.
This source availability fix does not make a level41 base equippable by that
hero. Work is local only; umbrella goal/worktree remain active.
