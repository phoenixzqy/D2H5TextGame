# D06 — Seven Druid summons: bounded runtime and production proof

2026-10-25. BUG195 is locally repaired and verified. This packet establishes
bounded functionality for Raven, Poison Creeper, Spirit Wolf, Dire Wolf,
Carrion Vine, Solar Creeper and Grizzly. Root is the sole author and reviewer;
independent design/QA and earned class/build balance remain open. Full v1,
C2–C4 and full G0–G7 are not accepted by this packet.

## Result and source

Controlling contract: [D06](../decisions/D06-druid-summons-v1.md).
[Original bug](../../../production/bugs/BUG-195-druid-summon-effects.md).

| Commit | Result |
| --- | --- |
| `5a0d029` | Strict, immutable JSON for all seven templates, preserving every existing base stat and resistance. |
| `5a073f6` | Fresh selected native Druid rank authority, copied into combat only; exact registered metadata binds actual runtime bodies. |
| `c228627` | Actual Raven Blind, Poison Creeper periodic HP loss, shared corpse-backed vine recovery, and truthful bilingual logs. |
| `06c9f50` | Native rank 1/2/20 stats, caps, one-batch payments and positive effect proof. |
| `5773a12` | Pure current/next/unlearned/MAX previews and bilingual descriptions of actual stats, effects and preparation. |
| `73731ba` | Real boss refresh, owner death/orphan closure and cross-battle corpse isolation regression tests. |

Raven's landed ordinary Physical hits apply 2 s/cap-one Blind. Active Blind
subtracts 20 percentage points from ordinary Physical/thorns hit probability,
with the existing 5% floor; magic and attack cadence are unchanged. Poison
Creeper retains its Physical hit and applies actual later Poison at
`max(1, floor(final mitigated hit * 0.10))` DPS, ordinary 5 s/cap-ten refresh.

Useful vines replace their own scheduled attack with recovery of 5% of their
living original owner's current maximum life/mana, rounded down and capped by
the missing resource. They consume one oldest eligible primary monster corpse
from the same finite FIFO as CE/PE/Redemption. Full resources, missing corpses,
zero recovery and invalid ownership consume nothing. Ordinary control/death and
terminal boundaries remain. Solar Creeper publishes authoritative absolute MP
updates for playback/carry. Wolves, Grizzly and fallback vine attacks retain
existing stats, growth, cadence, caps, targeting and payment.

New tuning is explicitly provisional, not canonical D2 or earned balance.
No persistent Player field, save-version/migration, dependency, CI or global
combat-rate change. Save version 22 remains unchanged.

## Automated proof and provenance

The repair adds 159 runtime cases and 99 presentation/lifecycle cases. Tests
exercise strict schema/deep immutability; selected/class/unlock/alias/rank and
exact-body ownership; preloads; all seven rank 1/2/20 stats/caps/payments;
actual Blind hit consequences with expiry/magic negatives; actual Poison
status/periodic HP loss; and vine useful recovery, shared-consumer competition,
FIFO, full/empty/zero/dead/invalid/control/deadline and primary/orphan boundaries.
They also cover deterministic replay, native refresh, actual boss refresh,
owner death, cross-battle isolation, and bilingual current/next/MAX previews.

| Final check | Observed result |
| --- | --- |
| Focused effects/previews/UI | 130 passed / 3 files: 38 effects, 36 pure previews, 56 bilingual UI. |
| Engine | 7,208 passed / 253 files; 87.700 s wrapper. |
| Standard `npm test` | 13,865 passed / 605 files, two existing skips; 473.146 s wrapper. |
| Typecheck | PASS, 49.671 s. |
| Full lint / engine purity | PASS, 84.048 s. |
| Clean explicit `VITE_E2E=false` production build | PASS, 11.560 s. |
| Production bridge / precache | All four JS chunks bridge-free; all 756 precache references exist. |
| Frozen inputs through full suite | All 1,334 source/test/config files, 760 build files, HEAD/status and genuine save unchanged. |
| Actual committed blobs | All 1,334 tested source blobs match final committed HEAD `73731ba` and disk. |

The earlier runtime-only full result was 13,766/603/two existing skips; it is
historical and does not substitute for the final integrated result above.
Existing test-time, bundle/precache and Browserslist warnings remain; no test
threshold, skip, timeout or production behavior was weakened to produce green.

[Post-full audit](fixtures/druid-summons/presentation-post-full-audit.json),
[committed source audit](fixtures/druid-summons/presentation-committed-audit.json),
[terminal receipts](fixtures/druid-summons/terminal-receipts.json).

## Public production-browser proof

