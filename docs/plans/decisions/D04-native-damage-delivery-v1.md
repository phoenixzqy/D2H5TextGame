# D04 — Explicit native damage delivery

Status: independently approved contract; native checkpoints A/B implemented and
verified; broader acceptance remains open. Parent: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.

Mercenary Frozen Armor promises +120 self Defense and Chill on melee. Neither
physical damage nor `basicHit` identifies contact: arrows can be physical,
Hydra uses the basic pipeline, and elemental weapon blows can make contact.
An explicit JSON manifest therefore classifies native skills, weapon basics,
monster basics and summon bodies. Unknown delivery stays unknown.

The closed Ajv2020 schema permits whole-skill `melee`, `primary-melee`, `ranged`
and `spell` decisions. The basic projection also permits `none` for bound
nonattacking bodies. The manifest covers 287 native skill entries, all14 weapon
types, all109 bundled monster basics and19 default summon templates plus bound
Hydra/Decoy. The retained `amazon.piercing_strike` compatibility stub is explicitly
ranged: skills-spec identifies it as Strafe. Damage effects, skill identities,
enumerable semantics are preserved by delivery classification. B adds paid Armor
Defense and Chill; unrelated damage/RNG mechanics and existing settlement rules
remain unchanged. The reaction adds no RNG draw.

Private registry WeakMaps capture each original native source baseline once,
then carry authority only from unchanged references installed by that defaults
invocation through final projectile-flight projection. Resolution requires the
exact currently registered object and unchanged full structural semantics,
including array length and optional own fields. Custom same-ID replacements,
surviving custom aliases, changed imported sources and stale projectile clones
remain unknown. Reload never refreshes a baseline from a mutated source.

Basic projection consults original equipment. Verified empty equipment is
melee; missing legacy equipment, unknown/nonweapon bases and missing weapon
metadata are unknown. Bow/crossbow/throwing are ranged; the other11 types,
including staff/wand/scepter/orb, have ordinary melee blows. Current item bases
cover12 types; no dagger/orb base is invented. An actual unequipped Rogue's
fallback is melee while her native Arrow skills remain ranged. Unknown fields
are omitted from fresh CombatUnits; no delivery enters DerivedStats or saves.

Monster basics require exact structural equality with an immutable copy of the
bundled definition. Exactly six are ranged: Act1 Dark Archer, Dark Ranger,
Coldcrow, Returned Archer and Blood Raven, plus Act2 Burning Dead Archer. Other
bundled bodies explicitly have melee fallback blows, including caster bodies
and Quill Rat/Spike Fiend bites. Changed same-ID/custom definitions stay unknown.
Monster-derived summons preserve the actual monster disposition. Generic Revive
currently uses its own melee template rather than copying a corpse archetype.

Built-in summon factories alone supply template dispositions. Skeletons,
all four golems, Valkyrie, ravens, wolves, Grizzly, vines, shadow basic fallbacks,
generic revived bodies and minions are melee; Skeletal Mage is spell. Custom
factory replacement does not gain authority from a template name. Provisional
Spirit of Barbs, Hydra and Decoy remain unclassified.

## Native checkpoints and remaining acceptance

Independent review approves two implementation checkpoints. A establishes
metadata/projections and regression evidence. B adds actual strike dispatch,
authenticated bound special-body classification and mercenary Frozen Armor
contact assertions together. Both native checkpoints are implemented; their
validation and remaining acceptance are recorded in
[the evidence](../evidence/native-damage-delivery.md).

For B, weighted components form one strike; hitSequence attempts are separate.
Whirlwind/Fend contact each direct recipient. Lightning Strike/Dragon Tail bind
contact to the first original resolved recipient before any settlement; a miss,
death or skipped target never transfers contact to chain/splash recipients.
Projectile impact, auras, periodic damage, reflection, armor reactions, auxiliary
bolts and martial releases cannot contact. Bound Hydra is spell; authenticated
Spirit/Decoy are nonattacking. Preserve the existing player Frozen Armor
predicate and existing settlement rules. Preserve unrelated targeting,
scheduling, resource and status behavior; the new reaction adds no RNG draw.

The existing H3 terminal failed-no-app and retained evidence boundaries remain.
No browser, earned play, campaign pacing, balance, soak or full-v1 acceptance is
established by native classification tests.
