# D05 — Paid finite Burst of Speed

Root plan review: ready. Security check: pass (local engine/data/UI only; no new
network, dependencies, credentials, CI, permissions or persistent format).
Independent design/QA acceptance and earned balance remain open.

Burst is an active personal Assassin skill, unlock6/cap20, learned prerequisite
Claw Mastery enforced at learning. Existing authored mana/cooldown scaling stays:
11MP/4s at rank1; ordinary rounded cost/cooldown at later ranks. Exact allocation
aliases resolve maximum once, malformed ranks are ignored and valid over-cap
allocations clamp at fresh Player composition. No implicit rank-one authority.
Require the matching living player hero, explicit wave-local eligible rank and
exact opted-in registry shape before payment. Mercs/summons/enemies/foreign or
underlevel allocations do not gain authority.

Use JSON `timedBuff.durationMs: 10000`. Existing +2% Attack Speed and +0.5 percentage
points physical dodge per rank become real paid effects during that interval.
Movement speed is replaced by physical dodge under the game's no-movement-stat
invariant. The new duration is provisional tuning, not earned balance acceptance.
No base/rank potency, cooldown or mana values move into TypeScript.

The cast stores one independently copied/frozen typed stat payload in a finite
combat status. Base stats and persistent Player stats never change. Existing
status clock/boundary/expiry/rebasing handles lifespan; effective cadence and
physical/thorns dodge consume only the active validated payload. Preserve pending
action progress at changes, including Chill/enrage composition, exact due ties,
fractional rebasing and the simulation deadline. No extra RNG draw, free attack,
resource refill, hidden refresh or stacking. Active effect suppresses recast even
when CD has expired; normal expiry permits another paid cast. Bare legacy markers
never establish potency or prevent the first eligible paid cast.

A paid effect retains cast potency through its remaining simulation duration
across waves even if later allocation changes; fresh rank controls future casts.
Ordinary learning never mutates a completed recording. Explicit replay uses its
original resource/status baseline without income, healing or accumulation. Combat
statuses are transient under the existing save policy; reload recomposes rank
from current Player and never persists a derived stat bonus or free paid effect.

This is the first finite paid stat-buff consumer. Do not reinterpret Battle Command,
Enchant, transformations, armor retaliation or aura semantics as completed merely
because they also contain generic scaling fields. Their promised behavior remains
separate work. Both locales must explain duration, per-rank speed/dodge, paid active
priority, expiry/recast and next-wave changes. Combat effect presentation must show
its localized buff state and expiry, not label it as a hostile debuff.

Verify causal RED/GREEN, strict copied schema/tuning, rank1/cap/aliases/invalid
sources, actual cadence and dodge, expiry/recast/resource refusal, no extra RNG,
base-stat immutability, Chill/death/tie boundaries, residual next-wave/replay and
full save/import; bilingual UI and production desktop/mobile. Freeze source/Git
state during final full validation. No earned campaign action or promotion of
constructed fixtures; C2–C4 and full G0–G7 remain open.
