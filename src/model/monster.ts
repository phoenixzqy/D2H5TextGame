export enum MonsterTypes {
  Normal = "normal",
  Elite = "elite",
  Boss = "boss",
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

export interface MonsterData  {
  name: string;
  base: MonsterStatus;
  growth: MonsterStatus;
}

export class Monster{

  data: MonsterData;

  constructor(json: MonsterData) {
    this.data = json;
    // TODO: use data imported from JSON to generate a monster.
    // NOTE: <MonsterData> Json.fallen <--- json is parsed json data with "any" type
  }
}
