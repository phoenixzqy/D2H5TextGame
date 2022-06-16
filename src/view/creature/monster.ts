import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Monster, MonsterTypes} from "../../model/monster";
import {Combat} from "../../controller/combat";

@customElement('model-monster')
export default class ModelMonster extends LitElement {
  static styles = css`
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

  @property({type: Number})
  hpPercent = 1; // hp percentage left

  @property({
    converter: (v) => {
      if (v !== null && typeof v === "object") return <Monster> v;
      return null;
    }
  })
  monster: Monster | null = null;

  @property({
    converter: (v) => {
      if (v !== null && typeof v === "object") return <Combat> v;
      return null;
    }
  })
  combat: Combat | null = null;

  render() {
    if (this.monster === null || this.combat === null) return "Invalid monster or combat obejct";
    return html`
      <div>
        <span class="name ${this._renderMonsterTypeClass()}">${this.monster.name}</span>
        <div class="hp-bar" ></div>
        <div class="hp-bar-remaining" style="${this._renderHpStyle()}"></div>
      </div>
    `;
  }

  private _renderHpStyle() {
    let color = "";
    if (this.hpPercent > 0.5) color = "green";
    else if (this.hpPercent > 0.2) color = "yellow";
    else color = "red";
    return `background: ${color}; width: ${this.hpPercent * 100}%`;
  }

  private _renderMonsterTypeClass() {
    if (this.monster === null) return;
    if (this.monster.type === MonsterTypes.Normal) return "type-normal";
    else if (this.monster.type === MonsterTypes.Elite) return "type-elite";
    else return "type-boss";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'model-monster': ModelMonster;
  }
}
