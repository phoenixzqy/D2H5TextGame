# BUG-043 — Validate synchronous quest consumers before returning rows

Status: fixed in this P04a03b commit; root/producer/QA final combined APPROVE/ADEQUATE.
Runtime a167d00f/testa53a9807; regression src/data/loaders/quests.test.ts.
Severity: Medium (bundled content validation bypass; no current save corruption demonstrated).
Owner: content-designer / engine-dev; producer and independent QA review.
Card: P04a03b, synchronous quest loader boundary only.

## Reproduction

Input head c0877aa; Node24.21.0, Linux, Vitest ui/jsdom. Browser viewport,
locale and engine seed are not applicable to synchronous document validation.
Actual runtime loader is unchanged from297550a and directly casts bundled
main/side JSON despite the accepted central schema prerequisite b4d2764.

1. In an isolated nonconcurrent test worker, preserve exact descriptors and row
   references of imported quests/main.json and quests/side.json.
2. Replace one envelope with a schema-invalid row: clear-area without areaId,
   unknown objective kind, negative/fractional/string XP, or unknown quest field.
3. Call actual loadQuests() or loadQuestsByAct(); restore both exact documents
   in finally. Repeat for each document/caller.
4. Repeat with duplicate IDs within either document/across documents and
   valid→invalid→valid calls. No runtime loader mocks, source JSON edits or saves.

Expected: reject before returning/collecting any rows; errors identify the
document and schema field or duplicate ID. Both complete envelopes validate
before duplicate collection. Preserve valid rows/order/identity and helpers.

Actual: all24 malformed-row cases return successfully, six duplicate cases
return successfully, four revalidation and two validation-precedence cases
fail to throw. Four missing-envelope cases already throw uncontextualized
TypeError; those context failures are supplementary rather than accepted-invalid
behavior. Five compatibility controls pass, including all46 authored rows.

## Evidence before fix

`npx vitest run --project ui src/data/loaders/quests.test.ts --reporter=verbose`
initial RED exit1,40failed/5passed/45total,0skips; runner1.37s/wall2.618s.
Test draft SHA0e243a2c2f02f9ce474627d01760b0ce65edcb32eddb3b6fbdbc7d9c97dd840c;
log SHA3e20e57cc432918f3cf478c180a76e4c51c9a0bd86c8c923cc73f16995791259.
Typecheck passes9.705s. Initial scoped lint reports one void-arrow shorthand
at line93; braces-only correction preserves every assertion and behavior.
Frozen test SHAa53a98073beb0cc52c1a1ad4392365a4185bfe05b5e8c77be30bb0c98a8ad69b.
Frozen RED repeats40failed/5passed/45total,0skips; runner1.46s/wall2.697s.
Frozen RED log SHA418da234efc8de3038b50a14552cd77a2716880ae117bcb40c0753222935c86a.
Corrected scoped lint passes5.148s; no runtime edits before independent review.

Raw root: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-sync-quest-vrg73hnd.
Contains check.py, initial test draft and sync-quest-*.log/result.json.
Root owns cleanup after all independent consumers finish and decisive results
are versioned. No browser/server process or shared cache cleanup.

## Root cause and bounded plan

src/data/loaders/quests.ts trusts two casts and spreads rows directly. Consumers
QuestsScreen, claimReward and mapStore do not call the central async loader.
Compile the existing quest schema with strict Ajv2020 once, validate both full
unknown envelopes every call, then reject duplicate IDs before returning the
fresh shallow-frozen array. Preserve sync APIs, row identities, order, grouping,
helpers, valid optional/zero/unsupported gameplay shapes. No schema/type/content,
reward execution, cross-reference, objective-ID uniqueness or save changes.

Security check: pass. Scope is local bundled document validation and isolated
test inputs. No credentials/network/permissions/dependencies/export changes,
validation bypass, external commands or destructive operations requested.
Workaround: central loadGameData validates, but does not guard these consumers.
Full quest delivery and D10/D11 contracts remain separate.

## Implementation and current validation

Independent producer/QA frozen RED verdicts APPROVE/ADEQUATE before source
edits. One-file runtime fix implements the bounded plan above; frozen tests
and schema unchanged. All45 synchronous cases now pass. Combined focused268/5,
separate correct integrity30/1, related595/48 and full/coverage2261/134 pass.
Typecheck/full lint/purity51 and production build/bridge-shake pass.
Unchanged80% engine-only gate passes; data/store behavior is not measured by it.
[Exact commands, hashes, timing and limitations](../../docs/plans/evidence/p04a03b-synchronous-quest-validation.md).
Runtime/frozen-test independent final combined reviews APPROVE/ADEQUATE.
All consumers finished; exact raw root/dist/.vite removed and absence verified.
