# P15 — Spend owned socket materials during intended Act II preparation

Status: native preparation and bounded earned comparison verified; all14 intended profiles opted in. Arcane boss draws; full retry/population acceptance open.
Date: 2026-11-02. Owner: root.

BUG608 shows caster damage while the party has empty sockets and earned gems.
The authenticated Lost City22/ordinal262 source has57 flawed Diamonds and59
flawed Topazes. Its equipped hero and fielded Prayer each have eight nonshield
empty sockets, plus two shield sockets. Ordinary native insertion can add32
flat magic mitigation each, eight all-type hero shield resistance and24 merc
shield lightning resistance:20 paid insertions,18 Diamonds/two Topazes. These
were confirmed by native projection and paid transactions, not a balance result.

Reuse the existing owned-socket transaction helper. Opted-in intended profiles
use `owned-act2-defense-v1` after Act II unlock and before Act III unlock. At
idle admission boundaries, fill only completely empty equipped weapon/armor
items: Diamonds on hero gear and nonshield merc gear; Topazes on the actual
fielded merc shield. Choose the highest owned quality; do not grant, buy, craft,
unsocket or replace existing contents. Preserve the24-insertion boundary cap,
full-backpack refusal, re-equipping and exact socket/economy receipts. Historical
profiles retain their previous socket policies. No production coefficients or
player-facing mechanics change.

Focused regressions cover paid dual-shield contents and actual stat effects,
material/item conservation, idempotency, actual companion custody and opt-in/act
gates, alongside the affected shared transaction cases. Use strict scoped types
and explicit lint. The constructed fixtures establish transaction behavior only.

Before enabling the shared intended policy, run one zero-combat equipment-only
projection from the authenticated source. Verify source/ancestor/journal and
production/campaign/profile hashes; preserve exact native exports and costs.
If the predicted benefit is confirmed, freeze a bounded earned comparison from
the original source, using only the new socket policy and existing defensive
priority/gear/training rules. Keep200training/201total admissions,24million
combat-ms,360s wall and first-nonwin stop; never extend any terminal diagnostic.
Population, pacing, full fallback/retry and formal acceptance remain open.

## Native verification

All13 distinct affected socket cases pass, with scoped strict types and explicit
lint. The focused intended-profile registration assertion passes for all14
profiles and confirms historical counterparts have no socket opt-in; final
scoped types (including the earned driver) and explicit lint pass. A test-only
union-property access failed strict types before execution and was corrected;
its receipt and initial preflight freeze remain retained.

`p15-intended-owned-sockets-v1-preparation` completes zero battles/admissions
and20 paid insertions from the original authenticated Lost City22/ordinal262
source. Diamonds57→39 and Topazes59→57. Hero and Prayer magic mitigation0→32;
hero six resistances each increase8, Prayer lightning37→61. Attack/speed and
Life/Mana are unchanged. Repeating inserts zero and preserves the exact native
save. Economy reports zeroXP/zero added items/20 socket insertions. Native
exports/source/ancestor/journal/profile hashes are retained; process exited0,
exact task-owned cache absent. This proves attainable equipment gains only.

`p15-intended-arcane-sockets-v1-plan-v2.json` freezes the new bounded comparison
from the original source, independently paying socket costs. It does not extend
the preparation-only export or any terminal failed diagnostic. No production
source/data change, earlier campaign replay or unrelated test is involved.

## Earned comparison result

The declared branch completes141 training admissions, earns28, then wins the
first five Arcane waves before a60s boss draw. Total142 admissions/711waves:
710 victories/one draw,1774780XP,6978acquired/6498salvaged items,
13415809.389607545combat ms,105.215s wall. Training sources transition from
Dry Hills to Far Oasis at24 using the existing full-challenge margin. Terminal
28/nextNormal404; no Arcane clear or new quest action. Staff prefix16 remains.
The terminal diagnostic must not be extended.

Native preparation spends18 flawed Diamonds/two flawed Topazes, then two
earned normal Diamonds in replacement equipment:22 insertions total. Prayer
earns1331052XP and grows21→24; unfielded Rogue remains17 with zeroXP. Independent
v2 readback verifies exact ordered ownership/socket costs/economy/points/quests/
clocks/ordinals/seeds/party carry/merc XP/native export without combat replay.
Reader v1 incorrectly expected a string winner for a draw; v2 accepts native
null, preserving the failed reader and gameplay unchanged. All processes exited;
exact task-owned cache is absent.

The boss draw ends with hero600/600Life and347Mana, Prayer492/492Life and196Mana.
Summoner has216Life; two living Flayers have172/421Life. Hero casts16Decrepify,
eight Wall,13Teeth and one CE. This is damage/time pressure, not evidence of
Mana starvation or an engine defect. Preserve the authenticated pre-Arcane
28/ordinal403 checkpoint for a new declared bounded native retry comparison;
do not rerun141training admissions or tune production from a single draw.

Evidence: `p15-intended-arcane-sockets-v1-readback-v2.json`,
`p15-intended-arcane-earned28-checkpoint-v1.json` and
`p15-intended-arcane-owned-sockets-draw-v1.json` in the retained root packet.
Formal balance remains0/210; full-v1 completion is not established.

Plan review: ready; reuses native insertion/restore and the existing conservation
ledger. Avoids free state changes and per-area/seed-specific survival patches.
Security check: pass; authorized local repository/native diagnostics only; no
installs, networking, credentials, CI, publication or protected player-save writes.
