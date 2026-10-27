# D06 — Dragon Flight blink and kick

2026-10-27. Provisional author contract; root sole executor. Independent design/QA and earned numerical acceptance remain open. No full-v1 scope reduction.

## Overview

Complete Dragon Flight's missing movement adaptation while preserving its existing single-target Physical kick and real martial-finisher releases. Adapt its teleport promise to the established no-movement convention: one paid cast grants a short magical-evasion blink. Current Flight scalar damage is not acceptance of that mechanic.

## Player fantasy

A brief evasive arrival followed by a forceful finishing kick supports the Assassin's tactical martial identity. The existing Sorceress Teleport adaptation (D05-sorceress-paid-buffs-v1) supplies the local precedent. Positions, area selection, range and movement-speed stats do not change.

## Detailed rules

Strict JSON owns initial provisional duration1000ms and additive magical-dodge fraction0.01 per effective paid rank. A valid ordinary Flight action pays unchanged15MP and CD2s once, captures paid rank, publishes a finite dragon-flight observation, then performs its existing Physical kick through normal deterministic targeting/hit/crit/mitigation/reflection/status/death and charge-release settlement. Existing damage is80–115/+7 per additional rank; requiredLevel24, max learned rank20 and Dragon Tail prerequisites stay unchanged. Blink begins at the paid action even if the kick misses; it is not conditional on damage. Misses still do not consume martial charges. A target killed by the kick closes death/corpse/orbs once; a reflected lethal hit stops the dead source's blink.

Use native selected Assassin martial authority with fresh level and transitive prerequisites, or this battle's committed paid Shadow Warrior attack binding. Preserve the existing Master pool; Flight is not silently added to it. Shadow copies use their own captured rank, MP and CD, and stop receiving blink power if their original owner dies. Reject wrong source/side/kind/role, invalid rank, missing allocation/prerequisites, altered registrations, nonfinite/out-of-cap resources and either alias's live cooldown before payment; never silently perform a scalar Flight fallback. Existing native projection, exact full martial registration matching and paid shadow binding are reused rather than trusting a visible marker.

Paid windows live privately in the battle. Imported/preloaded dragon-flight markers are stripped and cannot grant power, block a cast or carry into another wave. Each source has at most one window. Active windows skip recasting, although preserved CD2s already exceeds the initial1s duration. Dead/hostile sources and shadows with dead owners have no active bonus. A new valid cast after expiry pays again and replaces its own old window. No effect is applied to an ally, target or unrelated summon.

## Formulas

Magical dodge bonus = captured paid rank × JSON magicDodgePerRank; ranks1/2/20 grant1/2/20 percentage points for1s. One actual paid Command bonus produces rank21/21points from a learned20; it does not grant learning or double an already-captured shadow rank. Add the bonus to the existing magical-dodge pool and preserve existing hit floors/shared RNG; no guaranteed dodge or extra random draws. Physical/Thorns hit checks and already-applied periodic HP settlement are unchanged. Kick base at ranks1/2/20 is80–115,87–122,213–248. Exact MP/CD are unchanged and paid only once for blink plus kick.

## Edge cases

The half-open window [cast,cast+duration) expires before attacks at its endpoint. Include the expiry in the scheduler so observation removal occurs exactly even without an intervening action. Control after payment does not cancel the blink. Source death or original shadow-owner death removes visible state and power. Valid flight uses ordinary targeting; no special target preference or movement is invented. Preserve positions, base stats, input objects, prior recordings and deterministic recorded/unrecorded results.

New native waves refresh learned/selected authority and start without a paid blink; ordinary MP/CD carry remains exact. Flee, death, town respec, fresh/imported/reopened runs also start unpaid. No save version/schema bump and no persisted paid windows. Preserve simultaneous target/death order and partial shields. Bare statuses and copied event logs never reconstruct private state.

## Dependencies

Closed JSON/schema and immutable definition → existing martial/native-shadow authority → private paid window at cast → normal magical-hit input → existing exact status-state/playback → shared bilingual skill stats, description and combat chip. Previews use complete authored templates and the same validated timing/potency; current/next/MAX include real damage, dodge, duration, single payment, miss behavior and next-wave reset. No images, dependencies, networking, CI or campaign edits.

## Tuning knobs

Feel: durationMs integer1000–60000, initially1000. Curve: finite positive magicDodgePerRank, initially0.01, with effective maximum-rank product≤1. Gate: existing unlock/prerequisites/MAX/mana/CD unchanged. These values implement a functional movement adaptation; they are not earned TTK/build/economy signoff. A larger duration may make the active-window recast gate material.

## Acceptance criteria

Retain native ranks1/2/20 failing blink observations and a passing paid Physical-kick control at seed7. Add causal seeded magical hit differences, additive dodge, unaffected Physical/Thorns/DoT, exact start/before/at expiry and no extra RNG; normal miss/crit/defense/shield/reflection/target death and actual paid charge discharge. Verify exact payment/CD/recast, active control, dead source/owner, no target/MP, both aliases, malformed definitions/tuning/resources, wrong class/unlock/transitive prerequisite/registration/role and forged markers. Prove real paid Warrior Flight and Command20→21 exactly once, immutable config/rank, fresh wave/reset and preserved MP/CD, flee/import/respec/save behavior. Bilingual current/next/MAX/component and actual production mobile/desktop rank1/20 cast, visible blink and positive kick; exact seven-domain save/online and actual service-worker offline Continue. Record visual limits and original failures. Scoped engine/types/lint per increment, one fresh whole/static/build gate at stable integration. Constructed fixtures do not establish earned campaign, whole-app mobile/a11y/performance/soak or independent acceptance.

## Execution and author challenge

Document the native reproduction as BUG310 before source changes. Source increments≤5paths: closed tuning/schema/definition/tests; native/private runtime plus causal regressions; observations/previews/locales; native lifecycle/paid Warrior/Command; final production and evidence. Keep docs separate. Preserve original failures, exact inputs and genuine campaign hashes; archive/read back and remove only enumerated task-owned artifacts when consumers finish.

Security check: pass for authorized deterministic local data/engine/UI/test work; no credentials, dependencies, networking, permissions, CI, save schema or campaign changes. Author plan review: revise until miss-time payment, private provenance, alias cooldowns, exact expiry observation, shadow rank/Command ownership and reset-versus-CD carry are explicit; the contract above resolves those omissions. DESIGN-REVIEW: CONCERNS. Eight sections are present; pillar/anti-pillar files are absent, tuning needs earned numerical evaluation and independent design/QA remain open. This author challenge is not independent approval.
