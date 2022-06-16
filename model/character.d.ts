import { Creature, CreatureAttributes } from './creature';
export interface CharactorAttributes extends CreatureAttributes {
    class: string;
}
export declare class Character extends Creature {
    class: string;
    constructor(attributes: CharactorAttributes);
}
//# sourceMappingURL=character.d.ts.map