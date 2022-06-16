import { LitElement } from 'lit';
export declare class BattleGround extends LitElement {
    static styles: import("lit").CSSResultGroup;
    monsters: never[];
    player: never[];
    name: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'view-battleground': BattleGround;
    }
}
//# sourceMappingURL=battleground.d.ts.map