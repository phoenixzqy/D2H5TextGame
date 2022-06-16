import { LitElement } from 'lit';
export declare class Monster extends LitElement {
    static styles: import("lit").CSSResultGroup;
    log: string[];
    name: string;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'model-monster': Monster;
    }
}
//# sourceMappingURL=monster.d.ts.map