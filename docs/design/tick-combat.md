# Tick-Based Combat Scheduler

> **Status:** 🟡 DESIGN — owner: `game-designer` · implementers: `engine-dev`, `frontend-dev` · QA: `qa-engineer`
> **Source files affected:** `src/engine/combat/combat.ts`, `src/engine/turn-order.ts`, `src/engine/skills/effects.ts` (CDs), `src/data/schema/monster.schema.json`, `src/stores/combatStore.ts`, `src/stores/combatHelpers.ts`, `src/features/combat/CombatScreen.tsx`.

## 1. Summary

Replace the current "everyone acts once per round in attackSpeed-sorted order" loop with a **virtual-millisecond scheduler**. Each combatant has its own `attackIntervalMs`; the scheduler always advances time to whichever combatant has the earliest `nextActionAt`, that combatant acts, its clock is pushed forward, repeat. Determinism is preserved (one seed → one event sequence). The UI consumes events one-at-a-time with a minimum animation gate so a fast monster can't drown the player visually. CDs and DoT durations migrate from "rounds" to "milliseconds".

This solves user complaint #1 (combat finishes instantly) without breaking the engine's purity rules.

## 2. Model

### 2.1 Per-combatant fields (added)

```ts
interface CombatUnit {
  // existing fields...
  readonly attackIntervalMs: number; // base swing interval, before haste
  // cooldowns flip from "rounds" to "ms remaining":
  readonly cooldowns: Readonly<Record<string, number>>; // ms
  readonly statuses: readonly ActiveStatus[]; // .remainingMs replaces .remaining (turns)
}
```

`attackIntervalMs` is set when the unit is built (player from class baseline + IAS, monster from archetype JSON / fallback formula — see §5).

### 2.2 Scheduler state

```ts
interface SchedulerState {
  virtualTimeMs: number;                     // current clock; starts at 0
  nextActionAt: Map<UnitId, number>;         // each alive unit's next swing
  rng: Rng;                                  // single seeded RNG
  units: Map<UnitId, CombatUnit>;            // mutable battle state
}
```

Initial `nextActionAt[unitId] = unit.attackIntervalMs` for all combatants (everyone "winds up" their first swing; nobody acts at t=0 except summon-on-start, which fires at t=0 with the existing rules and emits events with `virtualTimeMs = 0`).

> **Why not start at 0?** A faster fighter still gets the first swing because their `attackIntervalMs` is smaller; starting everyone at their interval makes the math symmetric and avoids "round 1 free hit" weirdness.

### 2.3 Step algorithm (pure, deterministic)

```
step(state): yields BattleEvent*
  1. If terminal (winner decided or maxVirtualMs exceeded): emit {kind:'end', ...}; return.
  2. activeIds = [id for id in state.units if alive(unit) and nextActionAt has entry]
  3. t* = min over activeIds of nextActionAt[id]
  4. actorId = lexicographically smallest id among activeIds whose nextActionAt == t*
       // tie-break — deterministic, RNG-free, see §3
  5. state.virtualTimeMs = t*
  6. Tick statuses on actor: decrement remainingMs by (t* - lastTickAt[actorId]).
       Apply DoT damage proportional to elapsed ticks (see §2.5). Emit dot/death events.
  7. If actor still alive and not stunned/immobilized:
       a. cooldowns[actor] -= elapsed since its last action; clamp ≥0.
       b. choose action (skill if any priority entry has cooldownMs ≤ 0 and resource ok and target valid; else basic attack).
       c. Apply action — emit events as today (action, damage, status, buff, summon, heal, death, orb, enrage).
       d. Started skill → cooldowns[actor][skillId] = skill.cooldownMs.
  8. Compute haste:  hasteMul = 1 + iasFraction(actor)  (clamp 0.25..3.0)
     nextActionAt[actorId] = t* + actor.attackIntervalMs / hasteMul
       // skill that locks animation can override: nextActionAt += skill.castTimeMs (default = attackIntervalMs).
  9. If actor died this step (e.g., thorns kill), remove from nextActionAt.
  10. Re-check winner; if decided, emit {kind:'end'} and stop.
```

All events emitted in step N must carry `virtualTimeMs = t*` (the same value), so a UI can group "what happened at this instant" cleanly.

### 2.4 Cooldown migration: rounds → ms

