# D05 — Paid Cyclone Armor

Local implementation contract. Independent design/QA and earned class/build
balance remain open. Root is sole writer; the umbrella goal/worktree stays active.

## Objective and reconciliation

The native paid Cyclone Armor cast currently creates a permanent buff marker,
but its authored `shieldAbsorbPct: 0.025` and `resistAllPct: 0.01` per rank have
no combat consumer. Implement both advertised coefficients. Preserve unlock12,
Arctic Blast prerequisite/unlock6, cap20, base17MP/4s, cost growth−0.2 and cooldown
growth−0.05 above rank1. Ordinary rounding/minimum1s remain authoritative.

V1 interprets shieldAbsorbPct as damage reduction after ordinary mitigation,
consistent with the fractional damage split used by Energy Shield. It is not
a finite HP pool: the JSON authors no pool capacity. All six resistances gain
one percentage point per rank before existing act penalties/clamps. Absorption
covers all direct damage types, reflected Thorns, Static Field and already
mitigated periodic damage. This explicit broad adaptation and existing 2.5%
coefficient are provisional until earned balance, not canonical D2 claims.

## Authority, lifecycle and damage

An eligible living original Druid hero pays once on an ordinary scheduled cast;
no extra RNG. Exact allocated aliases use MAX once for positive integer ranks
within cap20; malformed/over-cap values are refused by ordinary class-active
ownership. Current class/integer level and full prerequisite chain govern
native authority. Bare markers, foreign roles, absent rank and contradictory
registry overrides cannot grant paid power. Independently validated JSON
primitives establish tuning; a copied source-bound paid rank supplies effects.

Keep the existing run-long buff lifetime, including qualified wave carry.
Already paid means no recast/payment. Current allocation changes apply at the
next wave; reset/foreign class/prerequisite loss removes potency. Fresh runs,
imports and retries start unpaid; explicit replay uses original wave resources
without duplicate income. No HP/MP/max-resource increase or healing. Stored
base stats never change and ally/merc/summon stats gain no bonus. Save22 persists
allocation/combo only; no transient paid state is saved.

Absorb floor(final mitigated damage × rank × 0.025). Direct packets round
independently. Periodic packets use cumulative quota differences from the paid
cast onward so extra action/status boundaries cannot alter total absorption;
pre-cast periodic damage never earns retroactive quota. Native cross-wave carry
resets only the wave-local quota. Apply Cyclone before Energy Shield and Bone
Armor in trusted synthetic combinations; use the same splitter for settlement
and exact periodic lethal-time prediction. Shatter remains lethal. Damage/DoT
events expose actual HP loss and absorbed amount; existing playback transports
the real positive buff. Source death removes usable power. DoT potency remains
captured from the mitigated hit before personal shields, as with Energy Shield.

## Ordered implementation and checks

1. Reproduce native rank1/rank20 paid casts and literal final HP with actual
   incoming damage. Record BUG191 before runtime edits; preserve causal RED.
2. Validate/copy exact authored tuning and dependencies; add strict schema,
   native rank projection, paid metadata, cast/readiness, resistance/damage and
   wave-refresh consumers. Keep engine pure TS/seeded RNG and strict types.
3. Verify direct types, reflection, Static, before/after-cast periodic quotas,
   partition independence/lethal boundary, source/role/marker/override negatives,
   exact costs/CD/no recast, no refill, alias/MAX, immutable replay and native
   learn/reset/wave behavior. No assertion/timeout weakening or new skips.
4. Explain lifecycle, per-rank and current/next bonuses in en/zh-CN. Public UI
   learning/configuration, production desktop/mobile and exact five-domain
   Save-close-new-page-Continue are required; synthetic fixtures earn no progress.
5. Run focused Vitest, `npm run test:engine`, `npm test`, `npm run typecheck`,
   `npm run lint`, `VITE_E2E=false npm run build -- --outDir <owned-path>` and a
   task-owned scan of all emitted JS for the repository forbidden bridge patterns.
   `validate:data` is absent; schema/data tests provide validation. Freeze source,
   build, HEAD/Git and genuine digest through final full tests, verify committed
   blobs, retain failures/evidence and clean exact owned temporary paths.

Files: `engine/skills/cyclone-armor.ts` and tests; skill schema/types/catalog;
combat types/resolution and tests; native combat projection/refresh and tests;
Skills description/locales/tests; this contract, BUG191 and bounded evidence.
No new dependencies, art, network, CI, save format or campaign action.

## Reviews and limits

Security check: pass — first-party local mechanic/UI repair; preserve strict
data/native authority and no credential/network/permission/publication changes.
Plan review: ready after requiring pre-cast quota baseline, periodic lethal and
Shatter parity, source-bound wave refresh and real HP checks. These are root
self-reviews, not independent approvals. Preserve genuine L33/nextNormal402;
Baal, C2–C4/fullG0–G7 and complete private v1 remain unfinished.
