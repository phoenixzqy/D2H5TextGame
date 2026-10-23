# D04 — Coherent mercenary level growth

GD-DESIGN-REVIEW: APPROVE. TD-CONTRACT-REVIEW: APPROVE.
Producer plan-review: ready with safeguards below. Security check: pass.
2026-10-23; BUG095. Root owns implementation in claimed human worktree2.

Use the unchanged eight class gain rows and documented fallback. Move the shared
rule below stores without new tuning. Shared bare old/new derivation supplies
attack, defense, speed, mana-capacity and physical-dodge deltas over the saved
unequipped baseline. Preserve authored offsets and exact zero-delta fields.
Retain existing class-specific life/HP policy and raw core growth, including
rounding/soft-cap/saturation through shared formulas. Keep current mana, explicit
MR, skills/configuration, identity and gear contents. Never bake gear into saves.

Repair identifiable historical frozen-hire caches only when the complete catalog
ID/core/class-life/five-field signature described in BUG095 matches. Derive from
bare current core/level; copy only the five fields. Preserve every other field,
including HP/MP, maxima except manaMax, and XP. No magnitude heuristic or general
rederivation. Normalize at validated decode and before positive XP/upgrade; repair
must survive positive XP with zero level crossings. Known instance suffixes work;
unknown IDs/custom histories do not trigger. Prototype-like class IDs use fallback.

upgradeMerc shares the transition; retain XP remainder/explicit thresholds.
For existing canonical progress at the old level, advance its canonical threshold
to the new level without resetting XP. Missing progress stays missing.
Reject nonfinite transition/repair output before state publication.

Regression proof covers authored hires, classes/fallback, exact historical mask,
nontriggers, immutable/idempotent decoding, resources/MR, multi-level composition,
XP edges, both mutations and real equipment/combat integration. Run focused and
engine tests, then frozen full/type/lint/build and appropriate production browser
proof. Any retained C1 checkpoint must qualify through production restoration;
no harness-patched stats, added farming, seed search or campaign acceptance by
unit tests. One bounded diagnostic may follow independently reviewed source.
Full C1–C4/G0–G7 remain open.
