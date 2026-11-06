# P15 — Ordinary throwing weapon progression

## Overview and player fantasy

BUG658 establishes a missing content ladder: throwing has only a level1 knife.
Private-v1 G3/G4 require attainable, useful equipment for the intended Double
Throw build. Finding a stronger throwing weapon should improve its weapon-based
damage while retaining Throwing Mastery and the player's chosen build.

## Detailed rules and curve

Add five one-handed, metal, affixable throwing bases. Damage mirrors the existing
one-handed sword/claw tiers. Keep sockets/maxSockets zero, following the existing
throwing knife; this change adds no throwing runeword path.

| Equip level | Base slug | Physical damage | Loot tier levels |
| --- | --- | --- | --- |
| 8 | weapon-balanced-knife | 7–13 | 8–21 |
| 22 | weapon-war-dart | 14–24 | 22–31 |
| 32 | weapon-battle-dart | 20–32 | 32–49 |
| 50 | weapon-winged-knife | 32–55 | 50–59 |
| 60 | weapon-winged-axe | 45–75 | 60–122 |

Append throwing picks to the same28 ordinary weapon-bearing campaign tables as
the recorded ranged addition: trash/champion/unique/mini/boss and Duriel,
Mephisto, Diablo quest tables. Each tier intersects the table's finite equipment
envelope and its equip requirement. The fixture records exact envelopes; Act I
trash starts8 and champion9, using their existing source bands. Other envelopes
match the independently recorded ranged policy. Baal's fixed unique reward,
goblin and material/service tables are outside this ordinary addition.

## Formulas and tuning knobs

For each table, throwing family weight equals the recorded P15 ranged
weightPerFamily: one eighth of its pre-ranged ordinary weapon weight (including
the historical training bow in Act I). At a supported level exactly one added
throwing tier is eligible. The old starter remains possible in Act I.
Added weight W changes an existing eligible pick's probability from w/T to
w/(T+W); it does not change picks, no-drop, rarity, MF or grant a guaranteed gift.
These are provisional economy weights, not final balance acceptance.

For tier [a,b] and table [c,d], append [max(a,c),min(b,d)] only if nonempty.
Numbers live in JSON. Damage ranges are curve knobs; equip levels and source
envelopes are gate knobs; no new feel knob or engine coefficient is introduced.

## Edge cases and compatibility

Preserve all old bases, IDs, table fields, entry order/weights/bounds, unique/set
bindings, affixes and historical fixtures. No added entry below its requirement
or above the finite table ceiling. No save schema/version change. Existing art
resolution maps throwing metadata to the dagger icon; names use zh-CN/en keys.
Source levels123+ remain outside this extension. Throwing weapons stay one-handed
and eligible for their existing mastery and damage-delivery rules.

## Dependencies and implementation plan

Root owns bases, loot, locale additions and affected regression updates in the
already claimed human2 worktree. No new agents, dependencies, CI or publication.

1. Retain before bytes/hashes and file BUG658 before production changes.
2. Add fixture and a failing regression for the missing ladder/loot eligibility.
3. Add bases/locales and append only the declared table delta.
4. Extend exact D08+ranged preservation with the independent throwing delta.
   Update Act II's explicit current pool. Correct the existing affix test's
   stale count transparently:76 original +2 mastery +6 claws +6 ranged +5 throwing.
5. Run affected content/loot/equipment tests, scoped strict types/lint, and a
   constructed browser equip/save round trip in both locales on desktop/mobile.
6. Preserve failures/results, verify the earned terminal save unchanged, remove
   exact owned disposable configs/caches after processes end, update the ledger.

## Acceptance and limits

Each of28 tables offers exactly one added equip-eligible tier throughout its
declared envelope, none outside. Strict schemas, finite bounds, bilingual names,
existing art, real reward materialization and native equipment projection pass.
Full JSON must equal its exact retained predecessor plus declared additions.
Old items/saves must keep exact values; newly equipped throwing upgrades must
increase Attack without losing mastery or displacing a valid shield.

Browser fixtures prove presentation/equip/persistence only. No campaign replay,
seed search, earned reward claim, renewed training/attempt budget or full-suite
run. G3/G4, pacing/fairness and Act IV viability remain unaccepted until their
separate earned evidence exists. No unsupported invariant is declared passed.

## Focused review before implementation

Security check: pass. Scope is local authored content and related tests; no
credentials, network, permissions, dependencies or executable data introduced.

Plan review: ready. Root-cause correction supplies missing attainable content;
existing engine rules consume it. One-handed curve and zero-socket policy avoid
an unrelated mechanics expansion. Tests preserve old content exactly and
distinguish availability from campaign viability. No unresolved owner decision.
This is root self-review, not independent final acceptance.
