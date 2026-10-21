# BUG-073 — Show Mastery-adjusted summon detail values

- **Status:** Fixed — accepted bounded foundation, screen and production-browser correction.
- **Severity at reproduction:** Medium — incorrect preview values; combat remained functional and the player could calculate the documented Mastery bonuses. Bounded correction accepted by producer.
- **Owner / affected systems:** frontend-dev / engine-dev; SkillsScreen and pure skill display model.
- **Build:** `c80a7bb` (production runtime bytes frozen before commit at parent `d541db8`).
- **Environment:** bundled Playwright Chromium, Linux, 360×640, en and zh-CN. Display-only reproduction; no RNG/seed or combat advancement.

## Reproduction

1. Create a Necromancer using ordinary production controls; switch locale in Settings.
2. Export and import that save through the ordinary Settings dialog with explicit display scaffold: level30, Skeleton/Mage/Revive rank6, Skeleton Mastery20, no combo, zero skill points. This is not earned progression.
3. Open Skills → tree and inspect each skill's Current and Next Level unit stats.

## Expected and actual

Skeleton Mastery scales freshly created Skeleton/Mage life/Attack/Defense by
1.8/1.4/1.2 at rank20. Both current and next summon ranks use that same allocated
Mastery. Revive is excluded. Preserve fractional engine values.

| Skill | Actual current / next life, Attack, Defense | Required current / next |
| --- | --- | --- |
| Skeleton | 162/35/19; 172/37/20 | 291.6/49/22.8; 309.6/51.8/24 |
| Mage | 123/45/10; 130/48/10 | 221.4/63/12; 234/67.2/12 |
| Revive control | 210/38/23; 222/40/24 | Same (excluded) |

## Evidence

Root-owned temporary packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-necromancer-preparation-edsqysz8`.
`mastery-browser-repro{,-font}.{log,json}` holds exact commands/timings;
`mastery-repro{,-font}-report.json` holds ordinary DOM values, independent expected
literals and original PNG attachments. Both attempts reproduced the mismatch in
both locales; their passing checks assert the defective current values and are
reproduction evidence, not feature acceptance. `__GAME__` is absent and page
console/errors arrays are empty. Root inspected original English and Chinese PNGs.

The first Chinese PNG shows tofu from the already documented local Chromium/
fontconfig cache mismatch. The repeated diagnostic uses existing installed font
roots/rules with task-only `FONTCONFIG_FILE`/cache, no source/CSS/font/shared-cache
change. CDP confirms Noto Sans CJK SC125glyphs; corrected Chinese PNG is readable.
All original evidence remains retained.

## Root cause and chosen correction (historical proposal)

SkillsScreen calls `computeSkillDisplayModel` with only skill/rank; its
`summonUnit` reads rank-scaled template stats without current Mastery context.
GD/TD recommends an optional typed projection, composed through existing
`composeSkeletonMastery` eligibility, and shared pure three-stat multiplication
with runtime provenance guards preserved. Restrict display bonuses to exact
canonical/authored Skeleton/Mage identities with matching templates. Pass context
through current/next/unlearned preview; exclude Revive and unrelated/synthetic
identities. UI formats fractional values and deltas without floating residue,
while engine fractions stay unchanged. Bilingual identity copy is separate
presentation work; full-skill/earned/balance acceptance remains open.


## Pure display foundation at `0feb781` (historical checkpoint)

The optional typed current-Mastery input now reaches both pure current/next
resolvers. Exact authored/canonical Skeleton and Mage identities also require
matching explicit templates. Absent/malformed context, Revive and lookalikes keep
their base rows. Shared three-stat multiplication preserves engine fractions;
existing runtime projection/owner/template guards and fresh life assignment stay
in place. Inputs remain unchanged. SkillsScreen wiring, display formatting,
bilingual identity copy and production-browser acceptance remain pending, so this
bug remains open.

Regression tests first reproduced ten incorrect base-stat previews (34 controls
passed); 40 new cases cover aliases, Mastery1/10/20/capping, current/next/unlearned
rank1, cap boundaries, malformed context and exclusions. Focused355/3files passed.
Final serial checks: engine3141/83files13.22s, full6021/209files94.36s,
typecheck13.460s, lint35.286s and isolated production build9.537s (wrapper timings
where no Vitest duration is given). Original initial typecheck failure came from
an absent-template test using explicit undefined under exactOptionalPropertyTypes;
the fixture now removes the property. Final checks pass; no contract was weakened.
The engine3s/full15s targets and existing bundle/precache warnings remain unmet.

## Accepted resolution

Pure foundation `0feb781`, screen/copy `3408045` and production browser
`4cc41f0` correct current/next/unlearned Skeleton/Mage details using current
eligible allocated Mastery. Matching explicit template identity is required;
Revive and unrelated/malformed inputs remain excluded. Display formatting
preserves readable fractions/deltas without rounding engine values. Truthful
bilingual preparation descriptions replace unsupported promises. QA, GD/TD and
producer approve the bounded correction and eight production Necromancer cases;
two unchanged Raven regressions also pass. Full screen gate6031/209files, types,
lint and clean bridge/build pass; final browser-only types/lint also pass.

Existing regressions in `displayStats.test.ts`,
`SkillsScreen.summon-preparation-corpses.test.tsx` and
`tests/pwa/necromancer-preparation.spec.ts` guard independent current/next values,
clean deltas, aliases, current allocation and exclusions in both locales.
[Durable evidence](../../docs/plans/evidence/d06-necromancer-preparation.md)
records exact commits, checks, original failures/PNG attachments and limits;
its packet/archive replaces temporary-path dependence after verified cleanup.
The foundation RED source was reconstructed later; corrected UI RED was actually
captured and identical to GREEN. The initial native name-limit fixture failure
and approved narrow correction are preserved.

Imported L30/Mastery/gear/resources are diagnostic scaffolding, not earned
progression/balance. Incomplete mobile numeric framing and Linux navigation
pictograph boxes are disclosed; exact DOM assertions cover all numeric rows.
Full glyph/a11y/platform/performance, Mage elemental identity, fullD06/P09/P10
and private-v1 remain open. Engine/full time budgets and build warnings remain
unresolved. Closing this display bug grants none of those wider acceptances.
