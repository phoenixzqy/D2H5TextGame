export var MonsterTypes;
(function (MonsterTypes) {
    MonsterTypes["Normal"] = "normal";
    MonsterTypes["Elite"] = "elite";
    MonsterTypes["Boss"] = "boss";
})(MonsterTypes || (MonsterTypes = {}));
export class Monster {
    constructor(json) {
        this.data = json;
        // TODO: use data imported from JSON to generate a monster.
        // NOTE: <MonsterData> Json.fallen <--- json is parsed json data with "any" type
    }
}
//# sourceMappingURL=monster.js.map