Existing skill data declares `cooldown: <rounds>`. We add `cooldownMs` and migrate by:

```
cooldownMs = round(cooldown * AVG_INTERVAL_MS)   where AVG_INTERVAL_MS = 1200
```

So a skill with `cooldown: 3` rounds becomes `cooldownMs: 3600`. The skill JSON schema gets an additive `cooldownMs?: number` field; if absent, the engine auto-fills from `cooldown * 1200` at registry-load time. Content authors can override per-skill (e.g. Frozen Orb might keep a tighter `cooldownMs: 2500` regardless of attack speed).

**Invariant** (from `Diablo2TextGame.md` §5.2): `cooldownMs >= 1000`. Engine enforces a floor.

### 2.5 Status durations

Same conversion: `status.remainingMs = remainingTurns * 1200`. DoT damage applies *per tick boundary*. We define a fixed **DoT tick = 500 ms**. When the scheduler crosses one or more 500ms boundaries since the unit's last DoT processing, it applies one DoT instance per boundary crossed:

```
dotTicksThisStep = floor(virtualTimeMs / 500) - floor(lastDotTickAt[id] / 500)
```

This guarantees DoT damage stays per-second-rate stable regardless of who's swinging fastest.

### 2.6 Termination

* Winner decided → emit `end`, stop.
* `virtualTimeMs > MAX_VIRTUAL_MS` (default `120_000` = 2 in-fiction minutes) → emit `end` with `winner: null`. Replaces the current `maxRounds: 100` guard.

## 3. Determinism

* **Single seed → single event sequence.** All RNG goes through `state.rng` (one seed, the `CombatSnapshot.seed`). Forks may be used inside `resolveDamage`, status, etc., as today.
* **Tie-break for equal `nextActionAt`:** lexicographic ascending `combatantId`. Deterministic and RNG-free. This intentionally differs from `calculateTurnOrder`'s RNG tie-break (kept only for legacy round-mode tests). Document in `turn-order.ts` doc comment that it's deprecated for tick mode.
* **No floating-point time.** `virtualTimeMs`, `nextActionAt`, `attackIntervalMs`, `cooldownMs`, `remainingMs` are all **integers**. Haste division uses `Math.round(interval / hasteMul)` with a floor of 50 ms.
* **No `Date.now()`, no `Math.random()`.** Both are forbidden in `engine/` already (copilot-instructions §3); reaffirmed here.

## 4. Event stream API

### 4.1 Generator form (preferred)

```ts
// engine/combat/scheduler.ts
export interface BattleEventWithTime extends BattleEvent {
  readonly virtualTimeMs: number;
}

export function* runBattleStream(snapshot: CombatSnapshot): Generator<BattleEventWithTime, CombatResult, void> { ... }
```

Consumers (UI, sim, AI test) iterate. The generator yields one event at a time and finally returns the `CombatResult`. Pure: pull again with the same seed → same yields.

### 4.2 Backwards-compat batch form

```ts
export function runBattle(snapshot: CombatSnapshot): CombatResult {
  const events: BattleEventWithTime[] = [];
  let result: CombatResult | undefined;
  const it = runBattleStream(snapshot);
  for (;;) {
    const r = it.next();
    if (r.done) { result = r.value; break; }
    events.push(r.value);
  }
  return { ...result!, events };
}
```

All existing `runBattle` callers and tests keep working; events gain a new `virtualTimeMs` field (purely additive).

### 4.3 Subscribe (optional convenience)

```ts
export interface BattleSession {
  step(): IteratorResult<BattleEventWithTime, CombatResult>;
  subscribe(listener: (e: BattleEventWithTime) => void): () => void;
  close(): void;
}
export function createBattleSession(snapshot: CombatSnapshot): BattleSession;
```

The store wraps the session; UI subscribes for live updates.

## 5. Base attack intervals (ms)

Two-stage: **archetype baseline × `(100 / clamp(attackSpeed, 20, 400))`**, clamped to `[300, 5000]`.

This means today's `attackSpeed` field still works as a relative multiplier, but the *absolute* feel comes from the per-archetype baseline below.

### 5.1 Player class baselines @ L1 (no IAS gear)

