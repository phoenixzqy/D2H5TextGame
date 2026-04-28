# Idle / Offline Spec — v1

**Owner:** `game-designer`
**Status:** ✅ DECIDED (v1 locked)
**Last updated:** 2025-01-01
**Source references:** AFK Arena offline-bonus model, Cookie Clicker idle multiplier, D2 Resurrected experience patches
**Cross-refs:** `Diablo2TextGame.md` (no offline rewards rule), `combat-formulas.md` (XP), `progression-curve.md` (XP table), `drop-tables.md` (MF), `maps-spec.md` (wave timing)

---

## 1. Summary

This game is **online-idle**: while the tab is open (or service worker active in the foreground/background), combat ticks and rewards accrue normally. While **offline** (tab closed, device asleep, no service worker tick), the game gives **NO direct rewards** — no XP, no gold, no drops.

Instead, offline time accrues a **bonus window** that boosts XP and Magic Find (MF) **for the next ~2 hours of online play**. This rewards returning players without paying out raw idle progress.

This design choice is enforced in `Diablo2TextGame.md` and is **non-negotiable** for v1.

---

## 2. Online-Idle Tick Model

```
Combat tick interval: 6 seconds
1 tick = 1 monster engaged, full combat resolution per `combat-formulas.md`
1 wave = waveSize × 6s (avg 5–8 monsters per wave per `maps-spec.md` §4)
1 sub-area = waveCount × waveDuration + boss?  (typical 3–8 minutes)
```

While the page is **visible** or running in a **service-worker–backed background**, ticks proceed at full rate.

### 2.1 Tick rate adjustments

| Stat | Effect on tick |
|---|---|
| Boots `suf_of_quickness` | +2..12% tick speed (caps at +25% from gear) |
| Skill `passive_haste` 🟡 | +5% tick speed (v1.1) |
| Difficulty | no effect on tick rate |

Cap on **total tick speed bonus from gear: +25%**. Faster ticks = faster XP/loot/hour. This is the core power-progression knob.

### 2.2 Background tab handling

- If page is **hidden** (tab not focused) but JS still runs: full tick rate.
- If browser throttles `setInterval` (most modern browsers throttle to 1 Hz on hidden tabs): the engine **catches up** on next tick using `Date.now()` deltas, capped at **5 minutes catch-up** (to prevent abuse from system clock manipulation).
- If page is **fully closed** (no JS execution): **offline mode** — no rewards, but offline-bonus accrues per §3.

---

## 3. Offline Bonus Window

### 3.1 Accrual

When the player closes the game, `lastOnlineAt` is recorded. On next launch:

```
hoursOffline = (now - lastOnlineAt) / 3600s
bonusPct     = min(0.50, hoursOffline × 0.08)
bonusWindowDuration_seconds = min(7200, hoursOffline × 1200)   // up to 2h online
```

- **8% bonus per hour offline**, capped at **+50%** at **6.25 h** offline.
- Bonus window duration: **20 min per hour offline**, capped at **2 h** at 6 h offline.
- After 6 h, additional offline time **does not** increase the bonus or extend the window — it's the same as 6 h.

### 3.2 What the bonus boosts

The bonus applies **multiplicatively** to:

| Reward | Boosted? |
|---|---|
| XP gain | ✅ yes |
| Magic Find (MF) | ✅ yes |
| Gold Find (GF) | ❌ no |
| Wishstone drops | ❌ no |
| Rune drops | ❌ no |
| Gem drops | ❌ no |
| Boss first-kill bonuses | ❌ no |

Rationale: XP and item rarity are the two "grind" axes that hurt most when offline. Gold/runes are already capped by drop tables, and giving offline-multiplier on those would distort the economy and gacha pacing.

### 3.3 Bonus decay (linear)

The bonus **does not stay flat** — it decays linearly over the bonus window:

```
elapsedOnline_seconds = now - bonusWindowStart
remainingPct = max(0, bonusWindowDuration_seconds - elapsedOnline_seconds) / bonusWindowDuration_seconds
currentBonusPct = bonusPct × remainingPct
```

So if you log in with 50% bonus / 2h window, after 1 h online you have +25% bonus, after 2 h +0%.

### 3.4 Examples

| Offline time | bonusPct | window | Effective gain on XP |
|---|---|---|---|
| 30 min | +4% | 10 min | +4% → 0% over 10 min (avg ~+2% × 10min) |
| 1 h | +8% | 20 min | avg ~+4% × 20 min |
| 2 h | +16% | 40 min | avg ~+8% × 40 min |
| 4 h | +32% | 80 min | avg ~+16% × 80 min |
| 6 h | +48% | 120 min | avg ~+24% × 120 min |
| **6.25 h+ (cap)** | **+50%** | **120 min** | **avg ~+25% × 120 min** |
| 12 h | +50% | 120 min | (same as 6.25 h cap) |
| 24 h | +50% | 120 min | (same as 6.25 h cap) |
| 1 week | +50% | 120 min | (same as 6.25 h cap) |

### 3.5 Designer rationale

