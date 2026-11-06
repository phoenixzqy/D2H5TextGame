# BUG-572 — Resume interrupted training without replenishing its allowance

- Severity: Medium; automated earned-campaign continuation.
- Status: Fixed in the campaign helpers; native continuation separately bounded.
- Owner: campaign training helpers, root sole writer.
- Source authority18; production/data unchanged.

Exact Act V checkpoint1195 is level52 after249 completed, victorious Foothills
farms. The declared pre-Crystalline stage started946 at level46; it has spent
26,868,865.951 of43,200,000combat-ms and249 of600 admissions. Its journal limit
interrupted a post-farm diagnostic, not native combat. All audits pass.

Calling fresh preparation again would erase counters and grant another full
600/43.2M allowance. There is no authenticated training-resume API.

Correction: validate the original stage/request, all settled historical waves,
XP/ordinal/time equality to live state and actual cleared farm before mutation.
Seed the shared training loop with cumulative admissions/wins/losses/trailing
losses/from-level. Keep original request/clock origin and produce a cumulative
checkpoint audited over old+new waves. Reject unfinished admissions and corrupted
or mismatched history. A victory resets carried consecutive losses normally;
total/admission/time exhaustion permits no new admission. Original checkpoint
is immutable. Default fresh callers retain their behavior and entry-owned gear
mode remains available. Resume only a settled boundary, not an active native run.

Plan review: ready; existing pure wave/XP/time auditors and native allocation/
entry services provide the authority. Focused training/resume cases verify
counter conservation, loss reset, exhaustion and pre-mutation refusal. No prior
combat, reward, source save or earlier quest is replayed.
Security check: pass; local helper/test changes, no dependency, credential,
permission, network, CI or publication action.

Evidence: `p15-javelin-act5-earned-continuation-v1.json` and
`p15-javelin-act5-retained-budget-v1.json` in the shared evidence packet.

## Implemented and focused verification

`resumeJavelinTraining` authenticates settled history before mutation and seeds
`trainCampaignBuild` with the original counters and outcome. Cumulative XP,
ordinal and combat-time origins remain unchanged; original checkpoints are
immutable. Twelve focused cases cover continuation, consecutive-loss reset,
total/consecutive loss exhaustion, admission/time exhaustion and six corrupt
checkpoint/live-state refusals. They pass alongside31ActV resume cases.

The first attempted discovery returned no files; it was not a functional RED.
The workspace now explicitly discovers the new suite. The first discovered
10cases and final12cases pass. Scoped strict types and explicit lint pass after
retained style/type corrections. Authority19 records the explicit discovery
configuration transition;2090other original provenance inputs and game data
remain unchanged. The native exact1195 continuation uses these helpers and the
original remaining allowances; its terminal result is recorded in the linked
[resume report](../../docs/balance/2026-11-02-javelin-act5-resume.md).
