# D05 — Avoid, Evade and Pierce

Status: implemented and locally verified at base `b5ce230`; independent acceptance open.
Root sole writer; independent acceptance and earned class/build balance remain open.
Implementation: `9658f86`; [evidence](../evidence/d05-amazon-remaining-passives.md).
Extends D05 Amazon passive composition without changing authored potency or saves.

| Skill | Unlock/prerequisite | Per rank (cap20) |
| --- | --- | --- |
| Avoid | L12/Dodge | +1 percentage point magical dodge |
| Evade | L24/Avoid | +0.5 percentage point each physical/magical dodge |
| Pierce | L30/Penetrate | +2% direct physical damage, +1% fresh Attack |

The exact authored `skills-amazon-<slug>` and canonical `amazon.<slug>` aliases
resolve the maximum valid positive integer rank once, clamped to copied cap.
Fresh eligible player Amazons only; native learning retains prerequisite checks.
No weapon restriction, ranged accuracy, projectile passthrough or movement condition
is added. JSON bonuses are controlling; conflicting locale promises are superseded.
Pierce/Penetrate Attack percentages add in the same fresh equipment-derived bucket;
Pierce physical damage uses the existing per-type direct-hit consumer once.
Fixed elemental spell bases remain unchanged. Existing damage/dodge rules govern
actual results; no new caps, RNG draws, costs, cooldowns or passive cast actions.

Use one closed finite nonnegative coefficient shape per exact identity. Copy/freeze
tuning, including multi-stat rows, without freezing/retaining source JSON. Composition
never persists derived bonuses, refills pools or compounds across projections. Current
recordings remain fixed; next-wave and explicit replay preserve original resource carry
and introduce no reward. Both locales show correct fractional current/next values.

Plan review: ready after accounting for multi-stat tuning, additive Attack ordering,
strict schema regressions, native prerequisite/recording/reset/import paths, actual
physical/magical hit consequences, bilingual production UI and exact Continue.
Root self-review only. Security check: pass; local typed data/combat/UI tests, no
network/dependency/credentials/permissions/CI or save-shape changes. Genuine earned
Rite save remains unchanged; constructed fixtures are never campaign/balance evidence.

Verification: causal composition and schema/UI RED before runtime edits; focused,
engine/full units, types, lint, production build and en/zh×desktop/mobile browser.
Task-owned scratch/build/browser paths are recorded and removed after archiving
necessary evidence. Full C0–C4/G0–G7 scope and independent acceptance remain open.
