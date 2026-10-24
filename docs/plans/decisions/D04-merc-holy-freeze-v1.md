# D04 — Native mercenary Holy Freeze

Local implementation contract; independent design/source/QA acceptance pending.
Implements `gacha-spec.md` §4.1's slow and20% cold bonus without changing other
mercs, the player's Paladin aura selection or the campaign encounter planner.

- The actual `mercs/act2-holy-freeze` owned merc with its native aura and eligible
  level receives a transient factory-owned source marker. A forged skill bar,
  buff or another merc identity never grants it. Only a living player-side merc
  without summon/owner metadata can supply the presence; stun/freeze do not
  interrupt an always-on aura. Dead mercs never supply it.
- Presence supplies continuous, wave-local Chill to every living enemy. It uses
  the existing authored0.5 Attack Speed multiplier **before** cadence flooring
  and400–2000ms clamps, not a separate scheduler formula. Ordinary timed Chill
  and multiple sources do not multiply the slow. Timed status contents/clocks
  remain intact underneath, and reappear normally after source loss.
- The active status view and ordinary direct-hit Chill combo matrix see the
  same presence. Source loss clears derived presentation and reconciles pending
  action phase immediately. No aura-generated permanent Chill is written to
  persisted ownership or carried into another wave.
- The JSON row owns20 percentage points of additive increased direct cold
  damage for living player-side party members, including native summons. It
  combines with existing increases before combo/crit/resistance/MR/flooring.
  No added cold hit, direct damage pulse, other damage-type increase, healing,
  resource refill, action, cooldown or RNG draw is manufactured by the aura.
- Rank1 through the merc row's cap20 have the same aura potency; star/rank
  progression and player Holy Freeze remain separate unfinished contracts.
- No saved shape/version changes. Owned mercs and raw historical gear/stat
  payloads remain unchanged; current factories project the effect per wave.

Acceptance: causal engine/native-factory RED→GREEN, strict schema/definition
boundaries, source-death and timed-Chill overlap, party damage/combos and invalid
sources, replay/input immutability, next-wave source removal, retained native
same-input before/after screens, bilingual five-size production inspection.
Then evaluate a legal owned adaptation before any genuine attempt272. Never
promote diagnostic wins to earned state or replay an actual failed attempt.

[Local implementation and verification](../evidence/d04-merc-holy-freeze.md).
