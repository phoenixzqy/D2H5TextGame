# BUG-254 — Apply paid Confuse and Attract to real enemy target selection

- Status: native numerical RED reproduced; strict JSON definition foundation `9bc03a22` verified. Paid status and attack redirection are not implemented; no skill credit.
- Severity: High — two advertised targeting curses spend resources without their advertised behavior.
- Owner: root engine/content/frontend; independent design/review/QA remain open.
- Build:7b27fb0463cd8d6b9bfdbcaf03e1fd370c3c7b9f;Node24.21.0/Linux; native projection/engine reproduction, independent of browser/locale/viewport.
- Seed:1;actual native Necromancer ownership,learned prerequisites,selected Confuse/Attract ranks1/20. Fixed imported HP/MP/cadence is unearned isolation scaffolding.

## Reproduction

1. Run the retained task-only native-red-v2 command/fixture described below.
2. Project a level30 native Necromancer with real prerequisite allocations and only the chosen curse in comboOrder through playerToCombatUnit.
3. Let its actual curse pay at400ms, then hold further hero actions. Two living ordinary monsters each make nine100-damage Physical attacks at500ms intervals through4500ms.
4. Compare each rank/skill to its otherwise identical uncast/held-hero control.

Expected:Confuse makes enemies attack one another;Attract makes other enemies attack the selected cursed enemy. Actual targets and HP must change,not merely the marker/log.

Actual:all four paid cases remove1600heroHP,identical to uncast controls,with zero monster-on-monster damage events and0friendlyHP removed. Confuse applies to both monsters and Attract to one at400ms;actual payment,application counts/times,cadence,input immutability and repeated recorded/plain determinism pass. Four positive cases fail;unavailable ownership and poor-MP controls pass. No workaround grants the mechanic.

## Evidence and cause

Task root:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-target-curses-6i4lfede;root owns it through BUG254 implementation/evidence consumers and removes exact disposable paths only after retained read-back verification and all consumers finish.

Command:python3 -u <task-root>/run.py native-red-v2 npx vitest run --workspace <task-root>/repro.workspace.ts

Result:4failed/2passed,exit1,9.127s command;native-red-v2.logSHA256ba48e930d30624d8458ffdef7860c649419e8eaf287d26d8200ccd438a12418b. The first external-test filesystem setup attempt ran0tests and is separately retained/uncredited. Task-only exact fs.allow corrected the harness;production/repository configs were unchanged.

The catalog emits ordinary confuse/attract markers,but no combat target-selection consumer reads either. Cleansing/localized chips alone are not targeting implementations. Generic opponentsOf uses effective allegiance,which must remain separate from intentional friendly-fire attack selection;changing allegiance would also corrupt support/hostility/reward boundaries. Twelve original source copies,failed fixture/receipts and numerical summary are retained before any production edit.

## Next acceptance

Implement a finite JSON-owned paid targeting contract with actual hostile same-side hits,exact onset/expiry/refresh,Cleansing,Attract/Confuse/Taunt precedence,singleton/death/converted/player/self safety,ordinary damage/death/reward semantics,bilingual current-next/MAX,native allocation/wave/import and production online/offline public proof. Preserve original cost/rank/prerequisite authority. Root author adaptation remains provisional;independent and earned balance acceptance remain open. Full privatev1 and remaining skill work are unchanged.

## Definition foundation — still incomplete

`9bc03a22` changes exactly four source paths:strict canonical schema,both JSON duration leaves,and immutable definition/helper tests. Existing class/unlock/prerequisites/cost/cooldown/scaling authority remains literal.49new definition cases/81focused across3files PASS3.129s;engine9035/338PASS150.233s,typecheckPASS122.374s,explicit lintPASS11.230s. Missing-module definition discovery RED is retained separately from the genuine numerical RED.

The post-foundation native reproduction still has4failed/2passed8.620s,identical1600heroHP loss andzero friendly fire in all four positive cases;logSHA256`9602f57493f64afcfb7f6b2919332a5463b8598b16919b543345009c52876a35`. This is expected incomplete behavior,not a green mechanic or skill credit. All eight command starts have matching terminal/hash receipts. Four committed foundation source copies and the correct162-row-credit CSV baseline remain in the active task root;the earlier pre-DimVision161 baseline is preserved separately.

Paid transient status capture/finite consumer,shared offensive targeting,bilingual current-next/MAX,native lifecycle/public online/offline proof and final combined validation/retention/cleanup remain next. The latest completed full17,874test/browser4case evidence belongs to Dim Vision's combined head,not this new foundation. Root retains the active raw task evidence through BUG254 consumers and owns eventual exact cleanup.
