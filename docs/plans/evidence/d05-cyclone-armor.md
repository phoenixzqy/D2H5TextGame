# D05 — Paid Cyclone Armor prevents actual damage

Runtime `ac9eb7e` repairs the paid marker-only buff. Presentation `568b833`
adds truthful bilingual details and separate damage-prevention logs. Only this
skill receives bounded local functional credit. Independent design/QA and
earned class/build balance remain open; complete private v1 is unfinished.

## Behavior

Preserve authored 2.5% final-damage reduction and +1 point to each of six
resistances per rank, unlock 12, Arctic Blast prerequisite, cap 20 and ordinary
rank-scaled cost/cooldown. This broad v1 defense is provisional tuning. The
native current-class, unlock, full-prerequisite and MAX-valid-alias projection
establishes rank. Only a real paid cast creates source-bound power; markers,
foreign roles and contradictory registry overrides confer none.

Resistance applies before ordinary penalties/clamps. Direct packets round
independently; periodic damage uses exact cumulative quota differences starting
at the paid cast, without retroactive prevention. The shared splitter applies
Cyclone before Energy Shield and Bone Armor in trusted synthetic combinations,
including identical settlement/lethal prediction and lethal Shatter. Existing
`absorbed` remains Bone-only; `cycloneAbsorbed` reports Cyclone separately.
Static uses the shared splitter/forwarding branch, but current valid native
source/target scopes cannot oppose an eligible player Cyclone hero. No native
Static-versus-Cyclone proof is claimed.

Paid armor carries across waves without another payment. Allocation or
eligibility changes apply next wave; reset/loss removes power. Fresh runs and
imports start unpaid; replay uses original wave resources. No healing, refill,
base-stat mutation, new RNG or Save22 change occurs. Both locales distinguish
percentage reduction from flat resistance points, explain lifecycle, and show
current/next/MAX/unlearned values and the existing localized positive chip.

## Verification

Original causal RED at `5e47fff` fails both native rank-1/20 actual-HP cases:
the cast spends mana but an incoming 100 Fire hit loses 100 HP. The fix loses
97/40 HP after 1/20 resistance points and 2/40 prevention, leaving MP 83/87.
The six new test files contain 65 cases across authored/schema validation,
actual seven-type damage, reflection, pre-cast quota, partition independence,
exact lethal timing, trusted ES/Bone, Shatter, affordability, exact cooldown
expiry, dodge/RNG, immutable replay, native next-wave allocation/reset and
Save22 import, plus bilingual details/logs.

Focused compatibility passes **188 tests / 11 files** before the final three
cooldown-boundary additions; corrected engine **6,858 / 239** includes those
additions. Final standard `npm test` passes **13,263 / 577**, with two existing
skips, in **477.114s** wrapper wall time. Types (59.449s), lint (120.929s),
production build (15.136s) and the four-JS forbidden-bridge scan pass. Test
budgets remain breached; no performance acceptance follows. The explicit
`VITE_E2E=false` build lives in task-owned scratch. A rebuild after the final
type-only lint correction emits all **760 files byte-identically**, matching
the browser-tested bytes.

Production browser **4/4** passes en/zh-CN × 1280×800/360×640, four actual paid
cast/prevention entries, eight exact player/inventory/map/mercs/formation
Save→close→new-page→Continue pairs and 20 geometry samples. Fixtures are
**synthetic L30 / rank19→20 / one public allocation point / high-resource,
negative-defense imported gear**. They earn no campaign or balance credit.
Public controls allocate/select the skill and enter Catacombs; no test bridge
exists. All eight screenshots were individually inspected. English mobile
stats sit below the viewport; mobile combat chips are partly covered by the
existing bottom nav. DOM evidence establishes chip/log presence. Nested scroll,
header/nav occlusion, icon/font fallback, full accessibility/PWA/performance
and existing build warnings remain open.

All **1,300 source/test/config hashes**, **760 build hashes**, HEAD, Git state
and genuine-save digest stay exact through the full run. Committed source
blobs match the validated snapshot. Original causal/UI/log RED, scheduler,
character-replacement fixture, cooldown-millisecond, lint and browser timeout
failures are retained with correction notes. The first browser server helper
captures pipes without draining them; output backpressure is a plausible timeout
cause. A customized owned server writes access logs directly; unchanged browser
assertions/timeouts pass. Root source/test/visual self-reviews do not replace
independent acceptance.

## Progress and retention

Only the Cyclone inventory row changes. All 213 IDs/order remain:
**140 unverified / 71 bounded-functional / one engine-only / one review-needed**.
Proof scopes differ; these counts are not overall completion percentages.
Genuine Ancients401 decompressed digest
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`
stays L33 / XP149261 / 23682 gear / nextNormal402 / Nightmare0, with Ancients/Rite
claimed and **Baal uncleared**. C0/C1 retain their narrow acceptance; C2–C4,
full G0–G7, earned builds/economy/pacing/endgame and independent QA remain open.
No genuine campaign or remote action occurs; the umbrella goal/worktree stays
active.

[Manifest](fixtures/cyclone-armor/manifest.json),
[raw archive](fixtures/cyclone-armor/raw.tar.gz) and
[cleanup receipt](fixtures/cyclone-armor/cleanup.json) retain original failures,
commands, exact scripts/fixtures, exports/screenshots/traces, frozen hashes,
self-review and committed-source proof. Both disposable production builds are
represented by complete hash maps. Exact owned server PID134197 was stopped;
port4478 is closed. Initial helper server PID128778 also exited. Earlier
required campaign evidence, shared caches and umbrella checkout are preserved.
All **153 raw files** and **30 terminal command receipts** are byte-verified.
Exact cleanup removed **1,673 task-owned files**; scratch is absent, port4478
is closed, remaining paths are `[]` and cleanup failures are `[]`.
