import { Creature, CreatureAttributes} from './creature';



export interface CharactorAttributes extends CreatureAttributes {
  class: string;
}

export class Character extends Creature{

  class: string;
  // viewElement: /** @type {ModelCharacter} */ ModelCharacter | null;

  constructor(attributes: CharactorAttributes) {
    super(attributes);
    this.class = attributes.class;
  }
  
}

