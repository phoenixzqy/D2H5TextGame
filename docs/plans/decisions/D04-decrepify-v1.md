# D04 — Decrepify finite speed and damage curse

Prepared2026-10-26. Provisional root author contract; independent design/QA and earned balance remain open. BUG244 retains the actual native reproduction. Local implementation and bounded checks pass: full17283/783/two existing skips, engine8553/320, types/lint/build/precache/bridge and four final production-browser cases. [Evidence and limits](../evidence/d04-decrepify.md). This does not accept earned builds, independent review or privatev1.

## Overview

Make the actual learned paid Necromancer Decrepify implement its two advertised effects through native allocation, authored effect data, deterministic combat and truthful bilingual presentation. This does not accept other curses, earned builds or privatev1.

## Player fantasy

A finite all-hostile curse gives the Necromancer and party a measured survival window. Rank allocation changes existing affordability; the curse neither deals a hit nor grants hidden offensive resistance reduction.

## Detailed rules

Existing skill JSON preserves unlock24, prerequisiteTerror and transitive requirements, ranks1–20,20MP with-0.3/rank (rounded actual rank20cost14), CD3s, all-enemy scope. Author the advertised attack-speed reduction50% and outgoing direct-damage reduction33% in JSON statusEffect. Provisional duration3000ms at every rank is an explicit author decision, matching the existing Amplify finite curse window; no source establishes a prior exact Decrepify duration. The accidental unknown-status1000ms fallback is not a design authority.

One eligible paid action applies one complete finite copied payload to every living hostile, without damage/hit/proc RNG. Preserve ordinary no-target/MP/CD native guards. Curse is active on[start,expiry), all monster tiers share potency/duration, Cleansing shortens eligible finite curses once under existing semantics. Bare or malformed markers grant neither effect; actual statuses are transient and never saved.

Reduce the affected unit's effective AttackSpeed stat by50% after existing speed increases/enrage and alongside existing multiplicative Chill, before floor/cadence clamps. Keep base stats unchanged. Existing actionPeriodMs=clamp(2500-floor(speed)*8,400,2000) means50% less AttackSpeed is not50% fewer actions. Preserve pending action phase at onset/expiry; no skipped progress, restart or catch-up action. Unchanged refresh cannot perturb cadence.

Multiply outgoing ordinary direct damage by0.67 before resistance/flat mitigation, sharing the existing outgoingDamageMultiplier stage. Combine multiplicatively with BattleCry and preserve identical no-curse arithmetic/RNG. Derived hit-dependent DoT rates naturally snapshot the changed actual hit; already active DoT rates/integrals, heals and independent reflection rules do not get a second reduction. No -physical-resistance feature is added to this skill.

Refresh replaces this curse's copied potency/source/start with one finite paid interval and never stacks. Source death does not erase an already paid curse. Generic status expiry/rebasing, cleansing, observed chips and save/import cleanup remain authoritative. Do not persist combat packets or change save22.

## Formulas

For active reduction s=50 and d=33:
AS_effective=existingEffectiveAS*(1-s/100), then existing floor/clamps.
Damage=existingRawDirect*(1-d/100)*(1-BattleCryReduction/100), then existing mitigation once.
Native MP=round(20-0.3*(rank-1)); CD3s unchanged. A100raw hit with no mitigation becomes67. With50% resistance/Defense10 it becomes floor(67*.5-10)=23, proving pre-mitigation placement.

## Edge cases

Real ranks1/20, underlevel/class/prerequisite/illegal ranks, no MP/CD/no live target, bosses, all live targets/dead exclusion, zero/future/expired/forged marker payloads, exact/fractional onset/expiry, rank allocation/current recording/native next wave/import, phase/clamps/refresh, input purity/deterministic recorded/unrecorded replay, negative non-direct/healing controls, BattleCry/Chill/enrage/Cleansing coexistence and unchanged baseline recordings. Require actual HP/time/MP assertions, not presence-only status tests.

## Dependencies

Strict JSON schema/type -> authored row -> complete dataCatalog debuff -> paid status -> shared active reader -> existing scheduler/damage consumers -> pure rank preview/i18n -> public native/browser/save/offline acceptance. Avoid a general curse framework for one diagnosed skill; retain interfaces of unrelated skills.

## Tuning knobs

JSON duration and percentages own all new numeric tuning, with finite positive duration and reductions within[0,100). Source/rank/cost/CD remain unchanged; changing these later needs a recorded balance reason. Pure definition must copy/freeze complete validated scalar defaults without importing the registry. No new dependency, RNG, permission or external action.

## Acceptance

First install/run the prepared actual-native causal tests after prior task completes, retain real RED and file nextfreeBUG before production edits. Seed1,casterAS263 casts400, targetAS250 starts500msperiod and after50%slow uses1500msperiod. A3000ms curse gives target actions700,2200,3500,4000,4500 with phase preserved; first two landed hits67, third miss, last two100, total334HP. Uncursed target acts500ms increments through4500. The schedule uses the real formula rather than assumed proportional action delays.

Add strict definition/schema, complete paid status lifecycle and consumer/negative controls, native wave/import and truthful unlearned/current/next/MAX bilingual previews. Production en/zh desktop/mobile must show actual curse and changed public combat outcomes, Save/ordinary+SWofflineContinue. Run focused, engine, full, types, lint, actual data validator or existing actual-loader/schema tests if the catalog's validate:data script is absent, build/precache/bridge. Freeze tested bytes before credit. Independent/earned/build balance, C2-C4/G0-G7 and fullprivatev1 remain open.

## Plan and security author review

Plan review:ready after tracing schema/dataCatalog/status/scheduler/damage. Actual native RED2/5 controls is retained in BUG244. This author contract is not functional/independent/earned acceptance. Security check:pass; first-party local code/data/tests, explicit synthetic inputs; preserve native grants/saves/dependencies/CI/genuine campaign. Root sole writer/reviewer, no subagents or independent signoff.
