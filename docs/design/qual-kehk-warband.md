# Qual-Kehk’s explicit Warband enlistment

Status: accepted locally for bounded functionality/current27, 2026-10-29.
Independent design/source/rollback APPROVE; headed production-browser evidence
ADEQUATE. Complete unit coverage reconciled across runs, strict types, full lint
and production build pass; exact failed attempts and limitations are retained
in [implementation evidence](../plans/evidence/qual-kehk-warband.md).
Earned campaign/balance/pacing/full-G5/offline and owner playtest remain open.

## Overview

Complete `quests/side-act5-qual-kehk-merc` from the preserved side obligations
in [the Act V contract](compact-act5-contract.md#preserved-side-obligations).
After actual qualified Rescue, explicitly Enlist/Re-enlist the named Barbarian
recruit at current-town Qual-Kehk. This earns completion, then a separate journal
Claim delivers the authored one-time ensure-owned mercenary reward. Existing
ownership or gacha acquisition alone earns no quest credit.

## Player fantasy

A rescued warband sends an identifiable warrior to fight at the hero’s side.
Explicit selection/confirmation serves Fantasy, Competence and Autonomy while
preserving the player’s investment in an already-owned mercenary. Studio pillar
files are absent; follow the canonical GDD and inherited game invariants. No
new economy, recruitment cost, power bonus or permanent entitlement map.

## Detailed rules

Preserve quest ID, `obj-hire`, `hire-mercenary`, named mercenary
`mercs/act5-barbarian-recruit`, prerequisite
`quests/act5-rescue-on-mount-arreat`, and exact reward
`{mercenaryUnlock:'mercs/act5-barbarian-recruit', wishstones:10}`. Correct giver identity from
`npc/qual_kehk` to actual `npc/qual-kehk` as ratified by compact Act V. The
following is the concrete already-owned recruiting UX left to this side card.

Enlist/Re-enlist requires hydrated ordinary-action-ready hero, hero level≥35,
Normal, current unlocked Act V town Qual-Kehk, no combat or active run, exact
tracked unclaimed side row, and qualified Rescue after actual graph validation,
including all three cages. Rescue reward Claim is irrelevant. Hero35 preserves
the existing Act V recruiter gate; recruit definition reqLevel22 remains the
fresh mercenary’s initial level, not a conflicting hero threshold. Preserve
remembered field-area selection; no fabricated town area ID is required.

If no matching merc is owned, explicit Enlist creates the exact JSON-defined
recruit through the existing factory, adds it once, and fields that actual ID.
All other mercenary instances/equipment/progress survive unchanged. If one or
more matching base-ID instances exist, show a named selection and explicit
Re-enlist confirmation. Keep actual reference plus deep merc payload, equipment
and XP/progress witness from selection through execution. Preserve every
historical matching instance, including suffixed IDs. Never merge, delete,
duplicate, reset, upgrade, heal or reroll a retained mercenary. Field the selected
actual ID. Confirmation may count even when it is already fielded; do not make
the player artificially unfield it. Reject stale/moved/replaced/mutated choices.

Only this current-town explicit action publishes completed `obj-hire`, completed
status and own true finite receipt
`quests/side-act5-qual-kehk-merc#action:enlist-recruit`. Use the shared quest
transaction lease, verify actual roster and fielding first, then exact retained
source state after publication. No XP, currencies, shards, pity, stat bonus or
upgrade is granted. Global Hire, addMerc, gacha, ownership and generic field
selection remain possession-only; they never backfill this objective/proof.
After lawful proof, repeated Enlist/Re-enlist for this quest is inert.

Journal Claim preview/execution require the finite proof, exact completed side
row and qualified Rescue, Normal and ordinary-action readiness. Whitelist this
exact quest/reward rather than broadening arbitrary mercenaryUnlock handling.
As in the accepted Blood Raven reward, mercenaryUnlock means one-time
**ensure-owned**: preserve any existing matching instance exactly; if the recruit
was dismissed since actual enlistment, create one fresh exact recruit. Preserve
the previously fielded selection in either branch. No automatic fielding, XP,
shards, compensation or permanent roster entitlement. Verify publication and
claimed-last; scoped deep rollback must preserve unrelated writes and explicitly
report restoration failure. Never call unmodified auto-fielding hireMerc from
this Claim. Later lawful dismissal does not invalidate historical enlist proof.

## Formulas

Enlist cost=0, heroXP=mercXP=0; unrelated currencies/pity remain exact.
Let N be matching owned instances before action: after Enlist/Re-enlist,
N'=N+1 if N=0, otherwise N'=N. Chosen existing instance remains byte-equivalent
(including derived/current resources and progression), while fieldedID becomes
its actual ID. Example: two historical suffixed recruits remain two, and only
the chosen actual one is fielded.

First lawful Claim: N'=1 if N=0, otherwise N'=N. Existing fieldedID is unchanged,
including null or an unrelated mercenary. Fresh recruit starts at existing
JSON/factory level22. First Claim also grants10 canonical wishes before
claimed-last under the same source rollback. Enlist itself grants no wishes.
Repeated Claim income=0. No combat formula changes.

## Edge cases and compatibility

Freeze actual26 quest/action/campaign/charm/item admission before current27.
Keep existing material/runeword/respec policies unchanged; do not claim a
broader arbitrary-catalog freeze. Version-only26→27 migration infers no proof,
completion, mercenary, compensation, gear repair or fielding. Preserve existing
owned IDs, equipment, XP, selected field and claimed history exactly. New proof
requires canonical completed side and qualified Rescue, but no permanent link to
continued ownership. Unknown/malformed/false/inherited/getter proof or
contradictory source is rejected. Proofless completed/unclaimed history must
perform actual Enlist/Re-enlist; claimed legacy history remains claimed and
absent ownership receives no inferred replacement.

Check hero, context, canonical definition and actual selected witness again
inside the lease. Refuse missing prerequisite, wrong town/merc/difficulty,
level<35, combat/run, duplicate new creation, callback mutation, reentry and
repeat without participating writes. Rollback restores only participating source,
created/selected instance, equipment/progress and selected field, preserving
unrelated writes; recompute affected hero/merc caches when surviving canonical
state needs it. Restoration failure is explicit; no browser-crash atomicity.
Other three hire quests and generic recruitment semantics remain outside this
card. No dependence on purchasing healing or introducing gold.

## Dependencies

Existing side catalog and canonical Act V NPC → qualified Rescue authority →
current-town explicit recruit selection/action → finite enlistment proof →
protected journal Claim → existing factory/owned roster and persisted merc
state. Save27 reader/migration, snapshot, public export/import and Continue
retain source, identity, XP/equipment and fielding. Localized `warband` town
copy and quest descriptions must explain Enlist/Re-enlist → Claim; the label
must explain the one-time ensure-owned reward rather than invent a new unlock.

## Tuning knobs

No new combat or economy tuning. Gate: existing hero35 and qualified Rescue.
Initial recruit level22 stays existing authored data. Feel: named preview,
separate ≥44px Enlist/Re-enlist confirmation, no automatic Claim, and concise
bilingual feedback. Use zh-CN primary/en parity at360×640 and desktop, with
412×915/landscape/1920×1080 checks. Any change to these rules reopens review.

## Acceptance criteria

1. Explicit current-town Enlist/Re-enlist after actual Rescue earns only exact
   objective/proof and actual selected fielding; absent/owned/suffixed/multiple
   cases preserve investment. Ownership/global hire/gacha/addMerc never earn
   proof. Actual/deep stale-selection, prerequisite/readiness/level/reentry and
   observer-fault controls prove conservation, including restoration failure.
2. Separate exact two-field Claim ensures ownership once without auto-fielding or
   XP. Existing and dismissed-between-action-and-Claim branches preserve all
   unrelated state. Legacy claimed/proofless behavior has no inferred grants.
3. Literal26/current27 compatibility controls, coherent full local checks and
   production browser both locales/mobile+desktop cover actual action→Claim,
   named merc, negative/repeat guards, exact Save/export/import/close/reopen.
   Capability imports are disclosed. Owner playtesting, earned campaign balance
   and the other P14 obligations remain open.

## Implementation order

1. Accept Larzuk/current26. Review this contract and its three-outcome plan;
   freeze literal26 and prove save27’s finite historical enlistment boundary.
2. Protected current-town selection/action, exact source-bound Claim and localized
   UI using existing factory/roster mechanics; scoped causal tests/review.
3. Full integration and production browser evidence, independent QA/source review,
   exact disposable cleanup and ledger update. No CI, commit/push or deployment.


P15 reward amendment: [finite side wish budget and bounty policy](../plans/decisions/P15-finite-side-wishes-v1.md). Existing source proof, recruitment investment, action/claim separation and legacy refusal remain. The10-wish bonus uses the claim currency participant; independent additions survive rollback, and currency restoration precedes scoped source/physical restoration and final verification.
