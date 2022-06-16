export class Creature {
    constructor(attributes) {
        // TODO: validate attributes, like attach speed should have range
        this.name = attributes.name;
        this.hp = attributes.hp;
        this.hpRemaining = attributes.hp;
        this.attackLow = attributes.attackLow;
        this.attackHigh = attributes.attackHigh;
        this.attackSpeed = attributes.attackSpeed;
    }
}
//# sourceMappingURL=creature.js.map