# D06 v1b — Preparation-only summons without external inputs

Status: accepted bounded policy; independent GD/TD and producer approved V2.
Runtime representation, tests, implementation and acceptance remain pending.
This card follows accepted battle-local identity in D06-summon-identity-v1; it does
not approve corpse handling, item-bound Iron Golem, fullD06/P09 or balance/campaign.
Root writes and executes in claimed umbrella worktree; every increment≤5paths,
commit before next; no remote publication. This first increment is contract-only.

## Authority and explicit decisions

Canonical Diablo2TextGame.md §5.2 requires summons fill their cap once at battle
start, without consuming ordinary actions or repeated summoning. Current skills-spec
§7.1 permits replacements, and combat.ts only creates one per startup cast and
later refills after deaths. deathEffects refunds the first summoning skill rather
than the deceased template/proven payment, also clearing its cooldown. These are
observed conflicts, not acceptance of a new resource economy.

Adopt the canonical start-only intent for the thirteen authored skills below.
Choose **one paid batch per skill per battle/wave**, using its existing actual
rank-adjusted mana cost once to fill its missing living template count. This is
an explicit v1 resource policy choice: the GDD establishes one startup release,
but does not independently settle per-unit versus per-batch payment. Alternative
per-unit payments/partial batches materially change affordability and are rejected
for this slice; no new numeric tuning or free full-mana refill is authorized.

## Exact first runtime scope

Canonical skills (authored IDs resolve through the existing alias registry):

- amazon.valkyrie
- assassin.shadow_warrior; assassin.shadow_master
- druid.summon_dire_wolf; druid.raven; druid.poison_creeper;
  druid.summon_spirit_wolf; druid.carrion_vine; druid.solar_creeper;
  druid.summon_grizzly
- necromancer.blood_golem; necromancer.clay_golem; necromancer.fire_golem

Excluded pending external-input contracts: necromancer.raise_skeleton,
necromancer.raise_skeletal_mage, necromancer.revive and necromancer.iron_golem.
Skeleton/Mage/Revive corpse requirements remain advertised requirements; no
unlimited corpses may be inferred from transient dead units. Iron Golem still
requires a selected eligible metal inventory instance. Neither requirement may
be replaced by a generic free template and claimed complete. Excluded skill runtime
retains its prior behavior until a reviewed later change, with no acceptance claim.
Other summon/control/utility semantics and synthetic registered skills are outside
this policy unless they explicitly opt into the same reviewed preparation contract.

## Caps, stacking, positions and eligibility

Use existing authored/resolved rank curves without tuning. Dire Wolf/Raven/Spirit
Wolf use first-three-then-every-three, rank1/2/3/6/20→1/2/3/4/8; singleton templates
remain1. Preserve owner+exacttemplate living counts and current coexistence; no
shared golem/wolf/shadow family exclusivity or new total-unit cap. Preserve existing
grid-position preference/fallback and battle-local collision-skipping identity.
Dead/preloaded IDs remain reserved; living preloaded summons retain all damage,
status, position and identity. Spawn only missing units; do not heal/reset existing.

Raise Skeleton's separate currently authored1/6/12→1/2/3 cap remains
unchanged, and stale skills-spec rows must be reconciled. This card does not tune
or behavior-accept the excluded Skeleton merely by fixing its documentation.

Production preparation includes only learned, level/prerequisite-eligible and
explicitly slotted summon skills, with authoritative allocated rank. Gear/source
eligibility follows existing adapters. Generic engine synthetic snapshots keep
legacy rank1 fallback only as a documented test/standalone compatibility rule;
it does not establish that an unlearned production player skill is eligible.
Do not silently broaden preparation to every learned unslotted skill.

## Preparation transaction and ordinary actions

