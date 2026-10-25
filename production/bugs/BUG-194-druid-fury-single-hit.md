# BUG-194 — Resolve Fury as a real sequence of attacks

Severity: High — the advertised repeated-attack mechanic has no runtime consumer.
Status: Reproduced; local contract recorded, repair pending.
Owners: engine-dev / content-designer / frontend-dev; root sole writer.

## Reproduction

Base `b3e9f3f7e3e5ca91429abbcfa643df6da7ebda05`, Linux/Node24.21.0,
seed7, native `playerToCombatUnit` and actual registered combat. No browser;
both en/zh-CN descriptions advertise a rapid series of attacks.

1. Project a synthetic level30 Druid with Werewolf→Feral Rage→Rabies→Fury
   learned, rank1 or20 Fury, and Fury as its sole active priority.
2. Isolate one scheduled cast at1700ms using a disclosed future hold,11MP,
   no mana recovery,100 attack speed and no critical chance. Use one living
   held10000HP enemy with zero mitigation/dodge.
3. Run `runBattleRecorded`; compare actual hero damage and enemy HP, action
   events and payment. Assert at least two resolved attack attempts.

Expected: one paid cast resolves multiple real attack attempts, each through
ordinary damage/mitigation. Exact strike count/target order requires an explicit
implementation contract before repair.

Actual: rank1 and20 each resolve exactly one attack, removing97 and249HP.
Both native configurations, one actual Fury action, exact11MP payment, input
immutability and actual-HP/damage consistency controls pass. Only the repeated
attack expectations fail. Native command exits1 in4.703s.

## Cause and scope

Fury has only ordinary area damage metadata. The generic adapter and damage
effect loop execute once per selected enemy, so one enemy receives one hit.
Multiple targets do not establish a repeated attack sequence. No hit-count or
sequence policy exists. A wording-only change would discard the advertised
mechanic. Synthetic stats/holds do not establish earned viability or balance.

The original reproduction script/result/log/terminal receipt are task-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-druid-fury-295j1qf_/`
until the repair's evidence publication; root will archive them and remove the
exact scratch after all consumers finish. No workaround, genuine campaign or
remote action. Independent design/QA and earned balance remain open.

Contract: [Fury and remaining Druid attacks](../../docs/plans/decisions/D04-druid-fury-wind-v1.md).
