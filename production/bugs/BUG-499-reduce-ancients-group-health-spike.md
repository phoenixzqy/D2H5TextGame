# BUG-499 — Reduce the Ancients group health spike

Status: Fixed locally; provisional curve pending final build/endgame holdout.
Severity: Medium — an earned summoner survives but cannot finish the trial.
Affected systems: Act V balance and the shared Ancient archetype in endgame.

Build b5a0898806bfba369a2d84a1b6c41d0bbb057fce, source21c70459a3b7cbc0aa55ab5c15c3ae15b551556a7d71e8a892c8714d34975298. Node24.21.0/WSL native stores; browser/viewport/locale N/A for this engine reproduction. Native1562/runSeed641508665/wave6; exact failed input in p15-necro-ancients-boss-exact-input-v2.json.

1. Resume earned52/26-area/61-action Necromancer after BUG498.
2. Enter Ancients' Way with learned Confuse/Iron Maiden/Amplify.
3. Win all six preceding ordinary waves, then reach the original three bosses.

Expected: the three-member trial has a coherent combined mini-boss health budget before Baal, while retaining its simultaneous attacks and individual deaths.
Actual: three bosses start at72,873/70,551/69,246HP. At60s one is dead, the others retain67,212/66,461HP; hero1444HP/497mana, three Skeletons and the Mage survive. Player damage69,774. Combined HP is3.69×the accepted57,600HP Baal budget.

Root cause: the high boss-authored life/growth is multiplied by both native boss tier and three-member group count. Provisional tuning is defined in docs/plans/decisions/P15-ancients-group-health-v1.md. Preserve stats other than life, canonical recipes/proofs/rewards and exact failed evidence. Verify the schema, group budget and exact failed-wave comparison before a native suffix; no farm or earlier-act replay.

Security check: pass; local numeric tuning only. Root retains the exact failed input/report/journal/receipt and upcoming data preimage/validation leaves in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1 through umbrella QA and owns eventual disposal. Final class/pacing/endgame acceptance remains open.

## Result

Only Ancient life/growth changes; exact preimage diff checks preserve every other monster field and row. Original native budget test212,761HP fails72,000 upper bound; construction/schema tests pass after tuning. A typed Ajv boundary replaces an invalid fixture cast; only the changed construction case is rerun. Final scoped types and focused lint pass.

The fixed failed boss comparison reproduces its original recording and outcome, then changes only native life:212,670→63,288HP; hero survives and wins50.440s. Initial bare-factory comparison failure is retained; corrected v2 preserves the original published grid/default melee metadata in both arms. No earned credit or repeated seed study.

Subsequent native1563 wins all Ancients waves and Claims Rite;1564 clears Throne/Baal34.920s and Claims Eve;1565 clears Plateau. All29 campaign areas now earned,53/next1566,64canonical actions. Exact reward, title/Nightmare/endgame proof, point, export and source/campaign audits pass.

Final source dc0dacd0b71a3dc638cc673ceec90652f2b5f57c79a06a108616beef5556c839; data0c2ec70801fddcb1018a85e8c836c0b296d05141a99b4f0b10e27bb77122b9a1. Evidence: bug499-ancients-budget-red-v1/green-v1, bug499-corrected-construction-focus-v2, bug499-scoped-types-v1/v2, bug499-scoped-lint-v2, bug499-ancients-boss-comparison-v1/v2 and p15-necro-act5-final-scoped-types-v1 logs/receipts; comparison-v2.json; p15-necro-act5-group-health-continuation-v1 full report/journal/drivers; bug499-before-act5-monsters.json. Exact leaves, terminal process proof and absent task caches are in p15-necro-act5-earned-artifacts-v1.json. Root retains them through umbrella QA and owns eventual disposal.

No final fourteen-build, endgame, pacing or independent balance sign-off is claimed.
