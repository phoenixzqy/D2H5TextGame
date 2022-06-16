export declare enum MonsterTypes {
    Normal = "normal",
    Elite = "elite",
    Boss = "boss"
}
interface MonsterResistance {
    cold: number;
    fire: number;
    lightning: number;
    magic: number;
    physical: number;
    posion: number;
}
interface MonsterStatus {
    life: Array<number>;
    attack: Array<number>;
    attackRating: number;
    defense: number;
    blockRate: number;
    exp: number;
    resistance: MonsterResistance;
}
export interface MonsterData {
    name: string;
    base: MonsterStatus;
    growth: MonsterStatus;
}
export declare class Monster {
    data: MonsterData;
    constructor(json: MonsterData);
}
export {};
//# sourceMappingURL=monster.d.ts.map