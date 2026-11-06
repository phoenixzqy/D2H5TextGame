# P15 — Frozen authored elite-copy budget screen, v1

Provisional2026-10-30, BUG447. Two actual earned L24 LostCity W4inputs have
identical19-body enemy roster but native inherited739HP/551HP and different
priority/ally/cooldown states. Test enemy copy budget without repairing these.

Reproduce all8actual waves across both policies exactly through current native
planner/factory/geometry and event/terminal controls. Source W4has4authored
bodies. Candidate keeps those first4elite bodies, makes only15additional fitted
copies trash and rebuilds all stats through the existing factory. No manual
HP/attack/defense/MR edits; no affix/skill/archetype/index/level/RNG/count changes.
Keep all19bodies/order, actual teams, inherited HP/MP/cooldowns and runSeed.
Compare native and authored-core across original+32fixed seeds for each failed
input:132rows/8exact controls. Require both originals win and≥26/32grid wins
for each before considering adoption. 240s internal/300s wrapper; immutable
inputs/source, raw input/output/event hashes, exact process/cache cleanup.

This is constructed frozen screening only; not earned recovery, full-area or
holdout/14build/pacing acceptance. A global fitter change would also change
ordinary ActI elite-copy outcomes, so the prior346-wave exact earned prefix
would become historical and must not be silently reused as current acceptance.
Any implementation must separately freeze before/after plans across all acts,
legacy/boss/quest/endgame/promoted controls, add genuine RED and scoped GREEN,
local types/lint/build and appropriate regressions, then fresh earned progression.

Plan review: ready for screening only. Native inherited attrition and current
explicit unpromoted-flag contract are acknowledged; no per-area/stat workaround.
Security check: pass; local isolated state, no protected saves/network/installs/
publication/new agents. Root sole writer; no commits/push/PR/CI. No permission
question is pending; implementation eligibility depends on observed screen.

Authored-copy screen v1 technical PASS11.022s,8exact planner/factory/geometry/
event/terminal controls and132rows. Four-authored-elite/15trash-copy candidate
wins both original inputs (739HP/13.356s and269HP/22.500s). Grid32/32 and14/32
versus native15/32 and1/32. The declared both-input≥26/32criterion is not met;
no runtime adoption or full-area acceptance. Source/cache/descendants checks pass.

Next isolated screen distinguishes explicit authored elite markers from wave-
level fallback. Only two scarabs in raw W4are elite:true; two GreaterMummies
have no elite flag but inherit waveTier:elite. Compare native, prior four-body
core and explicit-two-elite core with all other fitted copies ordinary. Preserve
all bodies/order/IDs/levels/RNG/resources/skills/cooldowns and existing factory
coefficients; rebuild stats natively. Same8controls/original+32grid per arm and
case,198rows, same both-original+≥26/32criterion. This is diagnostic only; a
runtime change would require a separately reviewed explicit-marker/fitting
contract, regressions and full source/earned follow-through. No product edits.

Explicit-marker screen technical PASS13.845s,8exact controls/198rows. The new
2elite/17trash candidate wins both originals (739HP/16.500s and345HP/22.500s),
but grid32/32 and13/32 still miss the declared both-input≥26/32criterion.
Repeated native/four-core rows remain unchanged; neither candidate adopted.
No runtime/data edit. Next inspect unused owned Rogue shield preparation under
BUG448 before inferring that player gear cannot recover this physical burst.

Owned-shield screen technical PASS10.417s/8exact controls/132rows. Native
composition verifies defense175→203, physDodge.19→.23, cold43→57,
poison42→58 and manaMax328→335; lifeMax739→711, attack96→82,
crit.15→.10/critDamage2.32→2.16; speed125/MR24 unchanged. Original first input
wins380HP/34.500s but second still loses5.774s. Grid17/32,2/32 vs15/32,1/32;
declared criterion not met. No native transfer/adoption or monster change.

Next small factorial screen compares native, shield only, authored-four-body
core only and shield+authored-core together across both exact inherited states.
Keep all8native controls and original+32grid per arm:264rows. Same actual owned
shield/native stat loss/clamped resources and same19-body/four-elite projection;
no new coefficients or additional tuning axis. Both original+≥26/32each required
for any combined candidate. Distinguish legal player preparation from a proposed
runtime clone-budget change; neither is full-area/campaign acceptance. Current
separate-arm failures remain. Exact source/input/process/cache checks as before.
