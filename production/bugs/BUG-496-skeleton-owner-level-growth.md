# BUG-496 — Skeleton bodies stop growing with the campaign

- Severity: Medium; summon-build progression and balance.
- Status: fixed locally; exact failed-wave comparison and earned Necromancer
  Act I continuation pass. Full five-act/matrix balance remains pending.
- Reproduction: retained earned Necromancer L12, Catacombs ordinal106/index4.
  Skeleton11/Mastery1 creates two220.48HP/45.9Attack skeletons. Their combined
  nine attacks emit7damage before both die. Native rare-elite armor98 already
  exceeds their ordinary hit. Across later acts owner level increases while
  capped summon rank leaves body stats fixed.
- Expected: a paid skeleton build can gain useful body power as its owner
  progresses, without changing the startup-only/cap/resource contracts.
- Actual: summon level follows owner level; Skeleton/Mage body stats depend only
  on fixed JSON bases, capped skill rank and Mastery. No owner-level growth exists.
- Evidence: retained p15-earned-act5-necromancer-summon-v1/necromancer-summon.json
  and journal; p15-necromancer-summon-nonwin-diagnosis-v1.md in the existing packet.
  src/engine/skills/summons.ts and scaling.ts establish the missing progression.
- Fix candidate: JSON-authored additive owner-level body growth for newly created
  player-hero Skeleton/Mage only. Apply after rank and before Mastery; previews
  use actual player level. No retroactive healing, new summons, cap, enemy,
  skill cost, reward, RNG or save-format change.
- Validation: focused schema/runtime/preview/ownership controls, then the exact
  retained failed wave on current source. No prior-act replay or seed grid.
  A single wave cannot accept five-act or fourteen-build balance.

- Outcome: identical retained wave changes draw60s/19summon damage to
  win24.14s/5248summon damage. Native attempts107/108retain nonwins; actual
  owner13/Skeleton12 wins Catacombs114, claims Sisters and unlocks ActII.
  See `docs/plans/evidence/p15-skeleton-owner-growth.md`; no full-campaign claim.
