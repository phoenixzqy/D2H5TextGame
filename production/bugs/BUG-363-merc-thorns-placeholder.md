# BUG-363 — Apply the native Thorns mercenary’s party reflection

Status: Fixed — bounded native factory/combat repair in `34850efd245f2488a775e5242717a40e9baea13c`. Browser/earned integration acceptance remains pending.
Severity: High — a recruitable mercenary’s signature support effect does nothing.
Build: a66b3e9fc9617bfe4d7ad921dba5c8140c9ddda3.
Environment: Node 24.21.0 / npm 11.19.0, Vitest UI/jsdom; seed 7, constructed bounded combat snapshot.
Browser/viewport: not applicable to native reproduction. Locales: en and zh-CN.
Owners: engine-dev / content-designer / writer; root implements, producer reviews.

## Reproduction

1. Construct `mercs/act2-thorns` through `loadMercPool`, `createMercFromDef` and `mercToCombatUnit`.
2. Record bounded seed-7 combat with a stunned hero/source and a fixed 100 physical hostile hit at 1700ms.
3. Check hero reflection, native source qualification, default registration and both locale surfaces.

Expected: `docs/design/gacha-spec.md:128` specifies 100% physical reflection.
The surviving hero returns 100 Thorns damage before attacker mitigation, without an aura cast.
Actual: incoming physical damage is 100; no reflected event exists and no native source is projected.
Runtime `aura-thorns` is a self-buff stub. Both locale surfaces omit the authored potency.

Primary regression `src/stores/merc-thorns.test.ts` fails all three cases.
Native session 16676 exits 1; input hashes are unchanged. Raw `red.log`/`red.json`
and native receipts are retained in the root-owned packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-thorns-rfbaneja`.

## Bounded repair contract

Schema-first, closed exact-identity JSON tuning supplies 100 percentage points.
Factory-qualified living player-side native merc presence adds one fraction to the
existing ordinary reflection sum for living party recipients, including itself and
new summons. Duplicate sources do not multiply; item reflection, selected Paladin
Thorns and Spirit of Barbs stay additive. Death/removal withdraws presence. Reuse
actual physical HP lost, survival, trap exclusion, mitigation, non-recursion and
reflected-death settlement. No save change or base-stat mutation.

Producer ready/security-pass plan: packet `plan-review.json`, SHA256
`49baf9337fd11bf931dd2709f4f1f5c9dd5750d3d6225367f844a0211861d496`.
Passive presence adds no action/payment/RNG draw; removing obsolete casts allows
Jab to act sooner. Browser/earned acceptance remains pending. No native acquisition,
closed policy, protected fixture or terminated H3 retry is part of this repair.

## Resolution

The source commit implements the authored100% native presence through existing
ordinary reflection, live-source withdrawal, passive registration, fresh native
qualification and corrected locales. The original three-case primary regression
passes unchanged. Final engine10,841/405files and unfiltered unit21,404 +two
existing skips /1,001files pass. Typecheck, zero-warning lint/engine purity and
external production build return native0 with unchanged source inputs. Independent
source review approves/security pass/findings[], readers released.

Regression paths: `src/stores/merc-thorns.test.ts`,
`src/engine/combat/merc-thorns.test.ts`, `src/engine/skills/merc-thorns.test.ts`.
See [native Thorns evidence](../../docs/plans/evidence/merc-thorns.md) for all
attempts, commands, exact source binding, reviews, warnings, acceptance limits
and verified cleanup. Final independent review approves, security passes, evidence
is ADEQUATE for this bounded repair, findings/blockers are empty and readers released.
Packet `final-review.json` SHA256
`b1c5af054725110210f540c345e5781a05a53d47cc9cf86b63e3f62765da8d10`.
This fixes the reported native defect; earned recruitment/build/balance, browser,
performance/PWA and full-v1 gates remain pending.
