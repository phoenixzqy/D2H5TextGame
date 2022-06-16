import { LitElement } from 'lit';
export declare class ViewLog extends LitElement {
    static styles: import("lit").CSSResultGroup;
    log: string[];
    limit: number;
    render(): import("lit-html").TemplateResult<1>;
    addLog(msg: string): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'view-log': ViewLog;
    }
}
export declare function getLoggerElement(): /** @type {ViewLog} */ ViewLog | null;
//# sourceMappingURL=log.d.ts.map