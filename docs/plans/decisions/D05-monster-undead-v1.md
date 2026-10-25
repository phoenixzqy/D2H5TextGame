# D05 — Explicit authored undead identity v1

Local content/engine decision for Sanctuary. Independent design/QA and earned
balance remain open. Classification support alone does not complete Sanctuary.

## Authority and compatibility

Every current monster row explicitly authors boolean `undead`. Only literal
true is copied to the transient CombatUnit marker. Names, translated names,
archetype IDs, instance IDs, skills, tier and visuals never grant identity.
A legacy/custom definition with no field stays unclassified and ineligible for
undead-only effects; schema compatibility is retained. Non-boolean values fail
the data schema, and the factory never coerces a truthy direct input.
No persistent player/merc/save field is added; save remainsv22.

The reviewed current corpus has109archetypes:29undead and80other. All original
IDs, numeric stats, skills, resistances, rewards and ordering remain unchanged.
Future authored rows must state their classification explicitly; the corpus
regression enforces this even though legacy schema input may omit the field.

| Act | Total | Undead | Other |
| --- | --- | --- | --- |
| I | 41 | 13 | 28 |
| II | 38 | 11 | 27 |
| III | 10 | 0 | 10 |
| IV | 10 | 5 | 5 |
| V | 10 | 0 | 10 |

## Authored positive set

- Act I: Zombie, Corpsefire, Hungry Dead, Ghoul, Ghost, Wraith, Returned,
  Bone Warrior, Returned Archer, Burning Dead Mage, Bone Ash, Griswold,
  Blood Raven.
- Act II: Mummy, Greater Mummy, Burning Dead Archer, Horadrim Ancient,
  Ancient Kaa, Radament, Horror Mage, Cantor, Dark Elder, Undead Scavenger,
  Undead Flayer.
- Act IV: Abyss Knight, Stygian Doll, The Damned, Doom Caster, Oblivion Knight.

All other current rows explicitly author false. These lists are an authoring
record, not a runtime string-matching rule. JSON is the runtime authority.

## Resolving older lore hints

The [current Act I/II canonical mapping](../../design/monsters-act1-2-canon.md)
identifies Dark Archer/Dark Stalker as Corrupt Rogues and Tainted as its canonical
archetype. This decision authors those three as non-undead and reconciles the
older monster-spec hints that called them skeleton/undead. Blood Raven and
Griswold are explicitly undead unique enemies; sharing a Rogue or smith theme
does not propagate that identity to the rest of their families.

The later-act skeleton knights, exploding undead doll and spectral Doom Caster
are explicit local undead content decisions. The Damned retains its existing
[monster-spec](../../design/monster-spec.md) undead-soul identity. The living
jungle enemies, demons, fallen angel Izual and Act V guardians are not inferred
to be undead from dark, frozen, death or ancient wording. No general demon/beast
classification or damage-versus-other-family system is introduced.

## Verification boundary

Causal schema/factory failures precede implementation. Regressions cover the
complete authored positive set, explicit fields for every current row, strict
schema booleans, absent legacy input, malformed truthy direct input, arbitrary
names/IDs and identical RNG-derived units/stats with only the marker removed.
The original first test used an incorrect113total; actual corpus arithmetic is
41+38+10+10+10=109. That assertion is corrected without changing any content
or accepting an omitted classification. Original failed output is retained.

Sanctuary must still implement actual undead damage/control, source authority,
native wave/replay/save integration and truthful bilingual UI. Its functional
inventory disposition must remain unverified until that behavior is proven.