| Class       | Base interval (ms) | Notes |
|-------------|--------------------|-------|
| Barbarian   | 1300 | heavy two-hander feel |
| Paladin     | 1250 | sword & shield |
| Druid       | 1200 | shapeshifter mid |
| Necromancer | 1200 | wand-pace |
| Sorceress   | 1150 | spell-pace |
| Amazon      | 1050 | bow / javelin |
| Assassin    |  950 | dual-claw fastest |

Effective interval at L1 = `baseline * 100 / (100 + dexterity)` for the auto-attack. (Class baseline already encodes archetype feel; `attackSpeed = 100 + dex` keeps the existing dex bonus meaningful.) IAS% from gear/buffs adds additively to the divisor: `attackIntervalMs / (1 + iasPct/100)`.

### 5.2 Act 1 monster intervals

Derived once at archetype-load time. Authors may override by setting `attackIntervalMs` directly in JSON.

| Monster | attackSpeed (existing) | Family baseline | Effective interval |
|---|---|---|---|
| Fallen          | 95  | trash-melee 1400 | `round(1400*100/95)` = **1474 ms** |
| Zombie          | 60  | slow-melee 1700  | `round(1700*100/60)` = **2833 ms** → cap 2800 |
| Quill Rat       | 120 | fast 800         | `round(800*100/120)` = **667 ms**  → floor 700 |
| Dark Archer     | 100 | ranged 1200      | **1200 ms** |
| Fallen Shaman   | 85  | caster 1300      | `round(1300*100/85)` = **1529 ms** |
| Carver          | 100 | trash-melee 1400 | **1400 ms** |
| Tainted         | 90  | trash-melee 1400 | **1556 ms** |
| Bone Warrior    | 90  | heavy-melee 1500 | **1667 ms** |
| Dark Stalker    | 120 | fast-elite 1100  | **917 ms** |
| Blood Raven (boss) | 130 | boss 1100     | **846 ms** |
| Andariel (boss) | 110 | boss 1100        | **1000 ms** |

These authoritative numbers should ship in the JSON via the schema patch (§5.3) so `content-designer` owns them, not the engine.

### 5.3 JSON Schema patch — `monster.schema.json`

Additive — no breaking change:

```json
{
  "properties": {
    "attackIntervalMs": {
      "type": "integer",
      "minimum": 300,
      "maximum": 5000,
      "description": "Base swing interval in ms. If absent, derived as round(familyBaseline * 100 / attackSpeed) with familyBaseline picked by archetype tag, default 1400."
    }
  }
}
```

