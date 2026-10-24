# D08 — Campaign/replay equipment eligibility

Root implementation and self-audit; independent acceptance pending.
BUG152 reproduces17 empty Normal and106 empty Nightmare equipment contexts
among109 sampled TC/level pairs per profile. The original audit covers all29
areas, five ordinals, manual/idle and two replay profiles; original JSON/logs
remain unchanged. This is eligibility evidence, not earned victories.
The same post-change screen has0 empty pools in both109-context profiles.

The [finite-band contract](../decisions/D08-campaign-replay-equipment-bands-v1.md)
extends93 highest-band `maxLevel` fields in15 live act tables. A parsed
before/after comparison restores exactly those fields and recovers the whole
original JSON. Minima, bases, weights, rarity, direct rewards, lower rows,
unused champion/unique/jewelry tables, goblin and quest caches are preserved.
No production TypeScript, monster levels/stats or existing saves change.

All32 new checks first fail against original data in1.56s. They cover15
continuous level envelopes through finite Nightmare ceilings, actual Normal/
Nightmare planners across29 areas/manual/idle/all13 count residues/two seeds/
two pity endpoints, and15 real reward-materialization boundaries. Seed samples
are not a certification of all RNG states. The two earlier upper-bound tests
are updated under the superseding D08 contract; original lower bounds,
level19 boss rewards and level29 Tomb equipment expectations remain intact.

Focused104/5files PASS; post-lint32/1 PASS. Engine5638/172files PASS74.12s.
Typecheck, final full lint, production build and all4 canonical production JS
bridge scans pass. The initial lint failure is one non-null test assertion;
using the existing required-content helper corrects it without changing
production source or test behavior. The first full run has11470pass/2fail/
2existing skips across438files in443.87s: two old Baal seed totals assume
ineligible equipment. Call-through native drop capture proves two40-stone TC
picks plus unchanged separate48Nightmare/40Normal, with positive gear; totals
are128/120. The revised10-test replay file passes, including the original
profile authority, once-only settlement and fixed boss anchors. An intermediate
exact-drop expectation omitted the actual currency itemId; its failed log is
retained. Vitest1.x exposes spy results as untyped values; an explicit production
return type corrects strict type/lint errors, without changing runtime behavior.
Final full unit:11472pass/438files/2existing skips, exit0,457.59s. Final strict
typecheck/full lint and post-type-only10-test replay file pass. The new spy
return-type annotation is erased at runtime; production data/source remains
unchanged throughout the final full run. Existing suite-time budgets, build
chunk/PWA-manifest warnings and independent acceptance remain open.
There is no `validate:data` npm script; the actual Ajv2020 schema validation
for every treasure class runs in the existing ActII regression suite.

Materialization checks prove base identity, actual ilvl and unique owned IDs,
not affix quality. The follow-up native item audit confirms BUG153: magic/rare
ilvl99 has2/6 affixes, while100/102 has0 because both affix pools end99. That
separate defect remains open; no claim of full G4/economy/balance acceptance.

Task logs, parsed data comparison, screens and diagnostic JSON remain root-owned
at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`
through campaign/full-v1 consumers; root removes them afterward. Disposable
production build/preview are retained only while the active earned ActIII
browser consumes them, then root stops the exact session and verifies removal.
C0/C1 accepted; C2 incomplete; C3/C4/fullG0–G7 open. Local only.
