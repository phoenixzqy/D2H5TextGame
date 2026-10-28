# BUG-362 — Apply the native Might mercenary's party damage aura

Status: Fixed — bounded native factory/combat repair in `b74c8f8f6acd5afd1cb5c6c6abdb23be9a7826c6`. Browser/earned integration acceptance remains pending.
Severity: High — a recruitable mercenary's signature support effect does nothing.
Build: cfaa90251e4519ca3118cdef8b6ab509ccecc612.
Environment: Node 24, Vitest UI/jsdom; seed 7, constructed bounded combat snapshot.
Browser/viewport: not applicable to native reproduction. Locales: en and zh-CN.
Owners: engine-dev / content-designer / writer; root implements, producer reviews.

## Reproduction

1. Construct `mercs/act2-might` through `loadMercPool`, `createMercFromDef` and `mercToCombatUnit`.
2. Record bounded seed-7 combat with a hero dealing a fixed 100 physical damage to a stunned zero-defense enemy.
3. Check hero damage, native aura qualification, default registration and both recruitment descriptions.

Expected: `docs/design/gacha-spec.md` §4.1 specifies +30% party physical damage;
the hit deals 130. The aura is passive and both descriptions agree with 30%.
Actual: the hit deals 100; no native source is projected. `aura-might` is a
self-buff stub with no damage consumer. Both recruitment locales advertise 50%.

Unmodified regression `src/stores/merc-might.test.ts` fails all three cases.
Native session 9708 exits 1; raw `red.log`/`red.json` are retained at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-might-3expqn1p`.

## Bounded repair contract

Author the existing 30% GDD value in closed, validated skill JSON. A factory-qualified,
living player-side native Might merc grants additive increased direct physical
damage to living allies, itself and summons. Duplicate sources do not multiply
the bonus; selected Paladin Might remains separate and additive. Death/removal
withdraws presence. No enemy/elemental bonus, generic buff-derived permission,
base-stat mutation, paid aura cast, extra RNG, persisted marker or save migration.
Rank 1–20 keeps the same potency, following native Holy Freeze's merc contract.

Producer GO/security-pass plan: `plan-review.json` in the same root-owned packet,
SHA256 `53fd1bbbf6ea4519c693aac6da2020fc3186e35f05f4630a048bf12eba6e96e3`.
Verify bounded native factory/runtime/schema/replay controls and E/U/T/L.
Browser and earned build/balance acceptance remain separate; no closed gameplay
experiment, H3 retry or protected fixture is needed or authorized by this repair.

## Resolution

The source commit above implements the authored 30% party presence, live-source
withdrawal, passive registration, fresh native qualification and corrected locales.
The unchanged three-test primary regression passes. Final engine passes 10,785;
unfiltered unit passes 21,345 with two unchanged skips. Typecheck, zero-warning
lint/engine purity and production build all return native 0 with unchanged inputs.
Independent final review approves/security pass, with adequate bounded evidence,
no findings or blockers and readers released. See
[native Might evidence](../../docs/plans/evidence/merc-might.md) for exact commands,
failed attempts, build warnings, review receipts, cleanup and retained evidence.
This closure covers the reported native defect; earned build/balance, browser,
performance/PWA and full-v1 gates remain pending.
