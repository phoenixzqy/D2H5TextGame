# P15 — Rank-based Attack contribution for Bow volley

Authorized private-v1 implementation/balance work, root sole writer.
Supersedes D04's no-Attack-scaling restriction for Multiple Shot only.
BUG501 reproduces native489 Radament's damage floor on the exact earned
party/resources/enemies/derived wave seed. Existing +12 flat damage/rank
remains; a higher flat curve alone would also inflate early-rank damage.

Multiple Shot adds `scaling.attackDamagePctPerLevel: 40` percentage points
of snapshot Attack per rank above one. Rank1 adds0%; rank2 adds40%; rank20
adds760%. The existing flat damage40–60/+12 remains. The Attack contribution
joins the existing flat bonus before damage multipliers, crit, resistance and
Defense; it changes no target stats and never bypasses mitigation. Current
Attack includes level, attributes, equipment and existing authorized buffs.

Retain15MP/2s, cone3/cap5, ordinary independent hit rolls, unlock6 and Magic
Arrow prerequisite. No new equipment gate, status, save field, dependency,
attack-rating system or global damage modifier. Other skills retain their
current Attack behavior. Schema confines the new optional scaling field to
Multiple Shot; that skill requires it. Numeric tuning is JSON, never engine
constants. Engine registration and bilingual current/next/MAX previews share
its rank rule.

The candidate40pp/rank is a provisional curve knob, not balance signoff.
Retained Baal82 has57600HP/560Defense: the capped flat volley cannot sustain
a viable boss damage budget; late Attack growth must matter. This forecast is
not earned Bow ActV evidence. Preserve prior Nova/necro evidence and validate
Bow later acts from the actual new earned successor before final fresh/matrix/
pacing/holdout acceptance.

Focused checks: exact failed Radament regression RED→GREEN; literal Attack
sensitivity at ranks1/2/20 after25% physical resistance and10Defense; malformed
and transplanted schema field refusals; unchanged registration/cap/cost/cone;
bilingual unlearned/current/next/MAX and real-browser preview. Existing Attack
skills keep their data contracts. Resume490 with seven retained ActII actions,
no prior-act replay or resource/level/point grants.

Root plan review: ready after accounting for rank1 preservation, exact field
scope, pipeline order, tooltip data, unchanged older skills, retained partial
quest order and earned continuation. Whole-v1 acceptance remains open.
