# BUG-497 — Resolve bulk salvage ownership in one inventory scan

Status: Fixed locally; final combined-source integration remains pending.
Severity: Medium — small batches work, but legacy oversized inventory recovery stalls for minutes.
Affected system: engine-dev; native crafting/material actions.

## Reproduction

- Commit: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, dirty source tree a464a584c4d178696b9090ba3547356dfe87572745d9f5c40eac07cd428941ae.
- Runtime: Node v24.21.0, production-path stores/engine in WSL. Browser/viewport/locale: N/A for this engine reproduction; no browser launch failure.
- RNG: ownership lookup uses no RNG. The native material request retains its identity-derived seed/hash; combat admission1555/runSeed202400308 is only surrounding context.
1. Restore the earned p15-necro-act5-control-continuation-v1.json export without replaying combat.
2. Select the actual61,253 unprotected surplus items through recoverCampaignCasterCapacity.
3. Prepare and execute actions/salvage through the normal live material service.

Expected: resolve selected ownership in O(inventory size + selection size), retain duplicate/protected/foreign rejection, exact target order/hash, scrap yield and replay.
Actual: describe maps every selected ID to ownedItem, which separately spreads and filters the complete backpack/stash. Both prepare and execution repeat this quadratic lookup. The journal remains at caster-capacity-selection for at least111s; the whole native survival wrapper takes200.622s.
Workaround: select smaller batches; this is not the proposed fix.

## Evidence

Root-owned packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1.
- bug497-old-runtime-observation-v1.json records the live observation and limits.
- p15-necro-act5-survival-continuation-v1.raw.jsonl.gz and -exit.json retain native selection, outcome and terminal process proof.
- bug497-before-material-actions.ts and bug497-before-material-actions.test.ts preserve exact source preimages.

## Planned fix and validation

Index backpack/stash ownership once for salvage, marking every repeated ID ambiguous. Resolve targets in the existing normalized selection order and run existing target validation unchanged. Do not cache authority across requests or change single-target crafting.

Use a small deterministic bulk-read budget regression, exact material/custody/replay assertions and selected duplicate/stale ownership cases. Then run only material-action planner/transaction tests, scoped types/lint and one read-only projection of the captured61,253-item request. No campaign/training replay or full suite in this development loop.

Security check: pass. Scope is local bulk-target lookup. Preserve duplicate/equipped/reserved/foreign rejection and request preimages; no permission, dependency, network, RNG, save-format or policy changes. The current earned native attempt is already terminal before source edits.

## Result

Salvage now builds one request-local ownership index over backpack/stash, keeping repeated IDs ambiguous. Single-target recipes and target validation are unchanged. The bounded lookup regression failed before the fix; 122 planner tests and 26 store/transaction tests pass, as do final scoped types/lint. No unchanged suite was repeated for the benchmark fixture correction.

The read-only captured61,253-item projection passes exact native request hash, ordinal, selected order, scrap198,982, retained holder contents, input immutability and receipt replay. Prepare1.892s, plan2.969s, total4.861s; this is planner-only timing and is not an exact comparison with the old whole native200.622s attempt. The original v1 fixture erroneously counted46 protected IDs as backpack contents; v2 correctly checks36 retained backpack items. Both failure and correction remain retained.

Current production source hash: cd61069b57eefdf5141b6b1c029386fc14854f5bb9f72159dca6d387c1cd0beb. Data hash remains3c2fc97c7f345e868469c83d41a0d59c1db55dbfd112d3474398ed73347dd29c.

Exact additional evidence leaves in the packet: bug497-captured-salvage-v2.ts, .mjs, .json, .log, -exit.json; bug497-scoped-tsconfig-v2.json; bug497-benchmark-types-v2.log and -exit.json; existing bug497-salvage-green-v1, bug497-material-store-green-v1, bug497-scoped-types-v2 and bug497-scoped-lint-v2 logs/receipts. Root retains them and source preimages through umbrella QA and owns eventual disposal. Benchmark cache absent; terminal receipts confirm no owned descendants alive.