Four isolated production cases passed: en/zh-CN × 1280×800/360×640. Each used
public new-Druid creation, export, disclosed synthetic import, Save, close the
page, a new page and Continue. The fixture is level 30 with 50,000 life/mana
gear and −80 attack speed; it is not an earned campaign or balance fixture.

Each case publicly allocated all seven summons from rank 1 to 2, selected each
skill and entered real Blood Moor combat, then paused/fled. Solar's additional
selected Maul had all transitive learned prerequisites, including Lycanthropy;
the observer required an actual paid Maul cast, not merely a selected slot.
No test bridge or page error was present.

The separate data audit of the author's browser outputs establishes:

- 28 actual positive summon combat entries, including real Blind and later DoT.
- Useful Carrion recovery logs and Solar consumption plus actual visible MP
  increases of 20/20/11/11 across the four cases. Samples capture the battlefield
  MP bar before/after consumption; a later paid action may reduce MP again.
- Eight exact five-domain Save-close-Continue pairs, comparing player,
  inventory, map, mercs and formation. All 28 allocations consumed the expected
  points and preserved exact ranks/configuration; no transient authority saved.
- Twenty geometry samples at 360×640, 412×915, 640×360, 1280×800 and 1920×1080,
  with no page horizontal overflow and Allocate targets at least 44×44.
- 56 screenshots retained; the author inspected Raven details and Solar combat
  in all four cases. Text wraps and scrolls vertically. Combat screenshots are
  viewport visual evidence; DOM logs/MP samples prove effects outside the frame.

[Browser audit](fixtures/druid-summons/browser-audit.json).
Example [English mobile Raven](fixtures/druid-summons/raven-en-mobile.png) and
[Chinese mobile Solar combat](fixtures/druid-summons/solar-zh-mobile.png).
All recorded task preview PIDs are absent and port 4481 is closed.

## Failures retained and observer corrections

The original native eight-case RED and its exact script/output/receipt remain.
Its Poison observer incorrectly searched direct Poison damage events: periodic
HP loss uses aggregated `dot` events. The original RED has no positive DoT.
The corrected GREEN requires positive Poison-typed status, later positive DoT
and exact final enemy HP after direct plus periodic loss. Rank 1/20 repaired
rows have 62/65 positive DoTs removing 433/1,301 HP. Original bad-observer GREEN
attempts also remain. No direct Poison event was fabricated or mixed DoT
relabeled as Poison.

Presentation RED had 91 behavioral failures and one passing foreign-identity
control. Subsequent failures preserve an incorrect Chinese test expectation
(`每层毒素` versus the existing `中毒` label) and an unnecessary optional fallback
caught by lint. The test expectation/fallback were corrected without changing
production status naming or suppressing lint.

All browser failures remain as diagnostic evidence: adaptation syntax error;
HTTP access logging filling the helper's unread pipe during Continue; Solar
having full mana before a corpse; a selector looking for MP in HP-only unit
cards; and selected Maul being pruned for missing transitive Lycanthropy.
Corrections are confined to the task harness/fixture. The final cases require
actual paid Maul and actual useful MP restoration and do not relax assertions.

## Evidence review, inventory and retention

Author review finds the bounded automated/production behavior covered. Overall
shipping/whole-class evidence remains INCOMPLETE: independent design and QA
sign-offs and earned build/balance acceptance have not been supplied. The
31 Druid rows now have bounded local functionality records; this is not class
or two-build acceptance. The full inventory preserves all 213 IDs/order and
changes exactly these seven rows: 122 unverified, 89 bounded-functional, one
engine-only and one review-needed.

The genuine save is unchanged: L33/XP149261, next Normal 402/Nightmare 0,
Ancients/Rite claimed, Baal uncleared. Decompressed SHA256:
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign, push, PR, merge or deployment action occurred.

[Packet](fixtures/druid-summons/packet.json) and
[raw archive](fixtures/druid-summons/raw.tar.gz) retain 551 exact files and 62
terminal receipts, all byte-verified. Original failed full trace ZIP hashes and
complete member hash maps remain; compact ZIPs retain exact action/network/stack
text and the last screenshot per page, alongside original failure PNGs/logs.
The other 4,374 trace JPEG frames and original full ZIP bytes are deliberately
omitted from the retained packet. This is compact diagnostic retention, not a
claim of full screenshot replay. See
[trace policy](fixtures/druid-summons/trace-retention-summary.json).
Disposable build bytes are replaced by the preserved build hash maps.

The [cleanup receipt](fixtures/druid-summons/cleanup.json) records 2,075 exact
task-owned scratch files removed after byte verification, including 1,524 build/
full-trace files. Scratch is absent, port 4481 is closed, and remaining paths/
cleanup failures are empty. The umbrella worktree, branch, older evidence and
full v1 goal remain active.
