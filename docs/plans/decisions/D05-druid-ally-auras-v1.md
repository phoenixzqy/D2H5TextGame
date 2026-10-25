# D05 — Druid allied passive auras

Scope: Oak Sage and Heart of Wolverine; BUG188. Local implementation contract;
independent design/QA and earned build/balance acceptance remain open.

Preserve authored coefficients/unlocks/cap20/prerequisites: Oak is level6 with
3% life capacity per rank. Heart is level18, requires learned Oak, and gives3%
Attack plus0.5percentage-point critical chance per rank. Stale fixed50%/30%speed
prose is explicitly replaced; no new speed coefficient is invented. Both remain
automatic passive allied auras, not personal-only stat replacements. Spirit of
Barbs owes its advertised summoned spirit and separate coefficients/creation path.

Native current-class/integer level/allocated exact aliases/MAX once/cap and full
prerequisites determine a frozen per-wave projection bound to the original hero.
Recipients are living source hero, original fielded merc, and source-owned living
summons; foreign/bench/dead/opponent/forged owners cannot inherit it. Both learned
passives may coexist; no new selection/cost/action/RNG or save field is invented.
Owner death disables effects immediately; crowd control alone does not.

Heart modifies real basic/ranged Attack and Attack-scaled effects, plus the existing
critical roll (including existing overflow), without modifying stored base stats or
adding a random draw. Fixed authored skill base damage stays independent of Attack.
Oak modifies actual life capacity for every eligible recipient, including newly
registered summons, not merely tooltips. Capacity gains never heal; real heals/orbs
can fill them. Source death/removal caps absolute HP before death-related orbs.

A shared pure capacity projection restores exact carried outer aura and inner form
baselines, then adds separately floored bonuses over one fresh equipment/quest
base. Form/Oak/Vigor must not multiply or repeatedly compound. Existing transient
form and Vigor metadata/event compatibility is retained; Vigor's outer capacity
slot also transports Oak and is documented as combined ambient capacity. This
avoids a third independent capacity writer. Form state selection is separated from
capacity settlement internally; existing standalone form helper semantics remain.
Native wave composition preserves the fresh-base snapshot and original absolute HP; the engine performs the single final combined-cap settlement after complete party registration. Ordinary units without a pending temporary layer still clamp to fresh equipment capacity.
The complete initial status prefix precedes any capacity event; spawn events and
playback must expose the same actual capacity. Current recordings are frozen;
learning/ranks/respec/equipment apply next wave and original-resource replay stays
repeatable without duplicate income. Save22 persists allocations only.

Plan review: ready with the shared-capacity prerequisite above. Implement and prove
native causal RED; pure eligibility/tuning; shared form+ambient capacity; real allied
engine damage/healing/source death/spawn; native wave/replay/save; truthful en/zh
current/next descriptions and visible aura chips; production mobile/desktop and full
checks. Do not credit either row before its complete functional evidence passes.

Security check: pass. Local pure engine/store/UI/data/test work; no credentials,
network integrations, permissions, external execution or weakened validation.
Keep existing strict source ownership, seeded RNG and save validation. No remote
publication or genuine campaign action is authorized in this batch.
