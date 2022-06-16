import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Combat} from "../../controller/combat";
import {Monster} from "../../model/monster";
import {Character} from "../../model/character";
import "../creature/monster";
import "../creature/character";

@customElement('view-battleground')
export default class BattleGround extends LitElement {
  static styles = css`
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

  combat: Combat | null = null;

  @property({type: String})
  name = "";

  @property({type: Boolean})
  trigger = true;
  render() {
    this.combat = new Combat();
    return html`
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

  private _renderCreatures(combat: Combat, side: "monster" | "player") {
    let creatures: Array<Array<Monster | Character | null>> = side === "monster" ? combat.monsters : combat.characters;
    return creatures.map(row => {
        return html`<div class="row">
          ${row.map(creature => {
            if (creature) {
              if (creature.constructor.name === Monster.name) {
                return html`<model-monster 
                .monster=${<Monster> creature} 
                .combat=${this.combat}></model-monster>`
              } else if (creature.constructor.name === Character.name) {
                return html`<model-character
                .character=${<Character> creature} 
                .combat=${this.combat}></model-character>`
              } else return null;
            }
            else return null;
          })}
        </div>`
      })

  }
  private _startBattle() {

    console.log(this)
    this.render();
  }

  private _newBattle() {
    this.trigger = !this.trigger;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'view-battleground': BattleGround;
  }
}
