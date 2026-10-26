# BUG-247 — Apply paid Terror fear to real combat actions

- Status: core locally implemented; native/finite/control/channel checks pass. Engine8737/326/types/lint/loader pass; presentation/native lifecycle/public browser and final full validation remain open, no credit.
- Severity: High — advertised paid fear has no combat consequence.
- Owner: root engine/content/frontend; independent design/QA and earned balance open.
- Build:ab03db65f7b8d1408840df8d92ec91f7f7a81a81; Node24.21.0/Vitest1.6.1.
- Browser/viewport: native engine repro is locale/viewport independent; production en/zh-CN desktop/mobile verification still required.
- Seed:1; real registered native L30 Necromancer ranks1/20 with Amplify→Weaken→Terror prerequisites.

## Reproduction

1. Run src/stores/necromancer-terror.causal.test.ts.
2. Native casterAS263 acts400ms and pays7MP once. Hold it from401ms.
3. EnemyAS250 ordinarily acts every500ms, held only after4501ms. Run trash,
   boss and chapter-boss cases at actual learned ranks1/20.
4. Compare with the same registered native skill whose effect alone is replaced
   by an inert marker; native cast/payment/cooldown and control inputs stay real.

Expected: under the explicit provisional [contract](../../docs/plans/decisions/D04-terror-v1.md),
1000ms fear suppresses trash actions500/1000ms, resumes1500ms without resetting
cadence, and results in500HP lost instead of700HP. Bosses receive500ms fear,
skip500ms, resume1000ms and lose600HP. Existing no-movement Howl establishes the
text-combat disruption precedent; these numbers are root-author tuning, not
independent/earned balance approval.

Actual: pays7MP but enemy still acts500/1000/...4500ms and removes700HP in all
six cases. No fear interruption occurs. Four native ownership/level/prerequisite/
rank/resource/cooldown/no-target controls pass.
Terminal RED6failed/4passed,exit1,7.286s; logSHA256:
a995751d8e0c5e52a9825645b97ed9e87813db2b9e20f0387f4cb6af0e795ab0.
Raw task packet:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-terror-7j9sws2f.

## Root cause and repair boundary

The authored row only emits an unconfigured terror marker; shared ordinary/
channel interruption has no Terror consumer. Add complete authored finite
metadata, a copied paid capability and one shared interruption predicate. Keep
terror identity, rank/unlock/prerequisites/mana/cooldown scaling and save22.
Do not introduce movement, allegiance or a global accuracy penalty. Refresh,
Cleansing, bosses, boundaries, channel cancellation and truthful bilingual
previews/native/public save/offline paths require proof before bounded credit.
No genuine campaign/replay or remote operation is authorized by this increment.

## Core follow-up

Complete finite JSON authoring, strict paid interval and shared action/channel
consumer now repair all six native behavior cases. Focused129/4PASS7.502s;
channel57/2PASS8.513s, including three actual paid stream/fear/Concentration/bare
controls with final playback agreement.59new regressions so far. Full engine,
types/lint/loader checks running. [In-progress evidence](../../docs/plans/evidence/d04-terror.md).
No complete skill acceptance or inventory credit; UI/native lifecycle/public
browser/full/build and exact retention/cleanup remain open.

First full engine8737/326PASS129.824s, typesPASS103.144s and actual loader292/1
PASS6.639s. One lint adapter boolean-expression finding is corrected by explicit
damageCurse !== undefined; no suppression or policy change. Original failure
retained. Corrected focused390/5PASS13.949s, engine8737/326PASS144.196s,
typesPASS124.333s and lint/purityPASS202.964s;1589source paths exact, only Terror
data metadata changes, inventory unchanged. Presentation and full skill remain unfinished.
