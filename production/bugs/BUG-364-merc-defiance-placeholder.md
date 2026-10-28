# BUG-364 — Apply the native Defiance mercenary’s party Defense

Status: Fixed — bounded native factory/combat defect; browser/earned acceptance pending.
Severity: High — a recruitable mercenary’s signature support effect does nothing.
Build: 2877f35b83ebb1e182c6e86c7bce096ca79ecddb.
Environment: Node 24.21.0 / npm 11.19.0, Vitest UI/jsdom; seed 7, constructed bounded combat snapshot.
Browser/viewport: not applicable to native reproduction. Locales: en and zh-CN.
Owners: engine-dev / content-designer / writer; root implements, producer reviews.

## Reproduction

1. Construct `mercs/act2-defiance` through `loadMercPool`, `createMercFromDef` and `mercToCombatUnit`.
2. Record bounded seed-7 combat with a stunned hero/source, hero Defense 100, zero resistance/crit/dodge and a fixed 200 physical hostile hit at 1700ms.
3. Check hero HP loss, native source qualification, default registration and both locale surfaces.

Expected: `docs/design/gacha-spec.md:144` specifies +30% party Defense.
The hero has effective Defense 130 and loses 70 HP, without an aura cast.
Actual: the hero loses 100 HP; no native source is projected. Runtime
`aura-defiance` is an inert self-buff. Recruitment copy incorrectly says 75%.

All three primary regression cases in `src/stores/merc-defiance.test.ts` fail.
Native session 20155 exits 1 with unchanged inputs. Raw `red.log`/`red.json`
and native receipts are retained in the root-owned packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-defiance-t1ypwetq`.

## Bounded repair contract

Closed exact-identity JSON tuning supplies 30 percentage points. A fresh
factory-qualified living player-side native merc presence adds one fraction to
the existing Defense multiplier for living party recipients, including itself
and new summons. Duplicates do not multiply; selected Paladin and equipment
Defense retain their existing independent calculations. Death/removal withdraws
presence. Preserve reductions, damage-type mapping, ignoresDefense and minimum-one
mitigation. No save change or base-stat mutation.

Producer plan ready/security-pass/findings[], readers released. Packet
`plan-review.json` SHA256
`4d16877c6203fef4a81ce9207afc94ed39e8f1d8f7c4e668d7052cf018df6566`.
Passive presence adds no action/payment/RNG draw; removing obsolete casts allows
Jab sooner. Browser/earned acceptance remains pending. No acquisition experiment,
closed policy, protected fixture or terminated H3 retry is part of this repair.

## Resolution

Source commit `7a0dc92ba2c493e9f69745b44caf02f30734f1ed` implements the bounded contract. The unchanged
three-case real-factory regression passes, with18 authored/37 combat controls.
Final focused147/8files, engine10,896/407files and full21,462passed +two existing
skips/1,004files pass; typecheck, zero-warning lint/purity and external build pass.
All final checks preserve the same2,041 input contents, bound to the source commit.
Retained fixture/typecheck/lint failures and their local test-only corrections are
explained in [Defiance evidence](../../docs/plans/evidence/merc-defiance.md).
Final independent review: approve / security-pass / bounded evidence ADEQUATE; findings empty, readers released; receipt SHA256
`604d8a1baf0d42578ec52c85e041b8252a4de0b388f01fe9640628eadfe28fff`. Browser/earned recruitment remains pending.
