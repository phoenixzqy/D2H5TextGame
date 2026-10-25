# BUG-191 — Apply the paid Cyclone Armor defensive bonuses

Severity: High — paid advertised defense has no effect.
Status: Reproduced; local fix in progress.
Owners: engine-dev / frontend-dev; root sole writer.

## Reproduction

Commit `5e47fff`; Vitest UI project, Node, synthetic native Druid fixture.
Browser/locale are inapplicable to this native projection/recorded-engine repro;
later presentation checks must cover en/zh-CN and desktop/mobile. Seed7.

1. Project an actual Druid with Arctic Blast1 and Cyclone Armor1 or20, level30.
2. Pay the actual registered Cyclone cast at500ms; hold later hero actions.
3. Resolve a fixed100Fire incoming hit at1700ms, with no preexisting mitigation.

Expected under the [local contract](../../docs/plans/decisions/D05-cyclone-armor-v1.md):
rank1 loses97HP after1pp resistance and2HP absorption; rank20 loses40HP after20pp
resistance and40HP absorption. Paid mana and base stats remain correct.
Actual: both casts create the permanent buff marker, but both hits lose100HP.
The two actual-HP regressions fail at the damage assertion.

Cause: catalog registers an ordinary marker-only buff; the combat damage path
never reads authored shieldAbsorbPct/resistAllPct for it. No workaround.
Evidence: `src/stores/cyclone-armor.causal.test.ts`, original `causal-red.log/json`
under task scratch `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cyclone-hihak566`.
Final evidence/cleanup will retain the original failures. Independent design/QA
and earned build balance remain open; no genuine campaign action.
