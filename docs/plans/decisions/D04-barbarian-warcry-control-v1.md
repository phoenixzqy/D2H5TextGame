# D04 — Paid Howl, Taunt and Battle Cry

2026-10-25; local implementation contract for BUG221/223/224. Root remains
sole writer/reviewer. Independent design/QA and earned balance remain open.

The existing effects are decorative one-second markers. Preserve unlocks,
prerequisites, caps, costs and cooldown growth, and give those paid intervals
actual combat consequences. All tuning is JSON-authored. The Battle Cry
potencies below are provisional implementation choices, not owner or independent
balance approval. Campaign pacing and final balance still require earned proof.

- Howl: every living hostile loses scheduled actions for1s, or0.5s for bosses
  and chapter bosses. This is fear represented as disruption under the game's
  no-movement invariant. No damage, hit roll, personal dodge or movement bonus.
- Taunt: one living hostile's basic attacks and single-enemy skills select the
  living caster for1s when the caster remains an eligible opposing target.
  Caster death, absence or changed allegiance falls back to ordinary targeting.
  Friendly/self/area effects retain their existing target sets. No added damage
  bonus or enemy Attack penalty. No replacement of ordinary threat weights.
- Battle Cry: all living hostiles receive1s of25% outgoing direct-damage and
  50% ordinary-Defense reduction at rank1, growing1 and2percentage points per
  additional rank (rank20:44%/88%). Apply the outgoing multiplier after direct
  hit/flat/increased/combo/critical calculations, before resistance/flat
  mitigation; apply Defense reduction multiplicatively with existing effects.
  Magic Resist, resistances, ongoing DoTs and reflection are unchanged. The
  effect persists to expiry if the caster dies, without mutating base stats.

Each cast pays once and starts its authored cooldown once, with no hit roll.
Start is inclusive, expiry exclusive. Same-status reapplication replaces source,
potency and lifetime with the latest cast; no stacking. Unrelated statuses remain.
Battle Cry carries a copied immutable rank/potency snapshot. A bare or malformed
marker grants no reduction. Taunt checks its finite active interval and current
eligible source at selection. No transient combat state enters Save22.

The unused active-skill passiveStatsPerLevel rows are removed from these three
skills so previews cannot imply passive personal power. Battle Cry's unrelated
amp-damage tag is removed; its Defense reduction does not reduce resistance.
All three remain native class/unlock/prerequisite/rank/priority governed. Changes
apply next wave, preserving current recording, HP/MP and save semantics.

Acceptance covers actual action interruption/resumption, forced recipient and
fallback, actual incoming/outgoing HP changes at ranks1/2/20 across fixed seeds,
cost/cooldown refusal, targeting boundaries, exact finite lifecycle, refresh,
immutable replay/playback/carry, native authority/allocation/save, bilingual
current/next/MAX and mobile/desktop public cast/Save/Continue/offline checks.

Security check: pass; local engine/data/presentation/tests only, with no
credentials, dependency, persisted schema, network export or remote action.
Plan review: ready after making source death/allegiance, replacement, area
boundaries, direct-versus-periodic damage, copied potency and provisional tuning
explicit. No independent or earned gate is closed by this author contract.
