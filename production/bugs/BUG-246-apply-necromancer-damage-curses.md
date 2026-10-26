# BUG-246 — Apply Iron Maiden, Life Tap and Lower Resist to damage settlement

- Status: Fixed locally in29191112/a6f9e19b/e165a1dd, shared-log fixture65d055f7; locally verified with three bounded skill credits. Independent design/QA and earned balance remain open.
- Severity: High — three advertised paid skills have no corresponding damage effect.
- Owner: root, engine/content/frontend; independent design/QA and earned balance open.
- Base:7883b882; Node24.21.0, Vitest1.6.1, real native adapter/registry/recorded engine.
- Browser/viewport: native-engine reproduction is locale-independent; corrected production verification covers en/zh-CN at desktop1280×800/mobile360×640 and five-size geometry.
- Seed:1; learned native ranks1/20 with actual transitive prerequisites.

## Reproduction

1. Run src/stores/necromancer-damage-curses.causal.test.ts.
2. The L30 native Necromancer casts once400ms and pays the exact existing cost:
   Iron Maiden11/6MP, Life Tap9/5MP, Lower Resist22/16MP at ranks1/20.
3. Iron Maiden: a cursed enemy deals100Physical HP damage500ms; no reflection occurs.
4. Life Tap: a merc removes100HP from the cursed enemy500ms; no healing occurs.
5. Lower Resist: a merc's100base hit against50% resistance/10flat mitigation
   still deals40, across all seven damage types.
6. Matched inert-effect controls retain the same real action, payment, cadence
   and damage. Twelve ownership/level/prerequisite/rank/resource/CD/no-target
   controls pass.

Expected: each advertised effect changes actual combat. The explicit provisional
[author contract](../../docs/plans/decisions/D04-damage-curses-v1.md) chooses
100% Physical HP-loss reflection,25% direct HP-loss healing and30percentage-point
all-resistance reduction, each3000ms. These numbers are new author choices,
not recovered prior numeric authority. Expected native outcomes are100reflected
damage,25healing and70direct damage respectively.

Actual: all three apply generic one-second markers without potency or consumers.
Terminal RED18failed/12passed,exit1,7.691s; original assertions retained.
Raw logSHA256:a125d35d90f914a73244563b996597e96d6274acd6fc203057a26b9c09c62915.
Task packet:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-damage-curses-ef0g_tk9.

## Root cause and scope

The three authored rows have only appliesStatus; the generic adapter emits
unconfigured debuffs, unknown defaults last1s, and damage settlement never
consumes these IDs. Repair complete authored metadata, copied paid packets and
the shared actual damage/resistance/healing settlement. Do not buff other skills
or alter assertions around the inert markers.

No genuine campaign/replay, external publication, save22, dependency or CI change.
Independent/earned acceptance and C2-C4/G0-G7/privatev1 remain open.

## Fractional absorption follow-up

Before local closure, a new meaningful counterexample on a6f9e19b uses eligible
Bone Armor with99.5remaining against100Physical damage. Actual HP removed is0.5,
but the inherited reflection minimum rounds pure Iron Maiden up to1 instead of
its contracted floor0. Ordinary Thorns intentionally retains its existing
minimum1 and must stay unchanged. Seed1 regression RED1failed/44passed,exit1,
3.793s; logSHA256:d40cb9bbb115c0d4753182d8c565c4d030ba6943a0c3fe5cef0096717357b520.
The complete twelve-case browser pass predates this edge repair and is retained;
final source/build/browser/full-unit proof must cover the correction.

## Corrected implementation and local verification

Core29191112, presentation/native/publica6f9e19b and fractional reflectione165a1dd
replace the inert markers with complete JSON-owned, finite paid packets and
shared actual damage/reflection/healing consumers. Pure curse reflection now
floors the0.5HP basis to0; ordinary living Thorns keeps minimum1. Latest focused
231/8PASS includes138new cases. Engine8691/325,types/lint/purity, official build,
bridge removal and actual756URLprecache pass. All1585committed source blobs and
762build files match tested freezes; protected genuine save hashes are exact.

Final public browser12/12PASS588.764s with no retries/skips/flakies/page or
console errors verifies12localized casts/chips,24exact six-domain save pairs,
12actual SW offline Continues and60geometry samples. All24PNGs were inspected;
clipping/black-region capture and broader UX/a11y limitations are explicit.
Synthetic browser/native states do not establish earned balance or builds.
Corrected full17513passed/794files/two existing skips,exit0,737.693s; latest
types96.426s/lint163.883s pass. Exactly three bounded credits:158bounded,
53unverified/one engine-only/one review-needed; Necromancer16/32,210other raw
CSV rows/header/IDs/order exact. Verified raw retention/cleanup follows below. [Evidence](../../docs/plans/evidence/d04-damage-curses.md).

The first complete full-unit run on the fractional repair finishes with one
stale existing log-copy oracle:1failed/17512passed/two existing skips in794files,
exit1,734.789s. eventToLogI18n.test.ts still expects Chinese Life Tap偷取生命,
while the intentionally aligned combat label and pre-existing skill name both
use吸取生命. Retain that RED and correct only the literal table entry, keeping
exact message equality and both locale matrices. Production/engine/browser
bytes are unchanged by this fixture correction. The corrected focused shared-log/component suite passes138/2,9.928s, followed
by the complete full PASS above. Actual1585HEAD source blobs match65d055f7;
all762build files remain exact. No production bytes change in the oracle fix.

Final retention/cleanup:184raw archive members/41terminal receipts byte-verified;
1059exact task-owned files/57directories removed. All71recorded identities absent,
no task consumers,4529closed, task root/dist absent,remaining[]/failures[].
[Cleanup receipt](../../docs/plans/evidence/fixtures/damage-curses/cleanup.json)
and [retention](../../docs/plans/evidence/fixtures/damage-curses/retention.json).
Root retains the four exact paths listed in the evidence until BUG246/full-v1
consumers finish. No genuine campaign/replay or remote operation occurred.
