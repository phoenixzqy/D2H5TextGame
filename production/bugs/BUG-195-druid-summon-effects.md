# BUG-195 — Apply the advertised Druid summon effects

Severity: High — four advertised summon behaviors lacked combat consumers.
Status: Fixed locally in `c228627`/`5773a12`, verified through `73731ba`; independent design/QA and earned balance open.
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

Original script/result/log/terminal receipt and source hashes are retained in
the [byte-verified raw packet](../../docs/plans/evidence/fixtures/druid-summons/raw.tar.gz).
The [packet manifest](../../docs/plans/evidence/fixtures/druid-summons/packet.json)
and [cleanup receipt](../../docs/plans/evidence/fixtures/druid-summons/cleanup.json)
record exact retention and task scratch cleanup. Failed browser traces retain
exact text diagnostics and final frames with complete original member hashes;
other JPEG frames/full ZIP bytes are omitted. No genuine campaign or remote
action. Independent design/QA and earned balance remain open.

Contract: [Druid summon behavior](../../docs/plans/decisions/D06-druid-summons-v1.md).

## Runtime repair and observer correction

Local commits `5a0d029`, `5a073f6`, `c228627`, `06c9f50` move the seven
preserved templates into strict immutable JSON, derive transient native authority,
and implement source-bound Raven Blind, actual Poison and shared corpse recovery.
Standard full13766/603/two existing skips, engine7165/252, types/lint/production
build pass. All1332 source blobs match tested disk and committed HEAD. No inventory
credit was granted at that runtime-only checkpoint; independent design/QA and
earned balance remain open after the final presentation proof below.
See [runtime evidence](../../docs/plans/evidence/d06-druid-summons-runtime.md).

The original Poison observer searched direct damage events with type Poison.
That was the wrong event channel: periodic HP loss uses aggregated `dot` events.
Original RED still has zero positive DoT; repaired rank1/20 rows have62/65 positive
DoTs removing433/1301HP. Corrected proof requires positive later DoT, a positive
Poison-typed status rate and exact final target HP after direct plus periodic loss.
Both original bad-observer attempts and the corrected passing reproducer remain;
no direct Poison damage event was invented and mixed DoT is not relabeled.

## Final presentation and integrated proof

`5773a12` shows actual stats, cap, one-batch payment and effect rules in both
locales; `73731ba` adds actual boss refresh, owner death/orphan closure and
cross-battle corpse isolation tests. Final standard full13865/605/two existing
skips, engine7208/253, focused130/3, types/lint/explicit-false production build,
four-chunk bridge and756-reference precache checks pass. All1334 tested source
blobs match committed HEAD and disk; all760 build hashes and genuine save stayed
unchanged through the473.146s full run.

Production en/zh-CN × desktop/mobile passes28 positive summon combat entries,
eight exact five-domain Continue pairs and20geometry samples; all four Solar
cases require an actual paid Maul cast and a useful visible MP increase. The
fixture is disclosed synthetic L30/large-resource gear, not earned balance.
Exactly seven inventory rows gain bounded local functionality credit; all213
IDs/order remain, with122unverified/89bounded-functional/one engine-only/one
review-needed. Independent acceptance and complete class/build behavior remain
open. GenuineL33/next402 is unchanged, Baal uncleared; C2-C4/fullG0-G7/privatev1
remain open. See the [complete local evidence](../../docs/plans/evidence/d06-druid-summons-runtime.md).
