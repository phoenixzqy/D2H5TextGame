# BUG-634 — Martial recovery priority suppresses offensive charge delivery

Status: Closed investigation — both ordering hypotheses rejected; no engine defect established. Severity: Medium. Owner: root (campaign policy).

## Reproduction and diagnosis

Native Node24/WSL, production tree
`12ce40578164070e187a017daa00c91d15a209bacbd258f17817bfea94e1a88d`.
The rejected BUG633 paid-Web trial retains three nonvictories: Burial Grounds
ordinal104 W3, Catacombs118 W5 and Catacombs130 W5. Final draw starts at14;
Cobra18/Web11/Fists4/Talon5, minimum198of218Mana, one elite survives226Life.

Expected: an intended Martial build deliberately delivers offensive charges and
uses recovery without spending nearly every builder opportunity on Cobra.
Actual: first-eligible priority puts Cobra and Web before Fists. The retained
last wave's first three Cobra successes saturate its pool before any Fists cast.
The documented any-full-pool saturation then forbids all builders until release.
D05 and runtime agree; no engine charge/selector defect is established.

## Prospective bounded diagnosis

Use all three retained failed inputs, reproduce complete native events/final
teams first, then compare exactly one ordering: move Fists directly after Burst,
ahead of Cobra and Web, retaining every other input and skill/projection. Six
battles total, no source/policy edit, earned replay, new grants or seed search.
Require no original defeat/draw regression, at least one failure-to-victory,
positive Fists and Talon execution before considering a separately planned
campaign correction. Loss of Cobra recovery is a specific risk to measure.
This conditional comparison is not campaign or balance acceptance. Packet prefix
`p15-martial-offense-order-v1`; root retains required evidence through umbrella
review and owns exact task-cache cleanup. No agents/install/commit/CI.

## First ordering diagnosis — rejected

All three controls reproduce complete native events/final teams. Fists before
Cobra/Web wins Burial104, but removes all Cobra casts and changes Catacombs130
from draw to defeat (elite106Life). Catacombs118 remains defeat. No policy edit
or fresh campaign followed. Exact input-only-order readback passes, source is
unchanged and task cache is absent. This proves offensive selection competition
and the need to retain recovery; it does not justify removing Cobra.

## Second fixed comparison — prospective

Preserve Cobra before Fists and move Fists ahead of Web. Cobra recovery remains
selected, while Fists uses the turns between Cobra cooldowns. Reuse the three
fully authenticated unchanged-source controls from the first study; run only
three new candidate battles on all original failed inputs. Require no
survival/outcome regression and at least one failure-to-victory before a
separately planned earned route. No seed/parameter/point/engine changes. Prefix
`p15-martial-interleaved-order-v1`. This is a new diagnosis-driven policy
correction, not adoption of the rejected Fists-first order.

## Second comparison — rejected; priority hypothesis not adopted

Authenticated prior controls are reused without combat replay. Three candidate
battles produce no new victory; Catacombs130 changes draw to defeat. Cobra casts
remain, but replacing Web with more Fists loses useful crowd control. Input-only
order readback passes, all production/campaign sources remain unchanged and cache
is absent. Both order hypotheses are closed without policy edits or new earned
campaign. This issue stays Open as a diagnosis record, not a confirmed selector
bug. Preserve recovery/Web order; BUG635 investigates early skill investment.

## Closure — 2026-11-03

Both negative ordering studies are retained. The successful integrated BUG635
correction preserves Cobra→Web→Fists and changes early point investment instead.
[Verified result](../../docs/balance/2026-11-03-martial-finisher-investment.md)
clears Act I13 with full readback. No selector/saturation change is warranted.
This closes the investigation, not a broad Martial balance gate.
