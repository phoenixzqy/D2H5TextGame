import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
// components
import './view/panel/battleground'
import './view/panel/log';


@customElement('d2-h5-game')
export class D2H5Game extends LitElement {
  constructor() {
    super();
  }
  static styles = css`
    :host {
      display: grid;
      border: solid 1px gray;
      padding: 16px;
      width: 1024px;
      height: 100vh;
      box-sizing: border-box;
      margin: 0 auto;
    }
  `;
  render() {
    return html`
      <view-battleground name="冰冻之原"></view-battleground>
      <view-log></view-log>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'd2-h5-game': D2H5Game;
  }
}
