# P15 — Ordinary spear progression

## Overview and player behavior

BUG661 reproduces a single level1 spear with no later family upgrade. Private-v1
weapon mastery and attainable equipment requirements need ordinary spear tiers.
A stronger spear retains two-handed Spear Mastery through canonical metadata.

## Detailed curve

| Equip level | Base | Physical | Sockets / maximum | Loot tier |
| --- | --- | --- | --- | --- |
| 10 | Trident / 三叉戟 | 10–24 | 2 | 10–23 |
| 24 | Military Fork / 军用叉 | 22–48 | 3 | 24–34 |
| 35 | War Fork / 战争叉 | 32–62 | 4 | 35–51 |
| 52 | Mancatcher / 捕人叉 | 50–95 | 5 | 52–122 |

Use existing normal bow10 and two-handed polearm24/35 and sword52 damage curves.
All are twoHanded spear weapons, metal true, affixable, in the weapon slot.
Starter spear and War Pike's polearm metadata remain exact. No new mechanics,
unique bindings, assets, save fields or schemas are introduced.

## Loot formula and tuning

Use the existing28 ordinary P15 ranged/throwing table envelopes, raising the
first minimum to10. Append intersections of each tier and table bounds only.
Exactly one added spear tier is eligible at each supported source level.
Weight per table equals the frozen ranged/throwing weightPerFamily, originally
one eighth of historical pre-ranged ordinary weapon weight. Existing picks,
weights/order/bounds and all fixed Baal/goblin/service rewards remain untouched.
Added W changes other eligible probabilities w/T to w/(T+W); these provisional
weights require later economy acceptance. No guaranteed acquisition is claimed.

## Edge cases and compatibility

Equip requirements reject underlevel attempts atomically. Two-handed spears
remove an equipped shield into owned inventory; never delete it or permit
an illegal offhand combination. Upgrading spear-to-spear retains mastery without
compounding, increases native Attack and preserves the displaced item.
Existing socket capacity/affix generation and staff-art proxy are reused.
Source123+ remains outside this extension; no save version change is required.

## Dependencies and implementation

Root owns content/locales/affected tests in the existing claimed human2 tree.
Preserve exact predecessor bytes, file BUG661, add the missing-ladder regression
and record RED before production data. Then add four bases/localized names and
finite picks. Extend the existing predecessor comparison and exact Act II pool
and affix counts by the independently declared spear delta only.

## Verification

Run affected spear content/native equip checks, strict schema validation,
exact predecessor/table comparison, affected affix/pool checks, scoped strict
types/lint and four browser cases: en/zh-CN × desktop1280×800/mobile360×640.
Browser uses constructed owned gear through public import/equip/save/reload,
checking bilingual names/art, Attack delta, custody and no warnings/overflow.
No campaign replay, seed search, budget renewal, full-suite run or installation.

## Acceptance boundaries

Four real bases plus exactly the declared ordinary table additions; old content
must equal retained predecessor. Real reward materialization and native equip
must consume the metadata correctly. Constructed fixtures prove availability,
presentation and persistence, not earned acquisition, Act IV viability,
30–50-hour pacing or formal balance. Full privatev1 remains the umbrella goal.
Required evidence stays root-owned through umbrella review; remove exact owned
disposable caches/configs after processes stop. No agents/CI/commit/push/publication.

## Focused review before execution

Security check: pass. Local authored data and tests add no executable data,
credentials, network/permission/dependency or export behavior change.
Plan review: ready. Root correction supplies missing attainable content using
existing engine rules. Includes two-handed offhand custody, canonical mastery,
strict schemas and independently declared preservation deltas. No pending owner
decision. Root self-review does not replace final independent acceptance.

Catalog integration: retain the literal historical74/metal31 sets and enumerate
ranged6, throwing5 and spear4 additions explicitly. Prior catalog totals85/40
already omitted ranged/throwing; current totals100/49 include all reviewed deltas.
The Act II historical-row view also excludes the already-declared sword delta.
