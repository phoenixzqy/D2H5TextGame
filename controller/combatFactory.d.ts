import { Monster } from "../model/monster";
import { Character } from "../model/character";
import BattleGround from "../view/panel/battleground";
export declare class Combat {
    monsters: Monster[][];
    characters: Character[][];
    viewElement: BattleGround | null;
    constructor();
    startCombat(): void;
    initBattleGround(): void;
}
//# sourceMappingURL=combatFactory.d.ts.map