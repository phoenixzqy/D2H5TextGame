# BUG-521 — Include earned party progression in whole-area forecasts

- Severity: Low; external campaign forecasting only, no observed production defect.
- Status: Locally fixed and verified in external forecast v11; no production code change.
- Owner: root, campaign verification.
- Environment: Node24.21.0/Vite SSR in WSL; HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained local implementation; no browser/viewport involved.

## Reproduction

1. Forecast Bone's exact level13/next111 ActII source with external v10, selected `bone-owned-stash-armored-prayer-curse-torch`.
2. Apply the same preparation once through the native qualified continuation111.
3. W1/W2 match exactly; W3 native mana237/time10611.72887329619 differs from forecast238/10664.233109650937. The assertion stops after retaining all three wins and income.

Run seed1674525328; W3 seed3110688643. Native journal shows Prayer reaches level13 after W2; forecast keeps level12. Native W3 attack99/speed127/defense153/lifeMax260 versus forecast96/126/150/246. Hero and earlier-wave inputs match exactly.

## Expected and actual

Whole-area forecasts must include ordinary XP settlement and resulting party-stat changes. Current v10 carries combat pools/status/cooldowns but omits earned hero/merc progression. A passing frozen-stat projection cannot assert exact native multiwave agreement.

## Correction and evidence

Use existing native admission/playback/settlement services in restored diagnostic stores for each finite candidate; retain projected rewards separately and restore afterward. Never promote diagnostic income to earned progress. No game formula or live settlement change.

Retain source, failed forecast/native reports, exact executed driver, journal and exit receipt under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`. Authoritative successor is `p15-bone-act2-qualified-continuation-v1.json`: level13/XP20598/next112, 9470XP/36items, eleven paid insertions and one free skill reset retained. Seven old quest actions preserved, no new action. Resume112 without repeating preparation or old actions.

## Validation

External v11 uses ordinary native playback and settlement in restored diagnostic stores. Scoped strict types and explicit-file lint pass. The original lint-only callback failure and executed bytes remain retained; adding a block body fixes it without changing behavior or types.

The corrected next112 forecast wins all five waves. Actual native112 matches every HP/MP/time result exactly, including Radament at41292ms with356HP/241MP. It preserves all previous paid preparation and starts no old quest action. A subsequent113 Arcane W1 defeat remains retained; no completed area is replayed. Independent new-only readback passes30840XP/61added/142native-salvaged items/zero new sockets/reset, exact economy/custody/merc growth/quest lineage/clock/seeds/export. The failed111 report separately passes independent readback for9470XP/36items/eleven insertions/one skill reset and its precise level-growth divergence. Current authoritative source is `p15-bone-act2-earned-party-continuation-v1.json`, level13/XP51438/next114.

This verifies the diagnosed party-growth boundary with native inputs and actual results. No game formula, engine, earlier-act suite, completed campaign or broad test is changed/replayed.
