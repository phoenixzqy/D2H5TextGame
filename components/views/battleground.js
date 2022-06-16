var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let BattleGround = class BattleGround extends LitElement {
    constructor() {
        super(...arguments);
        this.monsters = [];
        this.player = []; // player side may contain plar and his creatures
        this.name = "冰冷之原";
    }
    render() {
        return html `
      <h3>战斗地图: ${this.name}</h3>
      <div class="monster-side"></div>
      <div class="player-side"></div>
    `;
    }
};
BattleGround.styles = css `
    :host {
      display: grid;
      padding: 20px;
      position: relative;
      box-sizing: border-box;
      width: 100%;
      height: 70vh;
      border: 1px solid #aaa;
    }
    .monster-side {
      display: grid;
      width: 100%;
      height: 200px;
      background-color: #eee;
      position: absolute;
      top: 100px;
      left: 0;
    }
    .player-side {
      display: grid;
      width: 100%;
      height: 200px;
      background-color: #eee;
      position: absolute;
      bottom: 50px;
      left: 0;
    }
  `;
__decorate([
    property({ type: Array() })
], BattleGround.prototype, "monsters", void 0);
__decorate([
    property({ type: Array() })
], BattleGround.prototype, "player", void 0);
__decorate([
    property({ type: String })
], BattleGround.prototype, "name", void 0);
BattleGround = __decorate([
    customElement('view-battleground')
], BattleGround);
export { BattleGround };
//# sourceMappingURL=battleground.js.map