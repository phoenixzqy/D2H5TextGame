# D04 — Mind Blast and shared Mana Burn

2026-10-25; local author verification under
[D04](../decisions/D04-mind-blast-mana-burn-v1.md) and
[BUG210](../../../production/bugs/BUG-210-mind-blast-missing-stun-and-mana-loss.md).
Independent design/QA, earned balance and full private v1 remain open.

## Actual behavior

Mind Blast now forwards ordered Mana Burn then Stun through the real JSON
adapter and legacy registration. Preserve Arcane50–70/+5rank, all enemies,
one30MP payment/CD3, unlock24/cap20 and the Cloak prerequisite. Ordinary Stun
lasts1s, boss Stun0.5s, with real action interruption and canonical expiry.
Misses preserve payment but apply neither effect.

Closed Ajv-validated combat JSON owns20% drain, the independent1.5 zero-MP
Arcane factor and indefinite marker lifetime. Shared hostile direct-hit status
settlement drains floor(20% of actual HP removed), capped at post-shield MP.
It handles real monster Mana Rift, sub-five-HP rounding, overkill, resistance,
flat MR, Energy Shield ordering and full absorption. No drain is inherited by
periodic or reflected damage. Existing marker combo multipliers and their boss
scaling stay intact. An already marked zero-MP target takes the additional
Arcane factor based on pre-hit state; the strike emptying MP cannot amplify
itself. The factor is a separate unrounded step after the existing combo,
avoiding premature floating-point multiplication of the two coefficients.

Mana Burn persists until an actual MP increase. Shared resource commitment
clears only active markers on regeneration, orb, death refund, Redemption and
native Solar Creeper recovery; spending, fractional carry, full-cap no-op and
future markers preserve their state. Explicit finite overrides and wave rebasing
remain supported. Only affected original zero-MP monsters lose skill selection;
basic attacks remain available, and restoration releases the lockout. Absolute
mana-burn MP events and complete status observations use existing playback.
No new saved field/version or dependency. The drain/bonus add no RNG draws;
the newly forwarded Stun uses its ordinary status-application draw.

## Evidence and presentation

98 new cases across five files:68engine policy/catalog/behavior,22native causal
and8bilingual actual UI. The twelve actual rank1/2/20 ×seed7/19/41/97 cases
prove one action/payment, ordered statuses, actual HP/MP conservation, immutable
exact replay and folding the actual events through resource playback. Separate
unheld targets distinguish Stun from synthetic holds: control acts at2000ms,
Stun delays that action to4000ms, expiry2700ms/trash or2200ms/boss. Alias,
prerequisite, class, resource and paid-miss controls remain enforced.

The pure rank model and both locales explain drain/rounding, zero-MP condition,
restoration lifetime and ordinary/boss Stun at unlearned/current/next/MAX ranks.
Mana Burn now has explicit localized display names. Four production cases
cover en/zh-CN ×360×640/1280×800, public create/export/import, allocation to
rank2, skill priority, actual Arcane cast/both status logs and visible MP use.
Eight exact Save-close-new-page-Continue pairs preserve all five domains.
Twenty geometry checks cover all five required sizes; no horizontal overflow,
allocation controls≥44px. Sixteen final screenshots, four inspected individually,
show readable copy/rank rows and actual combat. Synthetic L30/resources/helmet
and fixed Date.now are explicit; ordinary timers/public controls, no store
injection/test bridge and no earned build/balance credit. Existing icon fallback,
full a11y/device, PWA/offline and performance acceptance remain open.

## Validation and corrections

Focused98/5files and compatibility225/7 pass. Engine7705/284files, final full
14875/666files/two existing skips (598.657s wrapper), strict types,
lint and production build pass. Four JavaScript chunks are bridge-free and all
756 precache URLs exist. Existing test/build/bundle/PWA budgets remain open;
these functional results do not close performance or offline acceptance.

Retained RED: native14failed/3passed, shared10failed/7passed, display13failed/
13passed. The first broader engine run caught four non-Mana-Burn negative-duration
regressions; expiry suppression is now specific to Mana Burn, with all56 existing
boss-duration cases unchanged and green. The explicit ordered-status registry
list gains Mind Blast. An obsolete full run was stopped by SIGTERM to its verified
owned Vitest PID1123058 after this failure; its exit143 is retained, never counted
as a pass. Fixture corrections use actual rebaseStatusClock, summoned lifeMax/
full cost refund, complete Redemption projection and readonly playback. Strict
type and lint failures/corrections are retained. Initial Chinese browser assertions
used ASCII brackets and the wrong existing combat label; corrected assertions
use observed full-width brackets/眩晕. The compact failed trace retains action/
network metadata and screencast frames; unrelated asset response bodies are
omitted with their original manifest/hash. Final tests/build/browser use the
frozen corrected source, with no source drift.

## Delivery and remaining scope

Runtime/presentation/tests/contract commit `a1b847f9` matches all1152 frozen
source/contract files in actual committed blobs. Only Mind Blast changes in the
213-row inventory;212 other rows/IDs/order stay byte-exact. Counts are108
bounded-functional/103unverified/one engine-only/one review-needed; Assassin
11/30 locally bounded.

[Raw archive](fixtures/mind-blast/raw.tar.gz),
[member manifest](fixtures/mind-blast/packet.json),
[committed-source audit](fixtures/mind-blast/source-delivered.json),
[browser audit](fixtures/mind-blast/browser-audit.json) and
[cleanup receipt](fixtures/mind-blast/cleanup.json) retain the proof.
Archive SHA256 `5eec8f72c56525bd0ff75d96767025c2c8f5873cb2d4043525ff3200a201f621`;
all176 raw members and26 terminal command receipts verified.
Cleanup removed1700 exact task-owned files, including1520 disposable
build files; all32 recorded PIDs are absent, port4496 is closed, scratch
is absent, remaining[]/failures[]. Shared caches and the umbrella worktree/claim
are preserved. [Final validation](fixtures/mind-blast/final-validation.json)
rechecks the archive, committed source, inventory, links and cleanup.

Cloak's missing Blind is separately reproduced in twelve native cases, before
repair or credit; see [next reproduction](d04-cloak-of-shadows-repro.md).
Genuine Ancients/Rite remainsL33/XP149261/nextNormal402/Nightmare0/Baal uncleared,
with decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
C0/C1 retain narrow exits; C2–C4/fullG0–G7/all-class earned builds,30–50hour
pacing/economy/endgame and independent acceptance remain unfinished. No genuine
campaign or remote action. The umbrella branch/worktree/claim remain active.
