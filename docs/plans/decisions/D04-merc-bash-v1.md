# D04 — Native Act V mercenary Bash

Scoped mercenary-v1 contract reviewed by producer, 2026-10-28. Earned balance,
browser and feature acceptance remain open.

`docs/design/gacha-spec.md` §4.1 advertises the Battle Orders barbarian's two-hit
physical combo and 25% stun. Preserve authored flat 25–40, CD2s, zero MP,
unlock 1/cap 20 and no rank growth. Each ordinary attempt targets the original
selected enemy and resolves hit/base/critical, mitigation and minimum damage
normally. One action and cooldown pay for both; target or caster/reflection
death stops later attempts without choosing a replacement. Attack contributes
no additional damage, and Jab's physical bonus does not apply.

The previously unspecified chance granularity and duration are reconciled as
25% stun per landed attempt, no proc on misses, base 1000ms / bosses 500ms,
using ordinary refresh without stacking. Two landed eligible attempts have
43.75% probability of at least one proc. These details are scoped decisions.
Stun starts inclusively and expires exclusively on the simulation clock.

Use the existing hit-sequence and on-hit status primitives. Closed exact-ID
JSON/schema metadata and an immutable resolver replace only the Bash stub.
JSON `appliesStatus:['stun']` and `statusEffect:{chance:0.25,durationMs:1000}`
become frozen runtime `applyStatus:{id:'stun',chance:0.25,durationMs:1000}`.
No status ID belongs inside JSON `statusEffect`. Copy/freeze damage, sequence,
status and optional tags; register a real active skill in the default registry.
Both locales describe two hits, per-landed-attempt stun and boss duration.
Player Barbarian Bash, other mercenaries and basic attacks retain their contracts.

QA covers real loader/factory/projection/default-registry behavior with Battle
Orders retained, literal damage arithmetic, no Attack/rank scaling, independent
hit/critical/proc rolls, miss suppression, actual stun lifecycle/interruption,
cooldown boundaries/payment, early death/reflection, immutable deterministic
recording, public publication/playback and truthful locale descriptions.

This contract grants no acquisition, browser, earned campaign, pacing, economy,
build-matrix or full-v1 acceptance. H3 remains terminal; no browser retry,
protected fixture access or closed-policy execution follows.
