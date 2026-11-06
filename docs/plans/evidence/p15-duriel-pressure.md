# P15 — Provisional Duriel pressure implemented

2026-11-05. Implemented locally, uncommitted; BUG731 and full private-v1
acceptance remain open. Contract: [paired tuning](../decisions/P15-duriel-pressure-v1.md).
The preceding status turn made no source changes; this increment finishes the
implementation and verification. Existing human2 ownership remains in use.

Earned flat Defense after resistance cancels the previous chapter Attack220.
Adding HP alone would preserve that damage floor. Tomb chapter Attack is now350;
Duriel's authored critical multiplier is1.25 rather than the implicit boss1.75.
Attack350 alone allows critical Charge495 against the retained Swing Prayer's
484entry life and439 against Druid Rogue391. The paired multiplier limits these
two envelopes to289and261. These are endpoint projections, not observed wins.

The optional finite `MonsterDef.critDamage >= 1` is validated by the strict schema
and at the direct factory boundary before RNG consumption. Absence preserves
ordinary1.5/boss1.75; critical chance, all other factory outputs and the next RNG
draw are unchanged. Only Duriel authors the override. It applies to ordinary
Duriel encounters and replay constructions too; the chapter Attack anchor changes
without changing native Attack40/+6.25growth or replay scaling. Shared Charge,
HP, aura, immunity, defense, speed, loot, saves and global mitigation stay intact.

The affected checks pass:

| Scope | Passing selected cases |
| --- | ---: |
| New multiplier/default/rejection controls and existing factory | 21 |
| New Duriel construction/projection/Charge cases and shared Charge | 22 |
| Selected Act II chapter source/loot regressions | 2 |
| Duriel aura and Freeze immunity | 6 |
| Selected Act II numeric chapter regression | 1 |

Total52distinct selected cases;50unrelated parameter rows were filtered in
the legacy and numeric selections. No other act or completed
campaign was rerun. Scoped strict checking traverses935files with zero diagnostics.
Nine changed TypeScript files pass lint; the final numeric-only lint also passes.
Strict schemas validate38ActII monsters and six sub-areas. Structural comparison
with retained preimages proves that only Duriel's multiplier, Tomb chapter Attack,
and the optional monster-schema property changed in those JSON files.

Constructed Chromium147 verifies the compiled browser schema, rejection of eight
invalid multiplier values, manual/idle chapter350Attack/25600life/1.25critical,
ordinary level27Duriel Attack324, Normal/Nightmare/Hell Attack350/537/724, and two
bounded native Charge fixtures with forced zero/full critical chance. Definitions,
plans and battle inputs remain unchanged. No page errors, warnings or failed
requests remain. This is native-module verification, not UI or earned playtest.

Failures are preserved rather than hidden. Initial RED cases prove the absent
multiplier and old Attack. Three factory fixture failures came from comparing
custom edited definitions against bundled delivery provenance; both generic
controls now use a custom identity, while real Duriel independently asserts
melee delivery. The legacy numeric test also incorrectly treated passive cold
pulses as physical hits and omitted Chill's physical bonus. Its ActII branch now
requires all active actions muted by Mana Burn,12cold15pulses/Chill applications
at5000ms intervals, and physical350outside/367inside exact2sChill windows. Other
chapters' assertions remain untouched. A TypeScript union-narrowing error in that
test was fixed. The browser driver's CommonJS Ajv direct-URL import was replaced
with Vite's normal bare import. A validator-script assertion incorrectly required
invented schema description wording; it now verifies the optional numeric contract
and unchanged remainder. Final results above follow these corrections.

Five-axis self-review found no required implementation change. This is not
independent design/reviewer signoff. Six retained entry-unit projections cover
only scalar damage envelopes; they do not prove weaker companion safety,
critical-chain safety, win probabilities, duration, acquisition fairness or human
pacing. No exhausted campaign, screening, sample or retry allowance is renewed.
Historical14/14Normal completions and210checkpoint sources remain historical;
formal balance acceptance stays0/210. Progression/challenge/acquisition/economy/
pacing, difficulty/endgame and integrated acceptance remain unfinished. Browser
works; CI is excluded; owner playtest follows implementation; no question pending.

Root retains this evidence packet through full-v1 acceptance and removes it after
all consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-pressure-rya4f_2i`.
It contains preimages, projections, RED/intermediate/GREEN results, native browser
driver/result, strict types/lint/schema reports, exact incremental diff/current
hashes, self-review and cleanup receipt. All named handles are terminal. Both
browser-driver PIDs are absent; their listening port is unbound. The exact
task-owned Vite cache was removed and absence verified. No disposable task path
remains; the retained packet is required evidence owned by root.
