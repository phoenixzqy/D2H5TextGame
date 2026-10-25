# BUG-195 — Apply the advertised Druid summon effects

Severity: High — four advertised summon behaviors have no combat consumer.
Status: Reproduced; local repair contract recorded; implementation pending.
Owners: engine-dev / content-designer / frontend-dev; root sole writer.

## Reproduction

Base `70a8d5666a660e14ed56399183aa7dce74343b2c`, Linux/Node24.21.0,
seed7, native `playerToCombatUnit` and actual registered combat. No browser;
both locales promise Raven blind, Poison Creeper poison and corpse-backed
Carrion Vine life / Solar Creeper mana recovery.

1. Project a synthetic L30 Druid with each skill at rank1 or20, all direct and
   transitive learned prerequisites, and that skill as the only selected priority.
2. Isolate the hero and two enemies with disclosed permanent holds. Keep the hero
   at500/10000HP and100/1000MP with ordinary mana recovery disabled. One enemy has
   1HP and the other1000000HP, zero mitigation/dodge, so actual summon attacks
   supply one primary monster death without ending the battle.
3. Run seed7 for the ordinary60s budget; inspect summon attacks, status/damage
   types, corpse consumption, final HP/MP and exact payment. Subtract ordinary orb
   restoration before attributing recovery to a vine. Repeat from unchanged input.

Expected: Raven attacks actually blind; Poison Creeper causes positive poison
HP loss; useful Carrion/Solar recovery consumes a finite earned body and restores
owner HP/MP. Exact tuning and scheduling require the controlling contract below.

Actual: all eight native configuration, count, one-payment, positive summon
attack, actual monster-death and immutable deterministic replay controls pass.
Only the eight promised-effect assertions fail. Raven ranks1/20 spawn1/8 bodies
and produce32/227 positive attacks but zero blind events. The other summons each
produce29 positive physical attacks at both ranks. All cases have zero positive
poison events, corpse-consumption events and net HP/MP recovery. Seed7 produces
zero hero orb recovery here; the observer still explicitly accounts for orbs.
Command exits1 in4.909s, with eight retained assertion failures.

## Cause and evidence

All four factories build ordinary physical attacking bodies with empty skill
orders. No source-qualified on-hit or recovery policy is attached. The corpse
collector is activated only by CE/PE/Redemption, so native vines cannot join that
existing shared pool. Merely spawning a named body does not implement its effects.

Original script/result/log/terminal receipt and source hashes are task-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-druid-summon-yiktbzny/`.
Root retains them through repair verification, then archives their exact bytes
and removes that exact scratch after all consumers finish. No workaround,
genuine campaign or remote action. Independent design/QA and earned balance open.

Contract: [Druid summon behavior](../../docs/plans/decisions/D06-druid-summons-v1.md).
