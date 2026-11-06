# Kashya, Greiz and Asheara’s explicit enlistment

Status: future bounded P14 hire-family repair; independent DESIGN-REVIEW APPROVE.
Documentation only. Runtime and the next save boundary follow accepted
Nihlathak/current29; this draft authorizes no current28/current29 source changes.

## Overview

Complete the three authored Act I–III hire side quests through explicit
current-town Enlist/Re-enlist, then separate one-time ensure-owned journal Claim.
Reuse the accepted Warband mechanics with finite contracts, preserving each
existing exact recruit, prerequisite and recruiter level gate. Ordinary Hire,
gacha and ownership alone remain possession events. This repairs quest paths;
the broader recruitment economy remains a separate obligation.

## Player fantasy

Earn a named captain’s support, choose an identifiable companion and keep the
investment in an existing mercenary. Explicit confirmation and separate Claim
serve Fantasy, Competence and Autonomy. Follow the canonical GDD and inherited
game invariants; studio pillar files are absent, as recorded by prior cards.

## Detailed rules

Each contract keeps its existing quest ID, giver, Act, single `obj-hire` of type
`hire-mercenary`, exact `mercId` and `mercenaryUnlock` reward, plus10 `wishstones` paid by Claim:

| Side quest suffix under `quests/side-` | Giver | Exact recruit | Required main completion | Hero gate / fresh merc level |
|---|---|---|---|---|
| `act1-rogue-merc-unlock` | `npc/kashya` | `mercs/act1-rogue-trainee` | `quests/act1-sisters-burial-grounds` | 1 / 3 |
| `act2-greiz-merc-roster` | `npc/greiz` | `mercs/act2-blessed-aim` | `quests/act2-radaments-lair` | 12 / 10 |
| `act3-asheara-merc` | `npc/asheara` | `mercs/act3-iron-wolf-frozen-armor` | None beyond unlocked Act III | 18 / 16 |

Require the existing authoritative main completion for the named prerequisite,
including Blood Raven’s ordered return to Kashya. Neither prerequisite main
reward Claim nor Radament’s Book Read is required. Add no Warband35 gate, new
clear, kill, Talk, payment or combat-stat requirement. The fresh merc level is
the existing exact definition/factory level, not a second hero threshold.

Enlist/Re-enlist requires Normal, the exact captain in the current unlocked
Act’s town, hydrated ordinary-action-ready hero, no combat/active run and exact
tracked unclaimed side row (in progress or historical completed). Preserve the
remembered field-area selection; use existing current-town context rather than
inventing a town area ID. Kashya and Asheara already have town presence. Add a
minimal canonical Greiz dialogue under `dialogue/act2` and bilingual NPC name/
greeting through the existing town loader. Do not replace the global Hire roster.

If the exact base-ID recruit is absent, explicit Enlist creates the existing
factory recruit once and fields its actual ID. If matching owned instances
exist, show a named selection and explicit Re-enlist confirmation. Carry actual
reference and deep merc/equipment/progression witness from selection through
execution, preserving suffixed and multiple instances. Field the selected actual
ID without reroll, reset, upgrade, heal, merge or deletion. Confirmation counts
when already fielded. Reject stale, missing, replaced or mutated selections.

Only this explicit action publishes true `obj-hire`, terminal completed status
and own true finite `<questId>#action:enlist-recruit` receipt, under the shared
quest lease. Verify actual roster/fielding and all participating source state
after every observable publication. No XP, currencies, shards, pity or stat
bonus. Global Hire, gacha, addMerc and ordinary field selection earn no proof.
Once proof exists, Enlist/Re-enlist for that side quest is inert.

Separate journal Claim requires Normal, ordinary readiness, the exact canonical
two-field reward/quest, completed exact side/objective, finite proof and the same
qualified prerequisite. It may occur outside the captain’s current town. As in
accepted Blood Raven/Warband, `mercenaryUnlock` means one-time ensure-owned:
preserve every existing matching instance; if lawful dismissal removed all
matches after Enlist, create one fresh exact recruit. Preserve the previously
fielded actual ID or null. No auto-fielding, recruitment cost, XP, upgrades, compensation
or permanent roster entitlement. Mark claimed last. Later dismissal preserves
the historical proof and provides no replay.

Use finite parameterized contracts for this family and Warband only where their
policies agree; retain Warband’s stronger actual Rescue prerequisite and hero35
gate. Preserve ordinary global recruitment semantics and all accepted history.
Both locales explain Enlist/Re-enlist → separate Claim and name the actual
companion; use native named selection and controls at least44px.

## Formulas

