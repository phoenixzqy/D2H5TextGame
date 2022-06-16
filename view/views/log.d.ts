import { LitElement } from 'lit';
export declare class Log extends LitElement {
    static styles: import("lit").CSSResultGroup;
    log: string[];
    limit: number;
    render(): import("lit-html").TemplateResult<1>;
    addLog(msg: string): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'view-log': Log;
    }
}
//# sourceMappingURL=log.d.ts.map