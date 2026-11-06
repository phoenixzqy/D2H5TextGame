# P15 — Javelin earned Act III complete

2026-11-01. Private v1 remains incomplete; the historical five-act roster stays
10/14. This continues only new Act III from the accepted Act II save.

## Earned checkpoint

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Authoritative save: `p15-javelin-act3-complete-native-v1.json`.
SHA256: `394d0cf08e18691b51e2ad77b72ea60f1baad023966a29c02545ce8d0e426633`.
Independent reader: `p15-javelin-act3-complete-readback-v1.json`, passed.

Level 28 / XP 51189 / next normal ordinal 299. All 18 Act I–III areas and all
32 canonical Act II–III actions complete. Mephisto dies in 44.856 seconds,
Guardian is claimed once, and Act IV unlocks. Original Inner Sight Rogue is
level 25 and remains fielded. All 29 inherited paid socket contents remain
owned; six native insertions bring the total to 35. Resets remain stat 3 / skill 1.

Lightning Strike 20 plus six inherited rank-one prerequisites/passives remain;
eight newly earned points buy Impale 8 without resetting. Pack priority stays
Lightning Strike; the qualified boss order adds Impale. Historical profile ID
and weapon-policy metadata remain lineage, not advertised build acceptance.

## What changed

Spider, Marsh and Flayer clear unchanged. Bazaar retains a wave-four defeat;
its successor's unchanged retry and old cold/MR chest controls still fail.
Already-earned rare head, owned two-socket gloves, Ort/Nef/Diamond qualify Bazaar.
The cheaper hero-only preparation clears it and Travincal. Durance retains a
wave-four physical-champion loss. All prior income and quest actions survive.

Armor controls distinguish survival from throughput: projected level-28 Silks
with three Nefs survives all packs and Mephisto, but capped Lightning times out.
The existing Impale 8 and capped Impale 20 controls also time out. BUG-546
corrects authored Impale growth 7→150 while keeping rank one, cost, cooldown,
Defense bypass, resistance/dodge and Bleed exact. Only Amazon JSON and three
existing literal native/UI expectation files change. All 2090 production inputs
are rehashed; exactly those four paths differ. See the
[balance concern report](../../balance/2026-11-01-impale-rank-growth.md).

Before/after controls preserve both entry teams and all preboss combat. The
level-28 control changes from a 60-second draw with 18184 HP left to a 46.992-second
win. A level-40 control also changes draw→win. These are discarded diagnostics.
One failed diagnostic selected an already-salvaged chain chest; it remains a
failed execution, and grants no income. The corrected control uses owned Silks.

Flayer farming fails qualification, so bounded Great Marsh acquisition earns
actual 28 in 49 admissions / 245 wins / zero losses. Gear, old skill policy,
resets, quests and sockets stay unchanged. A future-target extension permits
appended route allocations while preserving the original farming profile.
Seven guard checks plus scoped strict types/lint pass. Fresh actual-source
qualification precedes three native Nef insertions and eight Impale allocations.
Native Durance matches the qualifying initial teams/events/metrics on all six
waves, then performs only the remaining final Claim.

## Verification and accounting

Four independent native transition audits reconcile 57 admissions, 287 waves,
285 wins / 2 nonwins, 1283390 XP, 2862 item awards, 2806 salvage removals and six
insertions. Eight admissions advance the route; 49 acquire levels. Logical
combat time is about 42 minutes; this is not 30–50 active-hour pacing acceptance.

The 62 affected registration/schema, native Defense/Bleed/lifecycle and bilingual
UI checks pass after 15 expected RED failures. A larger capped test target keeps
the entire nonlethal Bleed lifecycle observable. Existing negative controls
remain. Unchanged earlier-act results are reused; no broad suite, old-act
acceptance replay, browser/build/CI rerun, agent, install, commit or publication.

Source tree: `b034079020d713da9d493913b91c3af6a4b6d5c12cf09108a6a19f0ea72eecb2`.
Data: `62e97d817e3014e834c32c1600f5ff0f4448b1543b6cca2c9f8717d08513fcaa`.

Next is Act IV from ordinal 299. Javelin Acts IV–V, both Assassin routes and
Summon Druid remain. All advertised skill/build identities, all-area/holdout
matrix, balance/economy/acquisition/fairness/pacing and final integration,
mobile/locales/PWA/endgame/save stability/two-hour soak/review/owner playtest
remain open. Browser works; CI is excluded; no pending answer or external blocker.

Root retains the required packet and live human2 worktree claim through umbrella
acceptance. The original checkout stays read-only. Exact task configs are
archived/removed and process/cache cleanup is recorded in successor
`p15-javelin-act3-complete-artifacts-v1.json`. Root removes retained evidence only
after all consumers and umbrella acceptance finish.
