import { LitElement } from 'lit';
import { Character } from "../../model/character";
import { Combat } from "../../controller/combat";
export default class ModelCharacter extends LitElement {
    static styles: import("lit").CSSResultGroup;
    character: Character | null;
    combat: Combat | null;
    hpPercent: number;
    render(): import("lit-html").TemplateResult<1> | "Invalid Character or Combat object";
    private _renderHpStyle;
}
declare global {
    interface HTMLElementTagNameMap {
        'model-character': ModelCharacter;
    }
}
//# sourceMappingURL=character.d.ts.map