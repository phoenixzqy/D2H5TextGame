import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('view-log')
export class ViewLog extends LitElement {
  static styles = css`
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

  @property({type: Array})
  log:string[] = []; // player side may contain plar and his creatures
  
  @property({type: Number})
  limit = 1000;

  render() {
    return html`
      <h3>Log</h3>
      <div class="log">${this.log.map(msg => html`<p>${msg}</p>`)}</div>
    `;
  }
  
  addLog(msg:string) {
    while(this.log.length >= this.limit) this.log.shift();
    this.log.push(msg);

  }
}

declare global {
  interface HTMLElementTagNameMap {
    'view-log': ViewLog;
  }
}

export function getLoggerElement(): /** @type {ViewLog} */ ViewLog | null {
  return document.querySelector("view-log");
}
