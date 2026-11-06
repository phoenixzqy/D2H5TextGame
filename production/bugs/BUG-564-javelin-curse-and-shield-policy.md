# BUG-564 — Consider owned shields during fixed-damage Javelin progression

- Severity: Medium; native manual gear changes are available.
- Status: Fixed locally; uncommitted. Full balance acceptance remains open.
- Owner: campaign equipment policy, root sole writer.
- Build: `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`,
  production hash `e052031bd7ebe48640e6bc1e73079d9abc4b4548a7e009c418f8251e3023271a`,
  supplemental campaign authority 11.
- Environment: Node native campaign service in WSL; viewport/locale inapplicable.

## Reproduction

1. Authenticate `p15-javelin-act2-owned-sockets-continuation-v1.json`, the
   earned level-24/ordinal-295 successor. Retain its fourteen historical defeats.
2. Read its wave-four journal: Greater Mummy's Amplify Damage subtracts fifty
   physical resistance points; the hero dies after casting Lightning Strike.
3. Run the frozen read-only `p15-javelin-act2-curse-shield-comparison-v1`.

Expected: preparation represents the authored curse and can consider eligible
owned shields during the level 24–27 phase whose sole selected skill is
Lightning Strike. Keep the mainhand, Attack Speed and declared mana reserve.

Actual: the score omits the curse; the helper excludes offhands and retains
entry Attack even when the selected skill has no Attack coefficient. The owned
rare kite shield raises Defense 163→185 at unchanged Attack Speed 171. Attack
falls 281→185, while registered Lightning Strike rank-20 base remains
1505–1535. Its cursed physical probes fall by 22 damage. This is a forecast,
not evidence of campaign survival or causal win-rate improvement.

Evidence: the comparison policy/result/driver and native continuation/journal in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Runtime authority is `dataCatalog.ts`'s optional Attack coefficients and
`combat.ts`'s `buildDamageInput`; ordinary attacks still depend on Attack.

Fix: explicit hero-only shield policy with validated minimum Attack; generic
default floors stay intact. Retain the mainhand and refuse a two-handed loadout
before mutation. Only Act II earned Javelin at levels 24–27 opts into zero
minimum Attack. Once Impale enters at 28, retain ordinary Attack floors again.
Use the authored fifty-point curse on Act II physical probes. No monster,
skill, formula, source-save, grant, seed or prior quest changes.

Security check: pass; local policy/native owned gear only, no credentials,
dependencies, network, CI, permissions or publication changes.

## Verification

Three shield/curse regressions and the native level-24 dispatch check fail before
the fix. All forty affected survival/Javelin checks, scoped strict types and
explicit lint pass afterward. The first native continuation still loses Arcane
wave four despite normal cursed hits falling to 82; all audits pass. Preserve
that result and every prior defeat.

The subsequent declared preparation uses the existing unlocked native Holy
Freeze hire at level 12 and owned equipment, preserving the Rogue and its gear.
Three new companion regressions fail before the helper; all thirty-seven
affected Javelin/dispatch checks, strict types and explicit lint pass. The native
continuation completes twelve waves, Summoner/Duriel and the final Act II Claim
with no audit errors. Holy Freeze dies before Arcane wave four and both bosses;
do not infer direct aura protection or causal/population acceptance there.
See `docs/balance/2026-11-02-javelin-act2-shield-and-freeze.md`.
