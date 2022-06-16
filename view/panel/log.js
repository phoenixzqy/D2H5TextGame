var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let ViewLog = class ViewLog extends LitElement {
    constructor() {
        super(...arguments);
        this.log = []; // player side may contain plar and his creatures
        this.limit = 1000;
    }
    render() {
        return html `
      <h3>Log</h3>
      <div class="log">${this.log.map(msg => html `<p>${msg}</p>`)}</div>
    `;
    }
    addLog(msg) {
        while (this.log.length >= this.limit)
            this.log.shift();
        this.log.push(msg);
    }
};
ViewLog.styles = css `
    :host {
      display: grid;
      padding: 20px;
      position: relative;
      box-sizing: border-box;
      width: 100%;
      height: 25vh;
      border: 1px solid #aaa;
      border: 3px solid #aaa;
      bottom: 0;
      left: 0;
    }
    p {
      margin: 0;
    }
  `;
__decorate([
    property({ type: Array })
], ViewLog.prototype, "log", void 0);
__decorate([
    property({ type: Number })
], ViewLog.prototype, "limit", void 0);
ViewLog = __decorate([
    customElement('view-log')
], ViewLog);
export { ViewLog };
export function getLoggerElement() {
    return document.querySelector("view-log");
}
//# sourceMappingURL=log.js.map