var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Combat } from "../../controller/combat";
import { Monster } from "../../model/monster";
import { Character } from "../../model/character";
import "../creature/monster";
import "../creature/character";
let BattleGround = class BattleGround extends LitElement {
    constructor() {
        super(...arguments);
        this.combat = null;
        this.name = "";
        this.trigger = true;
    }
    render() {
        this.combat = new Combat();
        return html `
    <div trigger="${this.trigger}">
      <h3>战斗地图: ${this.name}</h3>
      <div class="monster-side">
        ${this._renderCreatures(this.combat, "monster")}
      </div>
      <div class="player-side">
        ${this._renderCreatures(this.combat, "player")}
      </div>
      <button class="start-button" @click="${this._newBattle}" style="right: 105px">New</button>
      <button class="start-button" @click="${this._startBattle}">Start</button>
    </div>
    `;
    }
    _renderCreatures(combat, side) {
        let creatures = side === "monster" ? combat.monsters : combat.characters;
        return creatures.map(row => {
            return html `<div class="row">
          ${row.map(creature => {
                if (creature) {
                    if (creature.constructor.name === Monster.name) {
                        return html `<model-monster 
                .monster=${creature} 
                .combat=${this.combat}></model-monster>`;
                    }
                    else if (creature.constructor.name === Character.name) {
                        return html `<model-character
                .character=${creature} 
                .combat=${this.combat}></model-character>`;
                    }
                    else
                        return null;
                }
                else
                    return null;
            })}
        </div>`;
        });
    }
    _startBattle() {
        console.log(this);
        this.render();
    }
    _newBattle() {
        this.trigger = !this.trigger;
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
      height: 240px;
      position: absolute;
      top: 60px;
      left: 0;
    }
    .player-side {
      display: grid;
      width: 100%;
      height: 240px;
      position: absolute;
      bottom: 50px;
      left: 0;
    }
    .start-button {
      height: 25px;
      width: 75px;
      position: absolute;
      bottom: 10px;
      right: 15px;
    }
    .row {
      height: 80px;
      display: flex;
      justify-content: center;
    }
    h3 {
      margin: 0;
      color: #D49E43;
    }
  `;
__decorate([
    property({ type: String })
], BattleGround.prototype, "name", void 0);
__decorate([
    property({ type: Boolean })
], BattleGround.prototype, "trigger", void 0);
BattleGround = __decorate([
    customElement('view-battleground')
], BattleGround);
export default BattleGround;
//# sourceMappingURL=battleground.js.map