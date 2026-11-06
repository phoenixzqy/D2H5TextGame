# BUG-567 — Schedule earned preparation at the authored Act III power gates

- Severity: Medium; ordinary manual farming remains available.
- Status: Fixed in campaign tooling; affected checks and native Act III continuation verified.
- Owner: campaign progression tooling, root sole writer.
- Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
- Environment: native Node campaign service in WSL; viewport/locale inapplicable.
- Production hash: e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a.
- Source authority: campaign audit 14.

## Reproduction

1. Continue exact ordinal-300 earned save with the maintained pre-Flayer level-28 preparation.
2. Retain all 56 farm admissions, including three defeats, and clear Flayer Jungle.
3. Recover Khalim's Heart and continue into Bazaar without any further training boundary.
4. Observe ordinal-357 Bazaar wave three attrition and wave four defeat; successor ordinal 358.

Expected: earned level preparation follows the authored campaign power curve.
`docs/design/maps-spec.md` §7 recommends Bazaar 35, Travincal 38 and Durance 40;
`progression-curve.md` recommends Act III 26–40. Training uses known cleared
content, finite budgets, native XP/loot and legal allocation; every defeat stays.

Actual: a level-28 hero faces Bazaar's level-39 champions, Attack 416. Wave
three deals 202 physical, 74 thorns and 53 periodic damage; wave four starts
at 219/498 Life and loses at 4000 ms. Four of five Lightning Strike damage
events are dodged in that wave. This single observation is not a population
failure estimate. The next declared level target is 46, only after Act III.

Owned-only investigation: all 83 retained backpack/stash armor pieces have
no authored Strength requirement. The native gear comparison at a 150 Mana
reserve selects no different hero gear. Do not prescribe either stat reset
or reserve relaxation without new evidence.

Evidence: `p15-javelin-act3-prepared-continuation-v1.json`, its journal and
`p15-javelin-act3-preparation-diagnosis-v1.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The successor retains twenty-one Act II plus four Act III actions; all audits pass.

## Planned correction

Split the original post-Act-III 800 admissions/28,800,000 combat-ms allowance:

- Before Bazaar: Great Marsh to35, at most200 admissions/7,200,000 combat ms.
- Before Travincal: Flayer Jungle to40, at most200 admissions/9,000,000 combat ms.
- Before Act IV Plains: Bazaar to46, at most400 admissions/12,600,000 combat ms.

Keep the earlier pre-Flayer target28 and Act I/II/V policies. Each stage keeps
three-consecutive/ten-total-loss bounds. These are separate declared stages,
not a claim that the original ten-loss stage allowance is shared across them.
Require actual prior clears for these Act III farms before allocation/admission.
The combined admission/combat allowance remains800/28,800,000. Farm choices
advance with earned clears, avoiding overlevel penalties on permanent Marsh farming.

Plan review: ready. Main integration points are the maintained request table,
native shared training gate, ordered audit and single resumed external driver.
Continue exact ordinal358 with the three unfinished Act III route areas, not
new quest Starts or previous recoveries. Stop on bounded training failure or
first route nonwin. No success is assumed; later matched-power balance remains open.

Security check: pass; local policy/native earned services, no dependencies,
credentials, permissions, networking, CI or publication changes.

## Verification and outcome

The three declared level gates and prior-clear guard are implemented. The
initial focused suite fails three checks before correction and passes all18
afterward; scoped types and explicit lint pass. Authority15 freezes the change.
Exact ordinal358 earns35 in172 Marsh admissions (171 wins/one defeat), then
loses BazaarW4; that loss and successor531 remain retained. Level preparation
alone does not establish survival or population balance.

After the separately documented support and owned-shield changes, the exact
ordinal532 continuation records zero new Bazaar-stage farms and160 Flayer
victories to40 before Travincal, within200 admissions/9,000,000combat-ms.
Council and Mephisto clear; all audits pass. The later Bazaar-to46 stage is
implemented and regression-checked but not yet exercised natively. See
`docs/balance/2026-11-02-javelin-act3-level-gates-and-support.md`.
