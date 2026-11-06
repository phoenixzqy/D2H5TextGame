# P15 — Provisional Duriel pressure tuning

2026-11-05. Tuning/addition under BUG731; root author decision, not independent
design or balance acceptance. Existing implementation authorization covers this
small tuning change. References: `docs/design/combat-formulas.md` §6,
`docs/design/monster-spec.md` Duriel notes and the retained first-clear sources
in the BUG731 report.

| Parameter | Before | Adopted | Purpose |
|---|---:|---:|---|
| Tomb chapter Attack | 220 | 350 | Raise regular physical pressure after earned resistance and flat Defense |
| Duriel critical damage | implicit boss 1.75× | authored 1.25× | Limit the rare spike that an Attack-only increase creates |

Add optional `MonsterDef.critDamage`, a finite number >=1. Schema and direct
factory input reject invalid values. It overrides the tier critical multiplier;
absence retains 1.5× for ordinary tiers and 1.75× for boss/chapter-boss. Critical
chance remains 5%/10%. No additional RNG draws. Only Duriel authors this field.
It applies to all constructions of that archetype, including the Tomb's ordinary
boss encounter and Nightmare/Hell replays. Only the chapter's exact Attack anchor
changes; native Attack/growth and replay level-ratio scaling remain as before.

This changes pressure, not the global mitigation order, shared Charge (60–90
plus 100% current Attack, CD4), passive Frost Aura, immunities, HP, defense,
speed, targeting, loot or saves. The initial knob range is the schema's finite
>=1 domain; no narrower accepted balance range exists yet. The factory default
was previously hardcoded and had no authored override.

Scalar projections from six retained Duriel entry records (not new attempts):

| Entry unit | Before ordinary Charge | Adopted ordinary Charge | Adopted critical Charge | Entry life |
|---|---:|---:|---:|---:|
| Bow hero17 | 1–20 | 88–109 | 158–183 | 419 |
| Bow Prayer18 | 1–10 | 81–102 | 153–180 | 443 |
| Swing hero15 | 1–1 | 5–18 | 49–65 | 472.77 |
| Swing Prayer17 | 35–63 | 157–185 | 253–289 | 484 |
| Druid hero15 | 48–68 | 137–158 | 208–234 | 526 |
| Druid Rogue18 | 42–67 | 148–172 | 231–261 | 391 |

The paired choice removes the Swing hero's ordinary Charge floor while leaving
its ordinary basic attack at the floor; mitigation investment still matters.
Attack350 alone would permit critical Charge495 versus Prayer484 life and439
versus Rogue391. The paired choice is below entry life in these six records,
but offers no global one-shot guarantee: weaker companions/summons, partial life,
critical chains and later replay profiles remain risks. Druid/Oak life-capacity
adjustments are retained, not clamped to the entry snapshot's base maximum.

Implementation criteria: authored override/defaults and invalid input handling;
identical untouched unit fields/next RNG draw; native manual/idle chapter Attack
350, HP25600 and critical1.25; exact nonboss prefix/source preservation; unchanged
replay growth rules; literal damage envelopes through the production pipeline
and bounded constructed Charge behavior. Only affected checks run. No earned
campaign, screen, sample or retry allowance is renewed.

Challenge acceptance remains open: these projections cannot establish the target
win probability, boss duration, acquisition fairness, or human campaign pacing.
BUG731 stays open after implementation; 14/14 historical Normal completions,
210 checkpoint sources and formal balance acceptance0/210 remain unchanged.
