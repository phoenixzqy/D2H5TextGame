import { Monster } from "../model/monster";
import { Character } from "../model/character";
import { MonsterTypes } from "../model/monster";
import Logger from "../controller/logger";
export class Combat {
    constructor() {
        this.monsters = [[], [], []];
        this.characters = [[], [], []];
        // generate monsters
        for (let i = 0; i < 3; i++) { // 3 rows
            let numOfMonster = Math.floor(Math.random() * 10) + 1;
            for (let j = 0; j < numOfMonster; j++) {
                let monsterAttr = {
                    name: "沉沦魔",
                    hp: 500,
                    attackLow: 10,
                    attackHigh: 13,
                    attackSpeed: 2,
                    type: MonsterTypes.Normal,
                };
                this.monsters[i].push(new Monster(monsterAttr));
            }
        }
        let charAttr = {
            name: "野蛮人",
            hp: 1500,
            attackLow: 100,
            attackHigh: 200,
            attackSpeed: 1,
        };
        this.characters[2].push(new Character(charAttr));
        // view
        let tmpl = document.createElement('template');
        tmpl.innerHTML = `<view-battleground></view-battleground>`;
        this.viewElement = /** @type {BattleGround} */ (tmpl.content.querySelector("view-battleground"));
        console.log(tmpl.content.querySelector("view-battleground"));
        console.log(tmpl.content.cloneNode(true));
        if (this.viewElement) {
            for (let i in this.characters) {
                for (let char of this.characters[i]) {
                    this.viewElement.addCharacter(parseInt(i), char.viewElement);
                }
            }
            for (let i in this.monsters) {
                for (let monster of this.monsters[i]) {
                    this.viewElement.addMonster(parseInt(i), monster.viewElement);
                }
            }
            this.viewElement.name = "冰冷之原";
            this.viewElement.render();
        }
    }
    startCombat() {
        Logger.log("----------------- 战斗开始！ ----------------");
        for (let i in this.characters) {
            for (let char of this.characters[i]) {
                char.startCombat(this.monsters);
            }
        }
        for (let i in this.monsters) {
            for (let monster of this.monsters[i]) {
                monster.startCombat(this.characters);
            }
        }
        // start an interval to check if the combat is over.
        let interval = window.setInterval(() => {
            for (let i in this.characters) {
                for (let char of this.characters[i]) {
                    if (char.hpRemaining > 0)
                        return;
                }
            }
            for (let i in this.monsters) {
                for (let monster of this.monsters[i]) {
                    if (monster.hpRemaining > 0)
                        return;
                }
            }
            Logger.log("战斗结束！");
            window.clearInterval(interval);
        }, 1000);
    }
    initBattleGround() {
        let appRoot = window.document.querySelector("d2-h5-game");
        if (appRoot === null || !appRoot.shadowRoot)
            return;
        let containerEle = appRoot.shadowRoot.querySelector("#panel");
        console.log(this.viewElement);
        if (containerEle) {
            containerEle.appendChild(this.viewElement);
        }
    }
}
//# sourceMappingURL=combatFactory.js.map