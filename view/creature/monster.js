var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { MonsterTypes } from "../../model/monster";
let ModelMonster = class ModelMonster extends LitElement {
    constructor() {
        super(...arguments);
        this.hpPercent = 1; // hp percentage left
        this.monster = null;
        this.combat = null;
    }
    render() {
        if (this.monster === null || this.combat === null)
            return "Invalid monster or combat obejct";
        return html `
      <div>
        <span class="name ${this._renderMonsterTypeClass()}">${this.monster.name}</span>
        <div class="hp-bar" ></div>
        <div class="hp-bar-remaining" style="${this._renderHpStyle()}"></div>
      </div>
    `;
    }
    _renderHpStyle() {
        let color = "";
        if (this.hpPercent > 0.5)
            color = "green";
        else if (this.hpPercent > 0.2)
            color = "yellow";
        else
            color = "red";
        return `background: ${color}; width: ${this.hpPercent * 100}%`;
    }
    _renderMonsterTypeClass() {
        if (this.monster === null)
            return;
        if (this.monster.type === MonsterTypes.Normal)
            return "type-normal";
        else if (this.monster.type === MonsterTypes.Elite)
            return "type-elite";
        else
            return "type-boss";
    }
};
ModelMonster.styles = css `
    :host {
      display: inline-block;
      position: relative;
      height: 70px;
      width: 100px;
      border: 1px solid #d49e43;
      margin-right: 5px;
      background: #260601;
      position: relative;
    }
    .hp-bar {
      display: block;
      height: 5px;
      width: 100%;
      background: #333;
      position: absolute;
      top: 0;
      left: 0;
    }
    .hp-bar-remaining {
      display: block;
      height: 5px;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
    }
    .name {
      font-size: 12px;
      display: inline-block;
      position: absolute;
      top: 5px;
      left: 0px;
      padding: 0 5px;
    }
    .type-normal {
      color: #eee;
    }
    .type-elite {
      color: #ac8844;
      background: radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(106, 74, 14, 0.72) 0%, rgba(255,255,255,0) 100%);
    }
    .type-boss {
      color: #b37706;
    }
  `;
__decorate([
    property({ type: Number })
], ModelMonster.prototype, "hpPercent", void 0);
__decorate([
    property({
        converter: (v) => {
            if (v !== null && typeof v === "object")
                return v;
            return null;
        }
    })
], ModelMonster.prototype, "monster", void 0);
__decorate([
    property({
        converter: (v) => {
            if (v !== null && typeof v === "object")
                return v;
            return null;
        }
    })
], ModelMonster.prototype, "combat", void 0);
ModelMonster = __decorate([
    customElement('model-monster')
], ModelMonster);
export default ModelMonster;
//# sourceMappingURL=monster.js.map