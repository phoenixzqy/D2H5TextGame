import {Monster, MonsterAttributes, MonsterTypes} from "../model/monster";
import {Character, CharactorAttributes} from "../model/character";

const combatConfig = {
    eliteChance : 0.05, // the chance to generate an elite
    size: {
      row: 3,
      column: 9,
      min_each_row: 2
    }
}

function isElite() {
  return Math.random() <= combatConfig.eliteChance;
}
export class Combat {
  // each side has max of 3 rows and 10 columns
  monsters: Array<Array<Monster | null>>;
  characters: Array<Array<Character | null>>; // including characters, summoned monsters and mercenary

  constructor() {
    // combat will be a 9 * 3 vs 9 * 3
    this.monsters = [[],[],[]];
    this.characters = [[],[],[]];
    // generate player
    // range play is always lays at middle back row
    this.characters[2].push(new Character(<CharactorAttributes> {
        name: "Felix",
        class: "sor",
        hp: 1000,
        attackLow: 50,
        attackHigh: 80,
        attackSpeed: 1.5
      }));
    
    // generate monsters
    // 1. random number of monsters in each row. 
    // 2. insert monsters from the middle cell of each row
    // 3. monster type should be randomed
    for (let i = 0; i < combatConfig.size.row; i++) {
      let monsterNum = Math.floor(Math.random() * (combatConfig.size.column - combatConfig.size.min_each_row)) + combatConfig.size.min_each_row;
      for(let j = 0; j < monsterNum; j++) {
        let isEliteMonster = isElite();
        this .monsters[i].push(new Monster(<MonsterAttributes> {
          name: "沉沦魔",
          type: isEliteMonster ? MonsterTypes.Elite : MonsterTypes.Normal,
          hp: isEliteMonster ? 500 : 100,
          attackLow: isEliteMonster ? 20 : 5,
          attackHigh: isEliteMonster ? 50 : 10,
          attackSpeed: isEliteMonster ? 2 : 3.5,
        }));
      }
    }
  }

}
