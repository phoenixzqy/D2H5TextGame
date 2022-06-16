import { LitElement } from 'lit';
import { Monster } from "../../model/monster";
import { Combat } from "../../controller/combat";
export default class ModelMonster extends LitElement {
    static styles: import("lit").CSSResultGroup;
    hpPercent: number;
    monster: Monster | null;
    combat: Combat | null;
    render(): import("lit-html").TemplateResult<1> | "Invalid monster or combat obejct";
    private _renderHpStyle;
    private _renderMonsterTypeClass;
}
declare global {
    interface HTMLElementTagNameMap {
        'model-monster': ModelMonster;
    }
}
//# sourceMappingURL=monster.d.ts.map