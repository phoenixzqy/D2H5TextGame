import { LitElement } from 'lit';
import { Combat } from "../../controller/combat";
import "../creature/monster";
import "../creature/character";
export default class BattleGround extends LitElement {
    static styles: import("lit").CSSResultGroup;
    combat: Combat | null;
    name: string;
    trigger: boolean;
    render(): import("lit-html").TemplateResult<1>;
    private _renderCreatures;
    private _startBattle;
    private _newBattle;
}
declare global {
    interface HTMLElementTagNameMap {
        'view-battleground': BattleGround;
    }
}
//# sourceMappingURL=battleground.d.ts.map