One phase at simulation time0 per engine battle/wave, in stable existing owner then
skill order. Resolve authored/canonical aliases to one canonical skill, process
once even if duplicate slots use aliases. Dead owners do not prepare. Scoped preparation requires living units on both opposing sides and skips an
initially terminal battle. This is a new scoped policy: existing startup precedes
the winner loop and summon targets do not require an enemy. Preserve excluded and
synthetic startup behavior; do not claim the new terminal guard already exists.
For each eligible scoped skill, compute missing living count. Zero missing means
no cast, spawn, payment, resource event or cooldown change. Validate every required
template/input first; unknown template or invalid source produces no batch/debit.
Insufficient mana similarly creates no units, spends nothing, and is not retried
later even if regeneration/orbs make mana available. Valid sufficient payment is
atomic with the complete missing-count spawn; no partially paid/spawned batch.

Preparation ignores an old carried cooldown for that scoped summoning skill only.
It charges one existing rank-adjusted mana cost and records the normal cast/payment
and per-unit summon events at time0; preserve cast attribution and exact mana events.
Apply the ordinary resulting skill cooldown once, without waiting repeatedly to
fill cap. Do not clear unrelated cooldowns. New units receive existing stats,
passives, scheduling and positions. No ordinary turn or unrelated RNG draw is spent
on preparation; actual subsequent summoned-unit actions use normal seeded combat.

Scoped preparation skills are excluded from ordinary skill selection throughout
the battle, whether startup succeeded, failed, was already full or later summons
die. Choose the next usable active skill, then basic attack as existing rules say.
An authoritative preparation-enabled owner/template pair governs death behavior:
its matching new and preloaded summon deaths refund no mana and clear no cooldown.
Template identity alone is insufficient. A synthetic owner using the same template
without explicit preparation opt-in retains legacy refund behavior. The precise
representation needs later TD review before runtime edits. Do not remove the existing refund path globally
before its remaining excluded/synthetic callers receive their own reviewed change.
Keep death/orphan/status/orb ordering, recorded/unrecorded replay and input
immutability intact; do not suppress refund/replacement tests to reach green.

## Multi-wave and external inputs remain distinct

Current production rebuilds transient summons each wave and carries surviving
hero/merc resources (accepted D04 timing). A new wave is a new preparation phase
and pays its batch from actually carried mana. No carry refill, cooldown reset,
old summon persistence or full-resource-per-combat redesign is authorized here.

Corpse follow-up must choose pre-battle preparation abstraction versus finite
eligible corpse supply with identity/ownership/exactly-once consumption and replay
inputs. Iron follow-up must define selected instance identity, eligible metal
predicate, inherited stats, transaction timing, inventory loss/refund/death/save
ownership; replay must not consume inventory twice. Until those are accepted,
fullD06/P09/G2 and the excluded skills remain open.

## Ordered implementation and proof required later

This3doc contract increment changes only newcard, skills-spec §7/stalecaprows and
D06 design-decisions status. Freeze reviewed runtime/data/adapter/tests in later
≤5path increments before changes. Metadata/skill-policy representation needs TD
review; preserve data-authored tuning and avoid a new generic summon framework.

First freeze independent literal counts/time0/exactrankedMP for singleton and
multi-cap rank1/2/3/6/20, missingpartialpreload and zeromissing; both owners/templates,
authored/canonical duplicate aliases, stale summon cooldown versus unrelatedCD,
notlearned/notunlocked/prereq/unslotted production exclusions, insufficient resources,
invalid template refusal and no retry after regen/orb, deadowner/finishedbattle,
ordinaryactionfallback, death without replacement/refund, inputimmutability/full
recorded/unrecorded/A-A/A-B-A replay and collision-safe identity. Separate controls
retain excluded/synthetic prior behavior, including a same-template synthetic
owner without preparation opt-in, and every unrelated death/recovery path.
Record real RED before corresponding behavior change, preserve actual failures and
all oracle changes with design reasons. Run focused/engine/fullunits/types/lint/
cleanproductionbuild and required coverage within reviewed bounds. Productionbrowser
learning/combo/resources/save/mobile/i18n evidence follows runtime approval; imported
fixtures never count as earned campaign or balance acceptance. Existing15sunit
miss/buildwarnings are tracked, not waived as performance acceptance.
