# D06 — Druid summon behavior and authored templates

Local implementation contract for reproduced BUG195. Root is sole writer;
independent design/QA and earned class/build balance remain open. Seven skills
stay in scope: Raven, Poison Creeper, Spirit Wolf, Dire Wolf, Carrion Vine,
Solar Creeper and Grizzly. This contract does not grant functional credit.

## Existing policy preserved

[D06 preparation](D06-summon-preparation-v1.md), wave-local identity and
[corpse consumption](D06-corpse-consumption-v1.md) remain controlling. Keep
existing damage/stat rank growth, MP costs and rank discounts, cooldowns,
unlocks/direct prerequisites, caps, owner/template coexistence, positions and
one paid complete missing batch per wave. No ordinary re-summon/refund, free
refill, extra hero turn or family exclusivity. Paid forms are independent.

Move only these seven templates' existing numeric stats out of the TS switch
into strict validated JSON. Preserve every current stat and resistance exactly;
shared friendly magical mitigation stays under the existing JSON definition.
Other templates retain their current implementation. Runtime bodies and pure
Skills previews read one immutable validated source, with no retained mutable
caller references or numeric fallback for absent/malformed Druid definitions.

## Missing mechanics and explicit provisional tuning

These are new v1 choices, not canonical D2 or earned balance. Put all new numeric
knobs in JSON and expose them truthfully in both locales.

- Raven keeps ordinary Physical basic attacks. A landed attack applies finite
  Blind for2000ms, refresh/cap1, with no boss shortening. While active, Blind
  reduces ordinary Physical/thorns hit probability by0.20 (20 percentage points),
  preserving the existing5% minimum. Magical hits, mitigation, action cadence and
  control immunity do not change. Blind is neither Stun nor movement/range logic.
  Missed attacks apply nothing; each real landed hit follows existing status
  settlement. Use active clock views so future/expired Blind has no effect.
- Poison Creeper keeps its ordinary Physical hit and applies ordinary Poison:
  DPS is max(1,floor(final mitigated hit*0.10)), with existing5s/cap10/refresh,
  integration, death/spread and cleansing semantics. Only existing Attack rank
  growth changes potency; do not multiply it by rank a second time. Misses apply
  nothing. This is actual later poison HP loss, not a marker or direct-type label.
- Carrion Vine consumes one oldest eligible body on its own scheduled action,
  restoring floor(current living owner's maxHP*0.05), capped by missingHP.
- Solar Creeper uses the same rule for maxMP*0.05 and missingMP. Keep MP events
  authoritative for playback/carry. Neither restores a dead owner or heals others.

A useful vine recovery replaces that vine's ordinary attack on that action; it
adds no extra turn, MP cost, cooldown or RNG. If no body, no missing relevant
resource, zero/nonfinite recovery or invalid/dead ownership, consume nothing and
retain its ordinary attack fallback. Stun/Freeze/Paralyze follow ordinary action
eligibility; they must prevent recovery just as they prevent its attack. Existing
stat growth, cadence and damage remain meaningful for wolves, Grizzly and vines.

## Authority and lifecycle

Capture eligible selected Druid ranks from the actual current Player, using
exact authored/canonical aliases, maximum valid integral1–20 rank, current class,
unlock and D06 direct prerequisites. Do not broaden preparation to unslotted
skills or change the established D06 direct-prerequisite policy. Copy the narrow
rank projection onto the fresh native combat unit, like existing form authority;
it is transient and never a Player/save field. Missing/malformed authority grants
no special summon mechanics. Standalone synthetic bodies retain ordinary damage.

At successful canonical preparation, validate living player hero/no owner markers,
exact registered Druid skill semantics against immutable authored metadata, rank,
owner and template. Bind only the resulting actual runtime summon IDs to effects;
never trust a template name, forged arbitrary skill, enemy/merc/summon owner or
preloaded body alone. A validated already-full batch may bind matching living
preloads without resetting their HP/status/position; poor/invalid batches grant no
new bodies. Preserve the existing generic preparation path and Mage/Iron behavior.

Revalidate the living original owner and exact registered body on each action.
Death/orphan closure removes usefulness immediately. Native configuration is
recomposed next wave; fresh runs/imports create no residual bodies or authority.
Unchanged inputs replay exactly under the current ordinary and locked replay
policies. No snapshot/save migration, additional saved tuning or persistence field.

## Shared corpse transaction

Vines join the existing CE/PE/Redemption FIFO; never create a second pool or copy
one body per consumer. Collection may activate for a properly bound corpse vine.
Only actual current-wave primary enemy monster deaths qualify, after complete
existing death/orb/reflection closure. Keep initial-dead, enemy summon/hero/merc,
owner-orphan-only and duplicate-death exclusions; no preloaded supply. Dead reward
units remain intact. No cross-wave corpse carry or terminal-battle bonus action.

On a vine action, stage valid positive useful capped recovery before shifting one
oldest token, then emit truthful localized consumption and normal HP/MP updates.
Consume exactly once, without RNG/refund. CE/PE, Redemption and other qualified
vines compete in the existing scheduler/pulse order, including same-time ties.
Full-resource or dead-owner vines leave the token available to the next consumer.

## Proof and publication

Preserve the original native eight-case RED and pass identical assertions using
a separate GREEN output filename. Before behavior code, write causal RED tests
for actual Blind hit changes/expiry/magical negative controls, actual poison HP/
rank/timing/miss/refresh, and vine actual recovery beyond orbs/one-body consumption.
Include shared-consumer competition, full/empty/zero/dead/invalid/CC/deadline and
primary/orphan death boundaries. Verify native aliases, class/unlock/cap/selected/
prerequisites, preloads, source overrides, wave/carry/replay/immutability and all
seven rank1/2/20 stats/caps/payments. Strict schema/loader rejects missing, foreign,
nonfinite/fractional/out-of-bounds/extra fields; all previous Druid stat bytes match.

Pure current/next/MAX previews and both locales show actual stats, cap, one-batch
payment, Blind/Poison and corpse recovery rules. Production public allocation,
selection, actual positive effects and five-domain Save-close-Continue cover both
locales/mobile/desktop, with required geometry and selected visual review. Native
synthetic fixtures establish mechanics, not earned campaign or balance. Final
engine/full/types/lint/clean explicit-false build/bridge/precache, frozen source/
build/Git/genuine maps and actual committed blob audit precede seven-row credit.
Keep all213 IDs/order. Archive original failures and exact task-owned cleanup.
C2-C4/fullG0-G7 and complete privatev1 remain open throughout this batch.

Security check: pass. First-party local combat/data/UI, without credentials,
network/dependency/CI/permission changes. Validate immutable JSON and transient
native ownership; no save migration or external publication. Plan review: ready
after requiring actual effects, one shared finite pool, action/CC boundaries,
source-qualified runtime IDs and unchanged template stats. This is author
self-review, not independent design/QA acceptance.
