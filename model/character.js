import { Creature } from './creature';
export class Character extends Creature {
    // viewElement: /** @type {ModelCharacter} */ ModelCharacter | null;
    constructor(attributes) {
        super(attributes);
        this.class = attributes.class;
    }
}
//# sourceMappingURL=character.js.map