# BUG-507 — Keep Izual's ordinary escorts out of boss tier

Status: fixed locally, uncommitted; earned full-area acceptance open. Severity: High for campaign progression.
Owner: content-designer / engine-dev; root executes locally.
Environment: WSL, Node24; feat/playable-foundations, base b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
Browser/viewport/locale: not applicable to deterministic native engine evidence.
Data before SHA256: 4c026bec9653c6227caa28f81ad44d9974f791aed3af8c1b48f0ba518fcc565d.
Run seed: 1572961358; wave seed: 1255414843; ordinal880/index4.

Reproduction:
1. Resume earned Double Throw35/next881/35actions from the source below. Its
   preceding native Plains880 final wave is preserved in the journal.
2. Resolve act4-pod-izual. Izual has boss:true; the two Oblivion Knight escorts
   omit boss, so encountersToSpawns falls back to the boss wave tier.
3. Observe three bosses: Izual43931HP and escorts7378/5930HP at level49,
   with479Attack each. The actual hero enters472.89HP/30MP, reaches zero mana,
   dies at60s and leaves Izual31559HP.

Expected: one named Izual boss and two ordinary Oblivion Knight escorts,
consistent with explicit boss:false companions and the BUG506 data contract.
Actual: both ordinary escorts inherit boss HP/Attack/Defense/crit multipliers.
Root cause: one missing supported boss:false flag on the count2 escort row in
src/data/maps/sub-areas/act4.json. Preserve boss:true, encounter count/levels,
ordinary waves and loot. Do not change shared fallback or boss formulas.
Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-barbarian-double-throw-arcane-continuation-v2.json; its exact .raw.jsonl.gz; p15-barbarian-arcane-frontier-damage-v1.json.
Fixed-seed fixture: src/engine/combat/fixtures/act4-izual-guard-tier.json.
Regression: src/engine/combat/act4-izual-guards.test.ts.
Workaround: additional preparation can mask the inflated escort budget; it is
not proof of correct encounter roles. This correction alone may not resolve
Izual's observed survival/mana/throughput deficit; full-area acceptance is open.

Security check: pass
Scope: local bug intake, one ordinary-role JSON flag and focused local regression.
Summary: no credentials, external data, CI, permissions or agent-control changes.
Findings: none.
Recommended next step: apply the supported data annotation and affected checks;
keep existing saves/rewards/history and run no agents, installs or publication.

Fix: add boss:false to the count2 Oblivion Knight escort row. Exact full Act IV
JSON readback equals the retained before-data with this single flag added.
Validation: the4focused cases initially fail3 role assertions; corrected4/4pass.
Existing schema validates every Act IV area, manual/idle plans have exactly one
Izual boss and two ordinary escorts, the original native880 enemies reconstruct
exactly, Izual's full unit is unchanged and escort HP/Attack/Defense decrease.
Scoped strict types and exact-file lint pass. No Act I–III, BUG505/506, broad
unit, campaign replay, browser/build or CI verification was repeated.

Artifacts: bug507-act4-red-v1.json / bug507-act4-green-v1.json, bug507-types-v1 /
bug507-lint-v1 process receipts; bug507-act4-data-before.json and
bug507-artifacts-v1.json in the root packet. No commit or publication; base SHA
above identifies the checkout and artifact hashes bind the exact local fix.
Double Throw35/next881/35actions remains the earned successor. The recorded
Izual nonwin predates this correction; current-data full-area acceptance and
its independent mana/physical/throughput assessment remain open. No scripted
victory or reward grant is inferred from the role regression.
