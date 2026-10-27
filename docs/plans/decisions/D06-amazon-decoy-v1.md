# D06 — Paid finite Amazon Decoy

2026-10-26. Provisional author contract; root sole writer/executor. Independent design/QA, earned balance and full private-v1 acceptance remain open.

## Overview

Repair the paid Decoy marker that creates no duplicate. Follow canonical GDD §5.2 and D06 startup policy: one selected eligible Decoy prepares once per wave at time0 without spending an ordinary action. Create one real targetable non-attacking allied body. No death/expiry replacement, retry after insufficient mana, mana refund or persisted body.

## Player fantasy

A defensive duplicate takes single-target attacks while the Amazon uses other skills. It must absorb actual damage and die or expire, rather than granting invisible permanent dodge. This preserves the text-first combat identity without movement/range stats.

## Detailed rules

Require the living original native player hero, current Amazon learned allocation, level24/transitive prerequisites and explicit combo selection. Deduplicate authored/canonical aliases. Match the exact authored active self-target Decoy effect and ranked payment before building and validating the full body. No rank1 fallback, wrong-class/merc/enemy/summon source, bare buff/status/template, malformed registry effect or preloaded body establishes paid authority. The native projector owns a fresh decoyRank; only actual successful preparation creates a battle-private body/lifetime binding.

Ignore only carried Decoy cooldown for new-wave preparation. Apply existing rank-adjusted cost/CD once. Poor/invalid/terminal preparation pays nothing and never retries during that wave. Decoy is excluded from all ordinary skill selection. Never heal or grant authority to a preloaded Decoy. A fresh paid body uses standard collision-safe IDs, positioning, registration, summon playback and shared damage/death/orphan rules, with summonRefundOnDeath:false.

Only authenticated paid living unexpired Decoys draw hostile single-target picks from candidates that already pass normal allegiance/curse rules. Explicit valid Taunt retains first priority. If several paid Decoys are candidates, use registration order without another RNG draw. All-enemy/area attacks retain their original scope; Decoy grants no invulnerability. A paid body has no scheduled action, damage, buffs, heals, corpse/orb creation or resource refund; Attack0 alone is insufficient to enforce inactivity. Control on the owner/body does not cancel an already paid distraction; ordinary body death does. Source death uses existing orphan cascade. Expire before attacks at the exact half-open lifetime endpoint via standard death observation once. No transient binding is saved or imported.

## Formulas

Initial JSON-authored body:200Life,+20Life per additional paid rank;20Defense;0Attack/MP/attackSpeed/crit/dodge/find,crit multiplier1,all six resistances0. Shared friendly summon MagicResist remains authoritative. Life at ranks1/2/20 is200/220/580. Lifetime8000ms,+500ms per additional paid rank; ranks1/2/20 are8/8.5/17.5s. Do not copy owner equipment stats or grant Necromancer masteries. These are explicit provisional v1 tuning choices, not pre-existing balanced values.

Preserve level24, prerequisite SlowMissiles, cap20,base15MP with−0.1/rank and base4sCD with−0.05/rank. Existing rounding yields rank1/20 payment15/13MP and4/3.1sCD. A real paid BattleCommand bonus changes captured body Life/lifetime/ranked payment once without changing allocation; it never learns/unlocks the skill. No inert passive dodge scaling remains advertised for this active utility.

## Edge cases

No enemies,dead hero,unlearned/unselected/wrongclass/level/prereq/malformedrank/nonfinite resources create no body/payment. Alias duplicates pay once. Insufficient mana never retries after regen. Forged/preloaded same-template bodies remain ordinary unprivileged units and do not block a real paid Decoy. Never schedule an authenticated Decoy, even through reconciliation; only actual paid bindings grant targeting priority and finite expiry. Enemy AoE may still hit hero/merc. Body death and exact expiry each stop diversion before later hostile targeting. New waves rebuild from fresh configuration/carried resources; mid-wave allocations do not rewrite recordings. Save version unchanged; imported configuration creates a fresh body only on a later paid preparation.

## Dependencies

Closed skill schema/JSON → copied/frozen definition → native rank projection → validated startup payment → private Decoy registration/lifetime → existing target/damage/death/playback. Shared definition supplies pure current/next/MAX previews; en/zh-CN copy states start-only cost,life,duration,non-attacking body and single-target limits. Existing summon-name/art fallback is reused; no image generation. Desktop/mobile allocation/body/save/offline proof is required.

## Tuning knobs

Feel: duration1000–60000ms and rank growth0–5000ms. Curve: complete JSON body stats and nonnegative Life growth. Gate: existing unlock/prerequisite/cost/CD. Initial200Life/20Defense and8s lifetime provide bounded distraction; earned build/TTK/resource tests must ratify them before balance acceptance.

## Acceptance criteria

Existing retained actual rank1/20 no-body REDs; strict schema rejection/copy/finite rank tests; real native allocation→time0 paid body and target/damage traces; no body actions/ordinary recasts/refunds/retry; alive/dead/exact expiry/taunt/AoE/forged-template/ownership controls; immutable recorded/unrecorded A-A/A-B-A replay; paid+1 provenance; current-wave freeze,next-wave and save/import configuration-only tests; bilingual truthful current/next/MAX/public body/save/offline proof; affected engine/static and one final combined full support gate,retention and exact cleanup. Independent review, balance and whole-app acceptance remain separate.

## Author checks before implementation

Security check:pass; first-party local engine/data/UI only, no credential/network/dependency/CI/permission change. Plan-review:ready after enforcing start-only preparation,paid private authority,inert scheduling,explicit taunt/AoE limits,exact expiry ties and no source/save mutation. DESIGN-REVIEW:CONCERNS. Eight sections are executable and combat invariants preserved; referenced pillars document is unavailable. New Life/lifetime tuning,independent review and earned balance remain open. No independent self-approval is claimed.
