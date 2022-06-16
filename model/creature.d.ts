export interface CreatureAttributes {
    name: string;
    hp: number;
    attackLow: number;
    attackHigh: number;
    attackSpeed: number;
}
export declare class Creature {
    name: string;
    hp: number;
    hpRemaining: number;
    attackLow: number;
    attackHigh: number;
    attackSpeed: number;
    constructor(attributes: CreatureAttributes);
}
//# sourceMappingURL=creature.d.ts.map