If absent at load time, the engine fills from `Math.round(120000 / attackSpeed)` (so legacy `attackSpeed: 100` → 1200 ms exactly, matching the user's spec hint). The family-baseline table above is preferred and content-designer should backfill all act1 monsters in the same PR.

### 5.4 Skill schema patch (`skill.schema.json`)

```json
{
  "properties": {
    "cooldownMs":  { "type": "integer", "minimum": 1000, "maximum": 60000 },
    "castTimeMs":  { "type": "integer", "minimum": 200,  "maximum": 5000  }
  }
}
```

`cooldownMs` defaults to `cooldown * 1200`. `castTimeMs` defaults to the actor's `attackIntervalMs` at cast time (i.e. casting a spell uses the same animation slot as a swing). If specified, it overrides the post-action push: `nextActionAt += castTimeMs`.

## 6. UI pacing

### 6.1 Constants

```ts
// src/features/combat/pacing.ts
export const MIN_ANIMATION_MS_PER_ACTION = 350; // base wall-clock pacing
export const SPEED_PRESETS = { slow: 0.5, normal: 1.0, fast: 2.0, turbo: 4.0 } as const;
```

Real-time per UI step = `MIN_ANIMATION_MS_PER_ACTION / speedMultiplier`.

### 6.2 Consumption loop

```ts
// pseudocode in combatStore
events: BattleEventWithTime[] = []           // raw queue produced by session
visibleCursor: number = 0                    // index of next event to surface

tick():
  if isPaused or visibleCursor >= events.length: return
  // Advance the *event cluster* sharing the same virtualTimeMs+actor:
  const start = visibleCursor
  const t = events[start].virtualTimeMs
  while (visibleCursor < events.length
         && events[visibleCursor].virtualTimeMs === t
         && sameActorOrSecondary(events[visibleCursor], events[start]))
    push to log; visibleCursor++
  schedule next tick in MIN_ANIMATION_MS_PER_ACTION / speed ms
```

Pacing is **per cluster, not per event** — so a swing that produces `action`+`damage`+`status`+`death`+`orb` reads as one animated beat (~350 ms). The next beat is the next combatant's action even if it was scheduled at virtualTime + 50 ms.

### 6.3 Producer/consumer decoupling

The engine generator can pre-run faster than the UI displays. Two strategies:

1. **Eager buffer** (simplest): on combat start, run the generator to completion off the main thread (Web Worker — already supported per `engine/` purity rule), buffer all events in `combatStore.events`, and let the UI tick through them. The combat is over the instant the worker returns; the UI just animates the playback. Flee = stop ticking + emit fled state.
2. **Lazy** (used only if event count grows huge): step the generator on each UI tick. Same code path, slightly more latency.

Recommend **eager via Web Worker** for v1. It's simplest, deterministic, and combat fight-length is bounded (<2 minutes virtual ⇒ a few hundred events). Files: `src/workers/combat.worker.ts` (new).

### 6.4 Mobile (360×640)

The pacing constants are unchanged on mobile. The combat log is already virtualized to last 200 entries. Verify on a Pixel 5 viewport in Playwright that ticks render below 16 ms each (event push + scroll). No layout change required.

### 6.5 Buttons

* **Pause** — already exists; stops the UI ticker. Engine result is unaffected.
* **Speed** — replaces the `autoMode` checkbox with a 4-state cycle: `1× / 2× / 4× / Skip` (Skip = drain the queue instantly to the end, so the player sees the result without waiting).
* **Flee** — already exists; cancels the worker, marks combat lost.

## 7. Migration plan

Order matters; each step is independently mergeable & test-green.

1. **Engine types** — `engine/combat/types.ts`: add `attackIntervalMs` to `CombatUnit`; rename `cooldowns` value semantics to "ms remaining" with a migration helper `cooldownsRoundsToMs(c, scale=1200)`. Update `ActiveStatus.remaining → remainingMs`.
2. **Skill registry** — `engine/skills/effects.ts` & registry: add `cooldownMs`, `castTimeMs`; auto-fill from existing `cooldown` rounds at registration. Skills built from JSON inherit defaults until content-designer fills them.
3. **Scheduler module** — new `engine/combat/scheduler.ts` implementing §2.3. Existing `runBattle` becomes a thin wrapper around `runBattleStream` per §4.2.
4. **Status engine** — `engine/combat/status.ts`: switch `remaining` to `remainingMs`; DoT processing per §2.5.
5. **Turn-order** — `engine/turn-order.ts`: keep file but mark `calculateTurnOrder` deprecated for tick mode; add doc note.
6. **Monster schema** — `data/schema/monster.schema.json`: add `attackIntervalMs`.
7. **Monster JSON** — `data/monsters/act1.json` (and act2–5 when authored): backfill `attackIntervalMs` per §5.2. Owned by `content-designer`.
8. **Bridge** — `stores/combatHelpers.ts` `createSimpleEnemy` is replaced by reading `monsters/act1.fallen` archetype JSON via the same `buildMonster` helper currently in `tests/sim/bloodMoor.sim.test.ts`. Promote that helper to `engine/spawn/buildMonster.ts`.
9. **Worker** — `src/workers/combat.worker.ts`: receives `CombatSnapshot`, returns the buffered event list + `CombatResult`.
10. **Store** — `stores/combatStore.ts`: add `events: BattleEventWithTime[]`, `visibleCursor`, `speed`, `tick()`. Replace `autoMode` boolean with `speed: 1|2|4|'skip'`.
11. **UI** — `features/combat/CombatScreen.tsx`: subscribe to store, drive a `setInterval` ticker via §6.2, render Speed cycle button.
12. **Tests** — see §8.
13. **Save format** — combat is *not* persisted mid-battle today (the store starts a fresh battle on mount). Adding `events` to the store is in-memory only; **no save migration required**. If we later persist mid-battle state, bump `saveVersion` then.

## 8. Test matrix (for `qa-engineer`)

All tests pure, no DOM.

| # | Name | Setup | Expected |
|---|---|---|---|
| T1 | seed-determinism | Two `runBattleStream` runs, same snapshot, same seed | identical event sequence including `virtualTimeMs` |
| T2 | speed-asymmetry | Player interval 1000, single mob interval 500 | within first 3 player swings, mob has acted ≥5 times |
| T3 | skill-cd-respected | Player skill with `cooldownMs: 3000` | between two casts of same skill, `virtualTimeMs` delta ≥ 3000 |
| T4 | dot-rate-stable | Inflict 1-stack 100/s poison; vary attacker AS 50 vs 200 | total DoT damage at virtualTime=5000 within ±5% of 500 in both runs |
| T5 | tie-break-stable | Two units with identical interval & ids `enemy-a`, `enemy-b` | every step `enemy-a` acts before `enemy-b` |
| T6 | no-rng-leak-into-order | Same snapshot, vary the seed | per-step `actorId` sequence unchanged (only damage/dodge rolls differ) |
| T7 | maxVirtualMs guard | Two units that can't damage each other | combat ends with `winner:null` at virtualTimeMs ≈ 120000 |
| T8 | summon-on-start ordering | Necromancer + 3 mobs | summon events all carry `virtualTimeMs: 0`, then first action at min interval |
| T9 | death-mid-cluster | Mob dies to thorns reflection on a player swing | `death` event shares `virtualTimeMs` with the triggering damage event |
| T10 | UI pacing (Playwright) | Mock combat with 30 events spread over 5s virtual time | wall-clock duration of log fill ≥ `30 * 350 / speed` ms ± 100 ms |

Add a `npm run sim:tick` script that wraps `vitest run tests/sim/tickCombat.sim.test.ts` for ongoing balance work.

## 9. Edge cases & invariants

* **Zero alive on one side at engine start** → emit single `end` event with the surviving side as winner; no infinite loop.
* **Stunned actor's clock**: stun consumes the slot — `nextActionAt += attackIntervalMs` still advances even if the actor only emits `stunned`. (Otherwise stun would just delay infinitely.)
* **Buff already active**: skip the cast attempt, but still consume the slot (matching `Diablo2TextGame.md` §5.2). Same +interval push as a basic attack. Emit a debug-level event `{kind:'action', actor, skillId:null}` so the log shows "Sorceress paused."
* **Summons added mid-battle** get `nextActionAt = state.virtualTimeMs + summonInterval`.
* **Speed change mid-battle** (e.g. Cold Slow status applied) only takes effect on the *next* `nextActionAt` push — current pending swing keeps its previously scheduled time. This is the standard D2 behavior.
* **Negative haste (slow status)**: `hasteMul = max(0.25, 1 - slowFraction)`. A 75% slow → 4× interval. Floor protects against div/0.
* **Boss enrage at 25% HP** (existing) flips a flag; combine with intervals by halving `attackIntervalMs` permanently when enraged.
* **Determinism on file-system reorder**: tie-break uses `combatantId` strings — content-designer must keep ids stable across versions. Unit tests in T5 lock this.

## 10. Open questions for PM

1. **Web Worker mandatory or opt-in?** Eager-buffer in worker keeps the main thread perfectly smooth, but adds bundle complexity. v1 fallback could just run `runBattle` on main thread synchronously and animate from buffer (works — fight is bounded). Recommend ship synchronous first, move to worker if profiling shows >16 ms blocks.
2. **Save versioning** — confirmed not needed for v1 since combat state isn't persisted. PM to confirm no plan to "resume mid-fight".
3. **`maxVirtualMs = 120_000`** — tunable; do we want a "fight took too long" softfail path (auto-flee) or strict draw?
4. **Skip button = instant resolution.** Some idle players may want a Skip-by-default toggle in Settings (carry across battles). Out of scope for this spec; flag for a later UX pass.

## 11. References

* `Diablo2TextGame.md` §5.1, §5.2 — turn-order driven by attack speed, ≥1 s skill CD.
* PureDiablo / Arreat Summit — D2 IAS curve (`100/(100+ias)` form). We deliberately use the simpler additive form here for clarity; can revisit if balance demands the exact D2 curve.
* `.github/copilot-instructions.md` §3 — RNG via `engine/rng.ts`, no `Math.random()`.
* `src/engine/combat/combat.ts` (current round-based loop) — replaced by `scheduler.ts`.
