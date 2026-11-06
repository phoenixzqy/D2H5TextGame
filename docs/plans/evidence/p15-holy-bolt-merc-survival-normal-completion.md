# P15 — Holy Bolt earned Normal completion

2026-11-04. Intended Holy Bolt progression through Normal is locally complete.
**14/14 intended builds cleared Act I; 11/14 completed five-act Normal;
formal balance acceptance remains 0/210.** Full private v1 remains incomplete.
This slice changes no production code or campaign policy.

## Owned equipment and native preparation

The authenticated level52/next913 source retains Bolt20/Hammer20/Conviction19,
Prayer1 and the preceding earned quest history. Source SHA256:
`3e504ead7058a8305eb84e587de02337ccf012083bde2d241de683eb72fee32b`.
Prayer's retained wave3 death agrees with existing physical damage rules:
`floor(490 * 1.25 * (1 - (67 - 50) / 100) - 337) = 171`.
There is no established damage defect or runtime act resistance penalty.

One owned rare War Hat, `it-4qhth-fam`, replaces Face of Horror,
`it-opkp-2h9`, in Prayer's head slot. No sockets or other equipment change.
Native stats change defense337→368, physical resistance67→88, attack573→568,
magic resistance34→26, maximum mana408→467 and magic dodge27%→33%.
Fire/cold/lightning resistance each falls10; life cap, attack speed and physical
dodge are unchanged. The same retained physical hit falls171→11.

A single control and candidate comparison reproduces all606timed events and
the complete original native result. Control:28,980ms, player victory, Prayer
dead. Sole helmet candidate:17,528ms, player victory, Prayer701Life/454Mana.
All non-stat factory metadata and original input remain exact; runtime Life/Mana
are retained and clipped only to lower caps. This diagnostic allowance is closed.

Initial retrieval is refused because the inherited backpack has152items against
capacity100; its entire exported save remains unchanged. Corrected preparation
uses the existing deterministic `stash-room-v1`:53 native backpack→stash moves,
one retrieval and one mercenary equip. End backpack100/stash352. Old helmet is
preserved. No deletion, salvage, purchase, healing, reset, growth or battle.
The preparation reader initially omitted the canonical `ownedMercs.equipment`
mirror rebuilt by save serialization; exact full-save readback corrects that
oracle without replaying the successful native actions. Prepared SHA256:
`c00170c9ca70266cd602756a29da45ccde9057343b2a19a02e90dfcb1d9bfdb1`.

## Earned route

| Admission | Result | Native quest actions |
| --- | --- | --- |
| Ancients913 | 7/7 waves won | Claim Rite of Passage |
| First Throne914 | 8/8 waves won, including Baal | Start and Claim Eve of Destruction |

All19 Act V actions, five main Claims, inherited consumed quest sources,
three new victory receipts, Baal title and Nightmare unlock reconcile with the
native save. Actual successor is level53/next915, with801,923heroXP and148new
items earned. The three unique armor quest rewards are included in148.
Prayer lives through all15waves, minimum terminal669Life, finishing706Life/
467Mana; the hero finishes1073Life/557Mana.

One earned level and the Rite reward provide two skill points: Conviction19→20
and Prayer1→2. Five earned stat points raise vitality127→129 and energy168→171.
No free points remain; stat/skill reset allowances stay3/2. Prayer32 receives
601,437actualXP and ends3,995,002/6,539,509, preserving its legacy threshold.
Inactive Rogue17 and all equipment remain unchanged. No completed-area replay,
training, additional gear/order trial, seed search or renewed closed budget.

Terminal export SHA256:
`660ccf31f639ff6e06758ec9b53169c6a0739f6ae586f37e083e4c3e9fdd163c`.

## Verification, limits and custody

Separate `comparison-readback.json`, `prepare-v2/preparation-readback.json` and
`earned/act5-readback.json` pass raw input/result, native custody and journal
arithmetic checks. Rewards, unique item ownership, materials/currencies, hero/
mercenary XP, earned points, time, admissions and quest history reconcile.
All2,230 production inputs and134campaign inputs remain exact. Two earned-reader
errors (already-inherited action history and the native idle clock advance) and
the closure reader's compressed-byte accounting error are retained and corrected
without gameplay replay. No broad test/build run is needed for unchanged code.

This proves one earned native service/store route; it does not prove browser
playthrough, population balance, 30–50-hour pacing or independent acceptance.
Zeal, Javelin and Double Swing remain outstanding, as do wider economy/crafting,
higher difficulties/endgame, PWA/device/a11y/performance and final acceptance.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-holy-merc-survival-4eiiudoo`.
Root retains it and claimed human2 through unfinished umbrella review, then owns
exact cleanup/release. `closure.json` verifies all six recorded PIDs and six exact
caches absent, no remaining disposables or cleanup failures. Packet before closure
is9,511,409bytes, within16MiB; earned persisted journal361,546bytes is within40MiB.
No task browser/server was started. No agents, installs, commits, pushes or
publication occur. Browser works; CI remains excluded; no pending user question.

Carried campaign costs become915admissions and44,184,368.83228759combatms.
The two diagnostic battles add46,508logicalms separately, with zero admissions.
Known cumulative driver cost is773,689.974043ms, including the two preparation
attempts and diagnostic; route driver2,317.41553ms. New wrapper elapsed times
were not measured and are not invented or added to driver clocks. Original
failures, costs and reserved execution history remain retained.
