# D04 — Maul, Rabies and Fire Claws deal periodic damage

Runtime `3ab831d` repairs BUG192 under the committed Druid attack contract.
Presentation `91056a5` adds truthful bilingual details. Exactly these three
identities receive bounded local functional credit after the passing final
suite, frozen-input audit and committed-HEAD blob check. Independent design/QA and earned class/build balance
remain open; complete private v1 remains unfinished.

## Behavior and reconciliation

Three authored payloads supply positive on-hit DPS fractions: Maul 10% Bleed,
Rabies 5% Poison, Fire Claws 10% Burn. The existing adapter, damage and status
runtime is reused unchanged; no implicit global rate, save version, RNG or
base-stat change. Bleed 10% is expressly provisional tuning. All authored hit
ranges/growth, targets, prerequisites, costs, cooldowns and cap20 are preserved.
Each incoming stack captures max(1, floor(finalHit * fraction)); periodic damage
is not mitigated or scaled again. Existing damaging aggregates keep their old
per-stack rate; rate-less markers may gain prospective potency. Bleed refreshes
at cap1/3s; Poison stacks cap10/5s; Burn canonicalizes to Ignite cap5/3s.

Maul preserves its legacy name and Werebear prerequisite, attacks in any form
and neither creates nor replaces a paid Werewolf/Werebear. Fire Claws is a
single Fire attack, not a basic-attack enchantment. Rabies spreads only from a
Poisoned death: half the dying target's stacks, floor/minimum1, to each living
same-side unit with captured potency and a fresh five-second application.
Further deaths can chain. The controlling spec and both localized descriptions
are reconciled, with explicit rates/durations/caps and current/next/MAX/unlearned
hit previews. Fixed attacks remain independent of weapon Attack.

## Causal and boundary evidence

The original native rank1/20 RED passes direct hit/payment but fails all six
periodic HP assertions at zero. Original causal/schema sources and logs are
retained. Seed7 clean hits rank1/2/20 are Maul82/90/234, Rabies51/56/146,
Fire Claws71/77/185, with full per-stack DoT24/27/69,10/10/35,21/21/54.

Five new test files cover schema absence/contradictions/nonfinite potency,
actual HP and exact expiry, replay/input immutability, mitigation/increase once,
Attack independence, minimum1, single-target bounds, affordable/missed casts,
exact cooldown/fallback, refresh/cap/old-rate retention/rate-less promotion,
actual two-hop Rabies deaths including 10→5→2 stacks, expiry-before-death and
recipient boundaries, Maul human/wolf/bear, native class/unlock/full prerequisite/
MAX-alias authority and fresh rank projections. Pure periodic display and both
locales preserve existing Burn presentation. Root source/test/visual reviews
are self-reviews and do not replace independent acceptance.

## Production and limits

All four final en/zh-CN ×desktop/mobile browser cases have actual terminal
exit0 on the corrected final build. English desktop completed in61.644s,
Chinese desktop40.743s, Chinese mobile31.923s and the tracked English mobile
recovery32.924s. The deterministic attachment audit independently re-reads
12 actual attack entries, eight exact player/inventory/map/mercs/formation
Save-close-new-page-Continue pairs,20 geometry samples across five sizes and
16 selected screenshots; all16 were individually inspected by root. Each
Save22 pair preserves exact prerequisites, public rank1→2 allocations, remaining
points and selected combo. These are author self-checks, not independent QA.

The pre-display-correction browser wrapper ended143 during its fourth case;
its three completed cases and separate missing-case recovery are retained but
do not substitute for final-build proof. On the final build, an English mobile
wrapper also ended143 after printing a complete pass report but before writing
its terminal receipt. That command was not accepted as cleanly passing. Its
separately tracked recovery records actual exit0/no timeout; all consumers
finished before stopping exact owned server257541. Interruption causes remain
unestablished. No source/build changed between final browser cases.

Fixtures are synthetic L30/rank1→2 with three public allocation points, full
prerequisites and imported50000-life/mana gear; no earned credit. Public controls
allocate/select attacks and enter Catacombs. Four final JS chunks exclude the
test bridge. Existing nested scrolling/header/nav occlusion and icon/font
fallback remain: English mobile stats sit below the initial viewport, and mobile
combat captures show the ally field with enemies/log farther down. DOM evidence
establishes periodic logs and damaged living enemies. No complete mobile/a11y/
PWA/performance acceptance is claimed. Existing build/test budgets remain open.

