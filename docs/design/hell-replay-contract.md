# Hell replay — source-backed postcampaign difficulty

Status: **ratified implementation contract**, 2026-10-27. Assigned
design-contract owner and producer technical/plan reviews APPROVE; security
check PASS. [Review evidence](../plans/evidence/hell-replay-contract-review.md)
records the exact proposed-body hashes. This is a D03/D08/D10 extension, not
runtime or balance acceptance.

## 1. Overview

Connect the already-authored Hell material profiles and fusion gates to a real
third replay profile. Use the same29 canonical maps with +40 monster levels,
derived access after the actual claimed Normal Eve source graph, independent
progress and native save24. This repairs BUG355's shared missing source: all33
runes and all32 fusion recipes require actual Hell authority. A new rune cache
would leave the fusion requirement unsatisfied.

Authority: [GDD §7.2](../../Diablo2TextGame.md),
[maps §11](maps-spec.md#11-difficulty-tiers-post-campaign),
[D03](../plans/design-decisions.md),
[D10](../plans/decisions/D10-material-economy-v1.md), and
[ADR-013](../decisions/ADR-013-source-backed-hell-replay.md).
This explicitly extends the two-profile boundary in the
[compact Act V contract](compact-act5-contract.md) and
[ADR-008](../decisions/ADR-008-act5-service-and-replay-state.md).
It supersedes maps §11's independent HP/damage/resistance/immune/TC bonuses,
not the GDD's level-only rule. Normal/Nightmare behavior stays covered by its
existing contracts. Worldstone's Normal profile and gem rewards stay separate.

## 2. Player fantasy

After defeating Baal and claiming the actual campaign reward, revisit familiar
places against stronger enemies and work toward the remaining runes and
runewords. Challenge and Discovery come from the existing combat systems and
item choices. A larger level label or catalog entry alone does not deliver
that fantasy. Usable rewards, honest costs and readable difficulty controls
are required; attained builds and enjoyable pacing need later earned evidence.
The repository has no `docs/design/pillars.md`; this review uses the GDD and
accepted D03/D08/D10 constraints rather than inventing a missing pillar charter.

## 3. Detailed rules

### Access and selection

Hell access is derived from `hasAct5CampaignReward`: actual claimed Eve plus
its complete validated source/item/action graph. Use the same predicate as
Worldstone admission. Do not introduce a Nightmare-Baal gate, new quest,
`difficulty/hell` receipt or additional Claim reward. Before selecting or
entering Hell, validate the full current campaign graph and reciprocal quest
item graph. A preference is not an entitlement.

Existing source-complete saves with claimed Eve qualify immediately under
this feature rule, even if they lack the optional historical Nightmare reward
record. Preserve that record's existing own-true authority unchanged. Loose
quest flags, imported claimed rows without the graph, title, player level,
current act or Nightmare selection cannot qualify. Do not backfill receipts,
repay rewards, automatically select Hell or repair invalid imports silently.

Extend the guarded selector to Normal/Nightmare/Hell. Preserve refusal during
combat, pending recorded entry/settlement, hydration/save replacement or a
quest/material/wave transaction, including reentrant callbacks and rollback.
Selection changes only `selectedDifficulty`, with complete restoration on
publication failure. Restoration failure follows existing recovery/save-block
behavior. UI readiness and the action share the same source-backed rule.

### Plans, rewards and progress

All29 maps retain already-earned Normal act availability and act-wide Enter.
Every non-Normal entry requires a canonical area. Manual and idle entry use
the selected profile, captured immutably in plan/run/recording/receipt/reward
authority. Delayed settlement uses that captured profile, never a later
selection. Invalid profile, unknown area or invalid growth fails before entry
publication; retries do not change the prepared reward or profile.

Resolve the complete Normal plan first. Apply +40 exactly once to every Hell
spawn, including authored encounters, challenge fills, elite adjustments and
chapter bosses. Preserve source identities, tiers, skills, loot-table IDs,
resistance rules and ordinary RNG draw order. Only Normal may use quest-source
projections, publish Normal quest kill/clear proof or repay one-use rewards.
Hell clears must not write Nightmare or Normal progress.

Keep three namespaces: `clearedSubAreas` (Normal),
`nightmareClearedSubAreas`, `hellClearedSubAreas`, and challenge ordinals keyed
exactly `normal`, `nightmare`, `hell`. Ordinary clear/display/farm readiness,
entry ordinal consumption, settlement rollback and restore use the captured
or selected namespace as appropriate. Switching retains all three histories.
Existing entry/Stop/idle semantics remain; do not infer a new unlock from a
different profile's clear. No active run is restored from a save.

### Materials, crafting and equipment

Thread actual Hell into the existing ordinary reward context. Preserve
`actRuneCaps=[8,15,19,21,33]`, `nonHellRuneCap=22`, the existing high-rune
eligible tiers, rune weights/chances/quantities and gem rules. Act V Hell
eligible non-trash tiers can sample all33; trash remains capped at Um.
Normal/Nightmare cannot gain Mal+ through the ordinary sampler or fusion.
Existing separately authored quest exceptions remain exact one-use sources.

Fusion still consumes3 identical runes and produces1 next-ordinal rune, with
no RNG, using highest actually unlocked act and current selected difficulty.
All32 transitions become eligible in actual Hell with Act V unlocked.
Preparing/previewing/executing a live material request must validate current
source-backed profile authority; a profile change invalidates a stale request
under the existing request-context rule. Preserve costs, atomic publication,
ownership/reservation checks, failure rollback and replay protection.

Extend D08 only after enumerating actual resolved Hell level domains across
all29 areas, manual/idle paths and challenge count residues. For each existing
ordinary table, extend only equipment rows sharing its current highest
`maxLevel` to the verified finite Hell ceiling. Retain all other fields/rows,
minima, table IDs and lower-level eligible pools. Extend only each authored
affix's last-tier `ilvlMax` to the verified global Hell ceiling; no new values,
power tier, fallback, level clamp or historical item reroll. Record the exact
table/affix bounds in a reviewed D08 child before editing their JSON.
Show real magic/rare/caster eligibility at the new boundaries, including the
one-above finite refusal. Rune reachability cannot excuse an empty gear pool.

### Save24

Freeze literal23 types, raw profile fields, content domains and semantic
validators before widening any current domain. Preserve its Cain, Malus and
Countess checks; the existing frozen22 domain shortcut skips these checks and
is insufficient as a literal23 freeze. Keep historical `CampaignMapSaveData`
and its two-profile alias closed. Native24 has a separate current map/profile
type extending selected difficulty and ordinal keys and requiring its own
`hellClearedSubAreas` array.

Migration validates raw literal23 first, then adds only empty Hell clears and
`hell:0`. Preserve every prior selection, ordinal, clear, quest, receipt,
inventory, currency, endgame state and pending/claimed reward exactly. No
synthetic entitlement, earned history, normalization or refund. Predecessors
must reject injected reserved24 fields/keys rather than strip them. This is
an explicit narrow reservation at the version boundary, even where an older
permissive object parser ignored unknown fields; unrelated historical extra-
field policy is not widened or tightened by this work.

Native24 requires own closed profile/ordinal fields, unique canonical Hell
area IDs, safe ordinals in0..360359, and actual claimed-Eve authority for Hell
selection **or any nonempty/nonzero Hell history**. Unknown profiles, unknown
keys, inherited/missing fields, malformed graphs and unearned history refuse
before hydration. The existing Nightmare receipt and title rules stay intact.
Snapshot, hydration, IndexedDB, Continue, import/export and reset use the same
native24 contract. Reset selects Normal and empties all replay histories.

### UI and localization

Use the existing selector and map display with localized Normal/Nightmare/Hell,
selected state, explicit Hell source requirement, +40 level-only explanation,
and accurate material/fusion cap copy in both zh-CN and en. Preserve existing
Nightmare receipt messaging separately. Disabled readiness is advisory; the
guarded action remains authoritative. Show profile-specific clears and levels.
Controls wrap at360×640, have44px minimum touch targets, keyboard operation,
visible focus, pressed/disabled semantics and readable live refusal feedback.
No developer/save-version details appear in the player flow.

## 4. Formulas

`delta(normal,nightmare,hell)=(0,20,40)` from validated replay-profile JSON.
For resolved Normal spawn level `L`, replay level is `L+delta`. Hero cap is90;
monster levels are not clamped to it. Normal Baal82 becomes Hell122.

For exact chapter stat anchor `A`, use ADR-008's existing native growth:
`round(A * nativeStat(L+delta) / nativeStat(L))`. Preserve exact anchors for
delta0 and apply existing chapter HP factor once after that ratio. Validate
positive finite native terms and safe integer results before publication.
No independent difficulty HP/damage/resistance/MF/TC factor is added.

Ratify the existing Hell boss/chapter wishstone formula only:
`floor(baseByAct * 1.5)`, so Act V40→60. Nightmare40→48 remains. Other tiers,
independent chances, treasure picks/noDrop and rarity rolls keep their current
formulas. Level-derived XP, shard quantity and ilvl retain native behavior.

The full rune pool's weights total72055; Mal–Zod total385. On the existing
guaranteed **one-rune independent boss branch**,
`P(Mal+)=385/72055≈0.5343%`, `P(Zod)=1/72055`. Its isolated Zod expectation is
72055 boss kills. Other TC draws change whole-kill outcomes. These are source
arithmetic, not measured affordability or permission to add compensating
caches/rates. Chaining `k` fusion steps consumes `3^k` starting runes; no
unbounded count may bypass safe-integer/material-ledger checks.

## 5. Edge cases

- Historical claimed Eve without source graph stays locked; source-complete
  historical Claim gets access without new grants or changing selection.
- Unknown or forged Hell selection/history, duplicate/noncanonical clears,
  extra/missing ordinal keys, fractional/negative/overflow counts refuse.
- Cancel, defeat, draw, hero-dead, abandoned/partial run and duplicate/stale
  settlement cannot create a clear, second income or Normal quest proof.
- A failure before/after selection, entry, reward, clear or ordinal publication
  must retain existing atomic/retry semantics and restore participating fields;
  restoration failure must remain observable and prevent unsafe persistence.
- Lower-act Hell still uses its act cap; Normal/Nightmare still stop at Um;
  high-rune trash restriction stays. Imported materials do not prove earning.
- Inventory overflow, reservations, insufficient inputs and stale crafting
  context refuse through existing rules; no partial debit, fallback or reroll.
- Save downgrade is unsupported: retain pre-upgrade exports, and refuse24 in
  a23 reader. Roll back code before native24 writes, or use a retained23 save;
  never strip Hell history/relabel24 as23 to force a downgrade.

## 6. Dependencies

Replay JSON/schema/loader → pure planner/factory projection → bound runtime
entry/recording/reward → profile-specific clear/ordinal publication → current
save validator/snapshot/hydration. Claimed-Eve source graph → shared Hell
readiness → selector/admission/live material context. Existing material JSON
and actual act/difficulty → sampler/fusion → runeword/equipment/combat/save.
D08 finite equipment/affix envelopes cover the same resolved source ilvls.
Worldstone, Normal quests and frozen predecessors remain separately validated.
Implementation cards and evidence boundaries are in the
[work plan](../plans/hell-replay-implementation.md).

## 7. Tuning knobs

| Knob | Category | Frozen value / allowed change |
| --- | --- | --- |
| Replay level offset | curve | JSON0/20/40; change only by reviewed D03 revision |
| Hell access | gate | actual claimed-Eve full graph; no level/flag substitute |
| Rune caps/weights/chances | curve | existing D10 JSON/formulas; no tuning here |
| Fusion quantity | gate/economy | existing3→1; safe counted transaction |
| Equipment/affix ceiling | eligibility | finite verified planner ceiling, reviewed D08 child |
| Selector feedback/touch size | feel | native action result; ≥44px at360×640 |

## 8. Acceptance criteria

1. Original failing regressions demonstrate missing Hell connection before
   repair; approved contract/ADR/D08 bounds precede implementation.
2. Literal23 and earlier retain their exact acceptance/rejection domains,
   including Cain/Malus/Countess source rules and injected24-field rejection.
   Valid23 migration preserves all prior values and adds only two new defaults.
3. Full-graph historical/current access succeeds; loose/partial/forged graphs,
   unknown profiles and unearned Hell histories refuse without mutation.
4. Real canonical manual/idle planner domains apply40 once with anchored
   chapter stats, unchanged Normal/Nightmare behavior and finite legal gear.
   Bound Hell survives delayed settlement; clears/ordinals stay independent;
   no one-use quest repayment or Worldstone change occurs.
5. Deterministic source tests cover every rune's positive interval, all32
   fusion costs/outputs and all35 ordered runeword inputs/bases, useful effects
   and persistence. Boundary tests retain act/tier/non-Hell restrictions.
   Constructed quantities establish functionality only.
6. Exercise refusal, reentrancy, publication/rollback faults, stale requests,
   save/reset/import/Continue/export, selected profile and independent history.
   Required focused/engine/full unit, strict types, lint and build checks pass.
7. Reviewed production-browser cases exercise actual selector/map/crafting
   controls, zh-CN/en and mobile/desktop with reload. Browser prerequisite
   failures remain failures; no failed hidden-tab card is retried/tuned.
8. Earned unlock/acquisition quantities, 30–50 active-hour pacing,14attainable
   builds across five acts, usable upgrade frequency, device/a11y/performance/
   PWA/CI/human acceptance stay open until their own evidence passes. This
   contract and constructed tests cannot close full P12b/P15/P18 or full v1.


## Static Field amendment — 2026-10-27

[D04's explicit native Hell extension](../plans/decisions/D04-static-field-v1.md#native-hell-amendment--2026-10-27)
authors a50% maximum-health floor, preserving the25% current-health pulse and
existing mitigation/eligibility/cost/cooldown rules. Capture actual Hell rather
than falling back to another profile. This is a skill-specific gate; the
level-only monster-stat policy remains unchanged.
[Exact approval evidence](../plans/evidence/hell-static-field-policy-review.md)
is design/technical ratification; runtime and H2 acceptance are still pending.
