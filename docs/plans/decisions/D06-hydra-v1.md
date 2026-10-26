# D06 — Paid finite Hydra

2026-10-25. Provisional author contract; root sole implementation/review owner.
Independent design/QA, earned balance and player acceptance remain open.

## Overview

Replace Hydra's all-enemy instantaneous damage with one real, independently
scheduled multi-headed summon. Follow canonical GDD §5.2 and the D06 paid
battle-start abstraction: one40MP preparation per selected eligible skill/wave,
no ordinary action spent, no retry/replacement/refund during that wave. Preserve
unlock30, ranks1–20,4s cooldown,95–140 Fire/+9 per rank and10% Burn.

## Player fantasy

A Sorceress invests mana in a flame beast that keeps attacking while she uses
other skills. Three heads produce distinct aimed bolts rather than an all-enemy
explosion. The beast is a real targetable allied body under existing summon
targeting/control/death rules. This adaptation serves build variety in the
text-first game without movement/range stats.

## Detailed rules

At wave time0, process a selected native Hydra once, deduplicating aliases.
Require living original player hero, current Sorceress learned allocation,
unlock/transitive prerequisites and exact authored registered effect/payment.
Validate/build the complete candidate before debit/registration. Insufficient
mana, malformed source or terminal battle creates nothing and pays nothing.
No rank-one legacy fallback, merc/enemy/summon/equipment ownership or preloaded
template marker grants Hydra combat power. Existing carried Hydra cooldown may
be overwritten only by this paid fresh-wave preparation, as other D06 summons.

JSON owns body stats, head count and lifetime. Initial values: one body, three
heads,10s lifetime,240HP,10Defense,100attackSpeed,5% crit/dodge,1.5crit multiplier,
50Fire resistance, other resistances0, no MP/weapon Attack/find stats. Global
friendly summon mitigation remains authoritative. Body stats do not scale with
paid rank; each head's bolt base does. Capture paid rank and owner Fire damage
bonus at spawn; never add Necromancer summon mastery or unrelated owner weapon
stats. Each normal body opportunity emits one action and attempts one ordinary
seeded Fire/Burn hit per head, reselecting a living hostile after each death.
No instant owner Fire damage or head skill payment. Normal hit/crit/mitigation,
debuffs, death/reward/orb/reflection and owner-death cascade remain shared.

Disabling control on the body blocks its opportunity; control on the owner
does not stop an already paid beast. Its lifetime is a half-open interval
[spawn,spawn+duration): expire before same-time body actions, using normal body
death observation once, with no refund/corpse/orb. Source/body death stops later
bolts. No resummon in this wave even after expiry or later mana recovery.

## Formulas

At paid rank r in1–20 each bolt rolls95+9(r−1) through140+9(r−1), before normal
Fire damage bonus/crit/resistance/Defense. Rank20 base266–311. Each landed bolt
applies existing3s Burn, up to5 stacks, each max(1,floor(hitDamage×0.1))/second.
Body cadence uses the shared attackSpeed→period function, including normal
Chill/auras; no new timing formula. Three independent hit/base/crit/status
decisions per body action, reusing ordinary pipeline RNG order. Pay40MP once;
4s cast cooldown is published even if the first body attack ends the wave.

## Edge cases

Battle-local registration IDs reserve collisions and never use global counters.
Only bodies actually created by successful Hydra preparation receive private
bindings. Preloaded/forged identities never gain Fire attacks or extend a new
body's lifetime. Fresh waves rebuild summons and pay from carried hero MP;
no body/rank/lifetime persistence across waves or saves is promised. Issued
recordings remain immutable after allocation changes. Fresh/imported runs carry
configuration only; save version22 remains. Unselected/unlearned/wrong-class
Hydra never prepares. Existing sixteen D06 preparation templates and all
independent fields/channels/summon behavior retain their existing policies.

## Dependencies

Strict skill JSON → immutable validated Hydra definition → native learned
projection → paid preparation → standard body registration/scheduler → shared
damage/control/death/playback. Localized preview distinguishes per-head damage,
heads/body/lifetime/cadence/stats and once-per-wave payment from player damage;
combat summon names use existing en/zh-CN naming. No generated art is needed.
Mobile360×640/desktop detail, summon playback, public save/reopen/offline must
be checked. A generic summon marker or green catalog test is insufficient.

## Tuning knobs

Feel: JSON head count1–8, duration1000–60000ms and body attackSpeed. Initial
three heads/10s preserve the multi-headed continuous attack fantasy. Curve:
unchanged bolt base/+9 growth; JSON body HP/Defense/resistances/crit/dodge.
Gate: unchanged level30,40MP/CD4s and learned prerequisite chain. These authored
body/lifetime choices are provisional; earned TTK/resources/build tests are
required before final tuning acceptance.

## Acceptance criteria

Native RED→GREEN for actual spawn,40MP payment, delayed repeated body Fire and
absence of owner explosion; ranks1/2/20 seeded oracle, multihead reselection,
expiry/death/control/no retry/refund, malformed source/native ownership refusal,
alias deduplication and battle-local identity. Immutable input and repeated
recorded/unrecorded/playback equality; real next-wave paid rebuilding and
fresh/import configuration-only behavior. Strict schema/loader, focused/engine/
full/types/lint/production build/precache/debug-bridge checks, bilingual detail/
body naming and production desktop/mobile public playback/save/offline evidence.
Independent and earned gameplay/balance acceptance remain open.

## Author checks before implementation

Security check: pass. Local deterministic engine/data/UI, no network, credential,
dependency/CI/permission or persistence/export change. Plan review: ready after
choosing canonical paid startup rather than silently making a new free summon,
and covering private spawn provenance, source/body control separation, exact
expiry ties, death/refund boundaries, native wave rebuild and honest previews.
DESIGN-REVIEW: CONCERNS. Eight required sections are executable. Canonical combat
invariants apply; the referenced pillars document remains unavailable. New
body/lifetime tuning, independent review and earned balance remain open.
