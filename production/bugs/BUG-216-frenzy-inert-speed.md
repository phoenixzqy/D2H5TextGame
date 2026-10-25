# BUG-216 — Frenzy never gains its advertised speed after hits

- Status: reproduced; speed-stack/dual-attack contract and repair open.
- Severity: High — the named skill's advertised speed mechanic has no effect.
- Owner: root; independent design/QA and earned balance remain open.
- Build: source base `5f771707` plus frozen Double Throw repair; Frenzy itself unchanged.
- Environment: Node24.21.0; native L30 Barbarian, ranks1/2/20 ×seeds7/19/41/97.
- Browser/viewport/locale: native engine reproduction; both en/zh-CN descriptions
  promise a dual-wield attack that increases speed with every hit. No browser acceptance.
- Affected systems: JSON-authored attack-speed stacks, registered effects, action
  cadence, paid-hit lifetime/playback and truthful skill UI.

## Reproduction

1. Learn Bash1→Double Swing1→Double Throw1, then Frenzy at rank1/2/20; select only Frenzy.
2. Supply synthetic1,000,000HP/MP and100Attack Speed, no mana regeneration.
   Hold one huge-HP enemy so it cannot interrupt/kill the hero. No gear/build credit.
3. Run seeds7/19/41/97 through native playerToCombatUnit and runBattleRecorded.
4. Compare each repeated paid attack with the same snapshot using ordinary attacks.
   Verify input immutability, exact replay and retain complete events before asserting.

Expected: landed Frenzy hits produce a defined bounded speed increase and observable
change to later action timing. The existing prose does not determine numerical
potency/cap/duration or the dual-attack multiplicity; record a contract before repair.

Actual: all12cases execute35paid Frenzy actions, with27–30positive landed hits.
Every action gap remains1700ms, exactly matching ordinary-attack controls.
Initial/final Attack Speed remains100, no carried speed status appears. The actual
registered effect is only Physical85–120/+8rank damage; no speed-stack capability.
The final intentional assertion exits1 after retaining all observations.

Evidence: [native reproduction](../../docs/plans/evidence/d04-frenzy-repro.md).
No Frenzy patch/credit, genuine campaign action or remote action.
