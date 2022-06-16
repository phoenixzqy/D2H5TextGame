var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
// components
import './view/panel/battleground';
import './view/panel/log';
let D2H5Game = class D2H5Game extends LitElement {
    constructor() {
        super();
    }
    render() {
        return html `
      <view-battleground name="冰冻之原"></view-battleground>
      <view-log></view-log>
    `;
    }
};
D2H5Game.styles = css `
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
D2H5Game = __decorate([
    customElement('d2-h5-game')
], D2H5Game);
export { D2H5Game };
//# sourceMappingURL=d2-h5-game.js.map