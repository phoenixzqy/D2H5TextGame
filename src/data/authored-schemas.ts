import quests from './schema/quest.schema.json';
import materials from './schema/materials.schema.json';
import economy from './schema/material-economy.schema.json';
import gems from './schema/gem-effects.schema.json';
import rune from './schema/rune.schema.json';
import runeword from './schema/runeword.schema.json';
import banner from './schema/banner.schema.json';
import merc from './schema/merc.schema.json';
import questItems from './schema/quest-item.schema.json';
import countedItems from './schema/counted-quest-item.schema.json';
import questActions from './schema/quest-action.schema.json';
import questUnique from './schema/quest-unique-profile.schema.json';
import questTable from './schema/quest-table-profile.schema.json';
import classes from './schema/class.schema.json';
import act5 from './schema/act5-runtime.schema.json';
import cow from './schema/cow-runtime.schema.json';
import endgame from './schema/endgame.schema.json';
import replay from './schema/replay-profiles.schema.json';
import anya from './schema/anya-vendor.schema.json';
import recipes from './schema/material-recipes.schema.json';
import respec from './schema/respec.schema.json';
import killXp from './schema/kill-xp.schema.json';
import mercXp from './schema/merc-xp.schema.json';

import mitigation from './schema/mitigation.schema.json';
import plague from './schema/plague.schema.json';
import chill from './schema/chill.schema.json';
import recovery from './schema/recovery.schema.json';
import manaBurn from './schema/mana-burn.schema.json';
import damageDelivery from './schema/damage-delivery.schema.json';
import mageSignatures from './schema/skeletal-mage-signatures.schema.json';
import traps from './schema/assassin-traps.schema.json';
import bloodGolem from './schema/blood-golem.schema.json';
import necromancerSummons from './schema/necromancer-summons.schema.json';
import shadowSkills from './schema/assassin-shadow-skills.schema.json';
import monsters from './schema/monster.schema.json';
import druidSummons from './schema/druid-summons.schema.json';
import fireGolem from './schema/fire-golem.schema.json';
import amazonSummons from './schema/amazon-summons.schema.json';
import assassinSummons from './schema/assassin-summons.schema.json';
import monsterSummons from './schema/monster-summons.schema.json';
import charges from './schema/assassin-charges.schema.json';
import flight from './schema/assassin-flight.schema.json';
import imageOverrides from './schema/image-overrides.schema.json';
import dialogue from './schema/dialogue.schema.json';
import equipmentGuarantees from './schema/equipment-guarantees.schema.json';
import chapterBossEquipment from './schema/chapter-boss-equipment.schema.json';
import chapterBossUniques from './schema/chapter-boss-uniques.schema.json';
import chapterBossFirstKills from './schema/chapter-boss-first-kills.schema.json';
import nonbossLoot from './schema/nonboss-loot.schema.json';
import minibossLoot from './schema/miniboss-loot.schema.json';

/** Complete original schemas used by the bounded browser precompilation group. */
export const authoredSchemas = {
  quests, materials, economy, gems, rune, runeword, banner,
  mercs: { type: 'array', minItems: 1, items: merc },
  questItems, countedItems, questActions, questUnique, questTable, classes,
  act5, cow, endgame, replay, anya, recipes, killXp, mercXp, equipmentGuarantees, chapterBossEquipment, chapterBossUniques, chapterBossFirstKills, nonbossLoot, minibossLoot,
  mitigation, plague, chill, recovery, manaBurn, damageDelivery, mageSignatures, traps, bloodGolem, necromancerSummons, shadowSkills, monsters, druidSummons, fireGolem, amazonSummons, assassinSummons, monsterSummons, charges, flight, imageOverrides, dialogue
};

/** These callers retain Ajv's default first-error behavior. */
export const authoredFirstErrorSchemas = { respec };