- **Hard cap at 6 h** prevents "log in once a week" play patterns from getting massive returning-player rewards.
- **2 h window** is long enough that a casual session feels rewarding, short enough that it doesn't become "the only way to play."
- **Linear decay** vs flat: ensures the player keeps playing through the bonus rather than logging out the moment it starts.
- **No gold/rune/wishstone boost** keeps gacha and economy faucets stable.

### 3.6 Edge cases

| Case | Behavior |
|---|---|
| Player closes app < 30s after opening | No bonus accrual (anti-spam: minimum 1 min offline). |
| System clock moved backward | Treat as 0 offline (clamp negative). |
| Player has unfinished bonus window from previous session, then goes offline 5 min, returns | New bonus is `max(oldRemainingBonus, newAccrual)`; window restarts at the higher value. |
| Multiple devices (🟡 v1.1+) | Server-side reconciliation: last-write-wins on `lastOnlineAt`. v1 is single-device only. |
| Player on Hell difficulty | No change — bonus is a flat % multiplier on top of difficulty XP. |

---

## 4. Online "Idle Boost" Skill 🟡

🟡 **OPEN (v1.1+)**: a single-purchase passive skill `passive_idle_focus` that grants +5% bonusPct cap (lifts max from +50% to +55%). Not in v1.

---

## 5. UI Surface

The HUD must display:

1. **Bonus indicator** — top-right badge: `+24% XP/MF (1h22m left)` with a depleting bar.
2. **Returning-player toast** on launch: `"You were away 4h 12m. +32% XP/MF for 80 minutes!"` (i18n keys `idle.returnToast.title`, `idle.returnToast.body`).
3. **Tick speed indicator** — small icon near combat log: `1 attack / 5.4s (+11% from gear)`.
4. **Settings → Offline help** — short explainer text linking to this spec's §3.

---

## 6. Engine Hooks (handoff)

```ts
// engine/idle/offlineBonus.ts
export function computeOfflineBonus(
  lastOnlineAt: number,    // epoch ms
  now: number = Date.now()
): { bonusPct: number; windowSeconds: number } {
  const hoursOff = Math.max(0, (now - lastOnlineAt) / 3_600_000);
  const bonusPct = Math.min(0.50, hoursOff * 0.08);
  const windowSeconds = Math.min(7200, hoursOff * 1200);
  return { bonusPct, windowSeconds };
}

export function currentBonusMultiplier(
  bonusStart: number,
  bonusPct: number,
  windowSeconds: number,
  now: number = Date.now()
): number {
  if (windowSeconds <= 0) return 1.0;
  const elapsed = (now - bonusStart) / 1000;
  const remaining = Math.max(0, windowSeconds - elapsed) / windowSeconds;
  return 1 + bonusPct * remaining;
}
```

The combat reward step in `combat-formulas.md` §10 multiplies XP and `effectiveMF` by `currentBonusMultiplier(...)` at award time.

### 6.1 Persistence

`metaStore` save state includes:
```ts
{
  lastOnlineAt: number,
  bonusStart: number | null,
  bonusPct: number,
  bonusWindowSeconds: number,
}
```

On app launch:
1. Load state.
2. If `lastOnlineAt` set, compute `{bonusPct, windowSeconds}`. If `bonusPct > current remaining bonus`, replace `bonusStart=now, bonusPct, bonusWindowSeconds`.
3. Save updated state, set `lastOnlineAt = now` on every save (every 30s autosave).

### 6.2 Anti-cheat

- **Do not trust `Date.now()` exclusively.** On launch, fetch a server timestamp (🟡 v1.1+) or use `performance.timeOrigin` cross-checks. v1 uses local clock; deliberate clock-set is acceptable abuse risk for offline single-player.
- **Cap catch-up:** background-tab catch-up clamps at 5 min real-time per resume event.

---

## 7. Cross-Reference Index

- XP application formula: `combat-formulas.md` §10.
- MF rarity weights: `items-spec.md` §11, `drop-tables.md` §3 / §11.
- Tick interval used in wave clear time math: `maps-spec.md` §4 / §10.
- Tick speed gear suffix: `items-spec.md` §5 (`suf_of_quickness`).
- Save schema versioning: see `stores/migrations.ts` (per `.github/copilot-instructions.md` rule 9).

---

## 8. Handoff

### To Engine Dev
- Implement `engine/idle/offlineBonus.ts` per §6.
- Wire `currentBonusMultiplier` into XP/MF reward calculation.
- Unit-test all 7 example rows in §3.4 with deterministic seeds.

### To Frontend Dev
- HUD bonus badge with depleting bar (§5.1).
- Returning-player toast (§5.2), with i18n keys.
- Tick-speed indicator (§5.3).
- Settings explainer (§5.4).

### To Content Designer
- Add i18n strings (`zh-CN` / `en`) for §5 toast/labels.

### To QA
- Vitest cases for 7 offline-time scenarios in §3.4.
- Playwright case: close+reopen tab simulating 4 h offline (mock `Date.now`), assert HUD bonus shows +32% / 80 min.
- Anti-cheat: clock-rollback test (negative offline → 0 bonus).

🟡 **OPEN (v1.1+):** server-side time auth, multi-device reconciliation, idle-focus passive skill, optional ad-watch refresh of bonus window.