Original schema strictRequired, fixture combo/prerequisite/death-field/cadence,
typecheck and lint failures are retained with correction notes. A populated
owned rebuild precached its superseded index chunk; removal guard/bridge count
failed correctly. The exact owned server was stopped, that staging directory
was retained by hash, and a clean760-file final build passed. No browser case
used the contaminated staging output.

## Review correction and interrupted full run

Root review found the newly introduced periodic display resolver initially
accepted a primary status duration override that the generic damage adapter
does not forward. An isolated actual adapter/display RED retains the mismatch
(display2.5s, registered effect has no duration). The corrected resolver rejects
every explicit primary duration override and derives duration from the same
status defaults as actual combat. Unit guards cover0/negative/NaN/Infinity/2500;
the isolated adapter/display GREEN is retained. No runtime adapter expansion.

The first full run was deliberately stopped before that source correction:
exit-15 after528.865s is retained as superseded evidence, not a pass. Exact owned
descendants were discovered by PPid and signaled; pre/post source/build/HEAD/
status/genuine maps remained exact through interruption. An initial process
stat parser failed on a name with spaces before sending any signal; that error
and corrected discovery record are retained. Final full validation uses
the corrected frozen inputs and passes as recorded below. The attachment auditor also had a scratch-only
receipt-name collision: a successful payload was overwritten by its wrapper
receipt. The visual-review writer stopped with KeyError before writing; rerun
under a distinct command label regenerated the audited payload. No browser
case or production source changed for this correction.


## Final checks and frozen inputs

The five new files contain142 cases:45 schema,39 combat,21 native projection,
13 pure display and24 bilingual UI. The earlier focused186/7 pass predates
three native prerequisite cases and four extra duration guards; it is retained
as that earlier scope, not a claim of a later193-case focused run. Final
`npm run test:engine` passes **6955 tests /242 files** (175.220s wrapper wall).
Final standard `npm test` passes **13405 tests /582 files**, with **two existing
skips**, in **653.485s** wrapper wall time. Typecheck109.320s, lint217.878s,
explicit `VITE_E2E=false` clean production build22.238s and the four-JS forbidden-
bridge scan pass. Existing React act/build warnings and test-budget breaches
remain; these results do not establish performance acceptance.

All **1305 source/test/config hashes**, **760 final build hashes**, HEAD,
Git status and the genuine-save digest remain exact throughout the final full
run. The post-commit audit reads actual `HEAD` trees and blob bytes, verifies
all1305 against the tested snapshot and disk, and rechecks the genuine save.
The shared damage/status adapter and runtime were not changed. Original RED
sources, all failed/interrupted command logs and correction records remain in
the raw packet. No assertions were weakened, new skips added or timeout gates
relaxed.

## Progress and retention

Exactly Maul, Rabies and Fire Claws gain credit. All213 IDs/order remain:
**137 unverified /74 bounded-functional /one engine-only /one review-needed**.
Proof scopes differ and are not overall completion percentages. Genuine
Ancients401 retains decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33 /XP149261 /23682 gear /nextNormal402 /Nightmare0, Ancients/Rite claimed,
**Baal uncleared**. C0/C1 retain narrow historical acceptance. C2-C4/fullG0-G7,
all-class earned builds/economy/pacing/endgame, independent review and full
mobile/a11y/PWA/performance remain open. No genuine campaign or remote action
occurs; root remains sole writer and the umbrella goal/worktree stays active.

[Manifest](fixtures/druid-attack-dot/manifest.json),
[raw archive](fixtures/druid-attack-dot/raw.tar.gz) and
[cleanup receipt](fixtures/druid-attack-dot/cleanup.json) retain original failures,
exact commands/scripts/fixtures, native exports/screenshots, frozen hash maps,
author self-reviews and committed-source proof. Disposable final and both
superseded production builds are represented by complete hash maps. The exact
final owned server257541 is terminal; port4478 is closed and the tracked
English mobile recovery284585 is absent after terminal0. Earlier required
campaign evidence, shared caches, source/history and umbrella checkout remain.

All **264 raw files** and **37 terminal command receipts** are byte-verified.
Exact cleanup removed **2545 task-owned disposable files**. The task scratch
is absent, port4478 is closed, remaining paths are `[]` and cleanup failures
are `[]`.
