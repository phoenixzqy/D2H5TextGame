# BUG-077 — Require authority and one shared corpse for Poison Explosion

Status: Fixed in `a7deb7bd867bea4c701ac1d318e2e210204c948b`.
Severity: High — the advertised corpse consumer casts without authority or a
kill, and CE can spend the same body afterward. Removing PE from priority avoids
the cast but removes the feature rather than satisfying its prerequisite.

## Reproduction

- Baseline: `d81ab73` (`feat: define Poison Explosion damage and player authority`).
- Linux, Node24.21.0/Vitest1.6.1 engine project. Browser/viewport/locale N/A
  (pure TypeScript). Seed:1; actual production PE/CE registration.
- Command: `node_modules/.bin/vitest run --project engine src/engine/combat/poison-explosion.test.ts`.

1. Slot PE on a living level18 hero with15MP; omit Player-derived PE authority.
2. Repeat with valid authority but only a durable living enemy and no death.
3. Give a1HP primary enemy indefinite Stun and1HP/s Bleed expiring1000ms;
   hold a durable survivor. Supply only valid PE authority.
4. Supply both authorities,35MP and priority[PE,CE] with the same single death.

## Expected and actual

Expected: missing authority or supply skips PE without MP/CD/RNG cost; fallback
matches the no-PE control in the same action. PE-only eligibility collects one
actual corpse, then spends one body+15MP+2s at1700. Both skills share one FIFO;
PE priority spends the only token and prevents a later CE cast. Keep dead unit
and ordinary death/reward identities intact.

Actual: cases1/2 cast PE at1700 and change fallback RNG/resources; case3 emits
no availability/consumption feedback because collection recognizes only CE;
case4 casts PE at1700 and CE at3400 using the unspent CE corpse. Meaningful RED:
all4 tests failed for these observed behaviors before any runtime patch.

## Evidence and ownership

Root-owned raw RED log, command/timing/source receipt and captured prepatch test:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-poison-runtime-_e0h72gf/red.log`
and `red.receipt.json`. Retain until umbrella consumers finish; root removes.
The same evidence root contains the prepatch frozen24-case production damage
baseline and independent arithmetic. That baseline accepts damage preservation,
not current ungated casting.

Affected owner: engine-dev (`combat.ts` snapshot/state, selection/startup,
shared death collection and synchronous cast commitment); qa-engineer reviews
regressions. Root cause: existing finite-corpse boundary only recognizes CE;
PE uses ordinary implicit-rank casting. The minimal fix extends that boundary
with independent PE authority and exact semantics, preserving the shared FIFO,
status scheduler, damage/target/death ordering and reward identity. No native
store, save format, persistent body or generic qualification refactor belongs
in this card. Native projection/replay and localized feedback follow separately.

Regression path: `src/engine/combat/poison-explosion.test.ts`; existing CE suite
must stay unchanged and passing. Resolution/validation will be appended after
implementation; the following bounded increment records the actual fix SHA.

## Resolution and validation

Implemented in the combat increment; the following bounded native increment
records its actual committed SHA. Extend the existing finite-body boundary with
independent copied PE authority, exact semantics and requested/resolved identity
gates at selection, synchronous commitment and startup. Either authority enables
the same FIFO; accepted PE shifts its oldest token before ordinary15MP/2s effects.
Dead units and death/reward identities remain intact. No scheduler/damage/store/
save-format refactor.

Final focused170/170 (PE108, unchanged CE62), engine3867/93, full8110/256,
typecheck, lint/purity and production build/bridge scan pass. Combat coverage:
97.97% lines/statements,92.4% branches,100% functions. The unchanged frozen24-case
production oracle passes full output equality apart from exactly the intended
availability/consumedPoison messages; freeze SHA256
`f46ecc7cda017d50d3f3591b4b365986a604117e0bcec369bc1f91fe3f52e493`.
Independent GD/TD/code APPROVE and QA ADEQUATE cover source and the arithmetic.
Initial focused failures were proven fixture issues: retained skillOrder is input
configuration, seed1's MP orb normalizes infinite mana, and19MP needs a19MP cap.
All three corrections retain the behavioral assertions; runtime did not change.
Raw failed attempts remain in the evidence root. Engine3s/full15s budget overruns
and existing production size/precache/Browserslist warnings remain open.
Native projection, replay/rewards, localized feedback and Skills/browser/earned18/
feel acceptance follow separately; this resolution claims engine behavior only.

Actual combat fix commit: `a7deb7bd867bea4c701ac1d318e2e210204c948b`. Regression path remains
`src/engine/combat/poison-explosion.test.ts`; final validation is recorded above
and in ledger v1cf. Native authority is tracked separately as BUG-078.