Enlist cost=0, heroXP=mercXP=0. For N existing exact-base matches, Enlist gives
N'=1 if N=0, otherwise N'=N, with the selected actual ID fielded. First lawful
Claim uses the same ownership count rule and leaves fieldedID unchanged. It adds10
canonical wishstones before claimed-last, with source-owned rollback. Enlist
itself grants no wishes. Example:
two suffixed Blessed Aim instances remain two; confirming one fields only that
actual instance, while a later Claim preserves whichever merc is then fielded.
Repeats grant zero. No combat formulas, recruitment price or progression curves
change. Fresh levels remain3/10/16 from existing definitions.

## Edge cases and compatibility

After accepted Nihlathak/current29 and independent design APPROVE, freeze actual
predecessor quest/item/action/campaign admission before allocating the next save
version (30 if29 is still predecessor). Literal historical equality must pass
before live widening. Preserve prior material/runeword/respec/repair/source
policies without claiming a broader arbitrary-catalog freeze. Version-only
migration infers no proof, completion, recruit, progression or compensation.

The three finite new receipts require the corresponding exact completed side
and qualified prerequisite, but no permanent relationship to continued merc
ownership. Reject unknown, malformed, false, inherited/getter or mismatched
receipts and contradictory source graphs. Proofless completed/unclaimed legacy
history must actually Enlist/Re-enlist. Claimed legacy history stays inert with
no ownership backfill, replacement or replay, including when its old recruit is
absent. Preserve every existing merc ID/equipment/XP/fielding state.

Hold the shared lease through preflight, publication and restoration. Recheck
hero/readiness/context, canonical data, prerequisite, exact side/proof and actual
selected witness after observable writes. Reject reentry, hydration/import or
actor replacement and silent/throwing observer mutation. Use accepted scoped
physical participant conservation: restore only participating side/source,
created/selected instance, equipment/progression and participating field change;
preserve unrelated actor progression/settings, other mercs/items/materials and
independent fielding/dismissal. Track participant payload/reference and displaced
gear losslessly, including gear on removed participant references. Do not
resurrect an independently dismissed retained instance. Preserve independent
slot replacements and restore displaced originals through visible unequipped
overflow when needed. Recompute affected surviving mirrors/caches without a
heal. Attempt every restoration and verify deep postconditions; restoration
failures throw AggregateError. A retry earns the complete bundle once. These
are synchronous guarantees, not browser-crash atomicity.

## Dependencies

Exact authored sides/recruit definitions + existing main completion authority →
canonical current-town NPC discovery → explicit selected actual Enlist → three
finite source receipts → protected one-time ensure-owned Claim → existing owned
roster/progression/fielding and Save/export/import/Continue. Root owns shared
contract integration; assign disjoint action/Claim/UI/save ownership before
implementation. See [Warband](qual-kehk-warband.md) for accepted mechanics.

## Tuning knobs

Gate: preserve hero1/12/18, named prerequisites and Normal current-town source.
Curve: fresh3/10/16 and existing merc stats/progression remain unchanged. Feel:
named actual-instance selection, explicit confirmation, separate journal Claim,
clear bilingual one-time ensure-owned feedback at360×640 and desktop, with
412×915/landscape/1920×1080 controls. Mechanics changes reopen review.

## Acceptance criteria

1. Independent contract review and accepted predecessor precede source/save work.
   Each exact captain/action is reachable, including Greiz. Actual Enlist earns
   only its exact objective/proof and selected fielding; global acquisition does
   not. Prove missing prerequisite/ordered return, hero gate, wrong-town/Act/
   difficulty, readiness/run and stale/multiple/suffixed-selection refusals.
2. Exact two-field Claim preserves fielding and investment, supports lawful
   dismissal between action and Claim once, and rejects legacy/repeats. Scoped
   observer-fault/reentry/restore controls prove physical conservation and
   independent state preservation. Accepted Warband behavior remains intact.
3. Literal predecessor/current boundary, local unit/type/lint/build and both-
   locale production headed-browser checks cover all three actual actions and
   Claims, named companion/controls, mobile/desktop and exact Save/export/import/
   close/reopen Continue. Disclose imported capability and retained diagnostics.
   Earned campaign/pacing/balance, recruitment economy and owner playtesting stay
   separate; this card closes only these three P14 side paths.


P15 reward amendment: [finite side wish budget and bounty policy](../plans/decisions/P15-finite-side-wishes-v1.md). Existing source proof, recruitment investment, action/claim separation and legacy refusal remain. The10-wish bonus uses the claim currency participant; independent additions survive rollback, and currency restoration precedes scoped source/physical restoration and final verification.
