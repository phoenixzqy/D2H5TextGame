var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let ModelCharacter = class ModelCharacter extends LitElement {
    constructor() {
        super(...arguments);
        this.character = null;
        this.combat = null;
        this.hpPercent = 1; // hp percentage left
    }
    render() {
        if (this.character === null || this.combat === null)
            return "Invalid Character or Combat object";
        return html `
      <div>
        <span class="name">${this.character.name}</span>
        <div class="hp-bar" />
        <div class="hp-bar-remaining" style="${this._renderHpStyle()}"/>
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
};
ModelCharacter.styles = css `
    :host {
      display: inline-block;
      position: relative;
      height: 70px;
      width: 100px;
      border: 1px solid #d49e43;
      margin-right: 5px;
      background: #0A0101;
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
      left: 5px;
      color: #ac8844;
    }
  `;
__decorate([
    property()
], ModelCharacter.prototype, "character", void 0);
__decorate([
    property()
], ModelCharacter.prototype, "combat", void 0);
__decorate([
    property({ type: Number })
], ModelCharacter.prototype, "hpPercent", void 0);
ModelCharacter = __decorate([
    customElement('model-character')
], ModelCharacter);
export default ModelCharacter;
//# sourceMappingURL=character.js.map