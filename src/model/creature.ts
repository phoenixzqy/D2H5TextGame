export interface CreatureAttributes {
  name: string;
  hp: number;
  attackLow: number;
  attackHigh: number;
  attackSpeed: number;
}

export class Creature {
  name: string;
  hp: number;
  hpRemaining: number;
  attackLow: number;
  attackHigh: number;
  attackSpeed: number;

  constructor(attributes: CreatureAttributes) {
    // TODO: validate attributes, like attach speed should have range
    this.name = attributes.name;
    this.hp = attributes.hp;
    this.hpRemaining = attributes.hp;
    this.attackLow = attributes.attackLow;
    this.attackHigh = attributes.attackHigh;
    this.attackSpeed = attributes.attackSpeed;
  }
}

