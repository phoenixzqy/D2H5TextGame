import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Character} from "../../model/character";
import {Combat} from "../../controller/combat";

@customElement('model-character')
export default class ModelCharacter extends LitElement {
  static styles = css`
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

  @property()
  character: Character | null = null;

  @property()
  combat: Combat | null = null;

  @property({type: Number})
  hpPercent = 1; // hp percentage left

  render() {
    if (this.character === null || this.combat === null) return "Invalid Character or Combat object";
    return html`
      <div>
        <span class="name">${this.character.name}</span>
        <div class="hp-bar" />
        <div class="hp-bar-remaining" style="${this._renderHpStyle()}"/>
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

}

declare global {
  interface HTMLElementTagNameMap {
    'model-character': ModelCharacter;
  }
}

