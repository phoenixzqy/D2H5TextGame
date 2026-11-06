# Druid current-source native seed screen — 2026-11-01

Status: CONCERNS. This exploratory screen advances the balance evidence; it does
not close full v1, current-source balance, pacing or build acceptance. Production
is unchanged from BUG552. All fourteen historical main-route clears remain valid.

## Frozen method

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Recipe `p15-druid-current-source-screen-v2.spec.json`, driver of the same stem,
launcher `p15-druid-focus-run-v1.mjs`, report `p15-druid-current-source-screen-v2.json`.
Independent reader `p15-druid-current-source-readback-v3.py` and result
`p15-druid-current-source-screen-v2-readback-v3.json` pass. Pressure projection:
`p15-druid-current-source-screen-v2-pressure.json`.

Four fixtures each use explicit plan seeds1–8, never holdout seeds. Ancients uses
exact earned49/XP6291/normal ordinal939 from
`p15-druid-summon-act5-earned49-native-v1.json`; Throne uses completed
49/XP202871/ordinal942 from `p15-druid-summon-act5-native-v2.json`. These are
conditional source states, not matched-power fixtures or a population over all
challenge residues. Sources, gear, merc equipment and original resources are
pinned; no projected XP, item, level, replacement merc or paid material is supplied.
Both Ancients choices allocate the same five already-earned free skill points.
Throne choices preserve identical learned ranks and one unspent skill point;
only their fourth active summon differs. No reset is spent.

Each trial restores its source, uses production preparation and native
`startSubAreaRun`, consumes original native playback and settlement once, then
discards all local state and rewards. All aura projections, native summon
preparation, wave carry and enemy generation remain in production. No standalone
snapshot reconstructed from incomplete player/enemy arrays is substituted.
Plan seed is the declared integer; enemy generation/battle seed is
`(planSeed ^ ((waveIndex + 1) * 0x9e3779b1)) >>> 0`; reward seed is
`(planSeed ^ 0x9e3779b1 ^ waveIndex) >>> 0`. The explicit ordinal remains fixed.
Full native teams/events/outcomes/rewards survive in34 pinned compressed trial
files. There are32 screen trials plus two historical controls,212 total waves.
Nine finished records are reused after an audit correction. The failed v1 Oak
reference comparison leaves seven additional diagnostic waves in its progress/log;
its missing structured raw output requires that one reference to run again under
v2, which persists raw output before comparison. No completed screen trial, historical progression, cost, reward or quest Claim is replayed.

## Results

| Fixture | Area clears | Deaths | Draws / timeouts | Successful whole-area p50 |
| --- | ---: | ---: | ---: | ---: |
| Ancients: wolves/Barbs/Poison |8/8|0|0|114.97s|
| Ancients: Oak6/wolves/Raven |2/8|5|1|132.76s (n2)|
| Repeat Throne: earned Poison order |0/8|1|7|Unavailable|
| Repeat Throne: same points, Raven order |0/8|0|8|Unavailable|

These rates have wide95% Wilson intervals:8/8 is67.6–100%,2/8 is7.1–59.1%,
0/8 is0–32.4%. This sample cannot establish an acceptance probability. TTK is
victorious-only, and failed durations remain separate in the machine report.

The Ancients boss itself is reached and defeated8/8 times with the first policy:
p50 53.40s, p95 58.48s. Oak reaches that boss3/8 times, wins2/3 reached trials,
and times out once; its five other failures are deaths at the earlier cold pack.
Those denominators must not be interchanged. The earlier cold pack contains15
enemies; its median entry HP is101206.5. The policy comparison changes Oak1→6
versus Spirit Wolf12→15 plus Barbs1 and Poison1. It does not isolate a causal
benefit of Poison Creeper alone.

All16 repeat-Throne trials stop at zero-based wave5, before Baal. That native
pack has19 enemies, including physically resistant Ancient Barbarians, at level80;
median total entry HP176205.5. Median remaining hostile HP is32936 with Poison
order and46427 with Raven order. Minimum observed hero MP is483 and485,
respectively. This identifies pack survival/throughput pressure, not mana
starvation. Boss timing has **n0** in this screen; the historical9.10s Baal result
is still a single first-clear observation. Repeat Throne uses the ordinary
post-Claim area sequence, which differs from the original quest-source projection.
Do not call this a replay or a failed historical main-route audit.

## Audit corrections and validation

The first driver stopped at its second reference comparison because the native
item allocator is process-global and monotone. The combat, timing and reward
content matched, while newly awarded top-level Item.id values differed. v2
compares exact teams/events/outcomes/metrics and all reward fields except those
new IDs; existing party/item identities remain meaningful. The independent audit
accepts only that new-ID difference and rejects four controls changing combat
damage, duration, reward content and existing hero identity. The first historical
control also retains exact raw item IDs; the Oak control retains exact combat and
reward semantics. The failed attempt and completed compressed records are kept.

Reader v2 incorrectly treated native tier `boss` as elite. Reader v3 uses native
boss presentation or boss/chapter-boss tier, retaining other nontrash tiers as
elites. It recomputes role summaries from the same raw results; no fight reruns.
Scoped strict TypeScript and scoped unused-variable/no-any lint pass for the
current driver. The existing210 affected BUG552 checks and scoped source checks
remain unchanged and are reused. No broad suite or earlier-act campaign runs.

## Next implementation decision

Before prescribing training or global numeric tuning, inspect repeat-Throne
wave5's recorded damage/mitigation and evaluate legal already-owned AoE/physical
adaptation, free points and the remaining reset with its actual cost. The present
order-only control is insufficient. A boss-only measurement needs a complete
native pre-boss input/carry checkpoint; no boss-only claim can be made from these
failed area trials. Freeze the resulting fixtures before the plan's100-seed
exploration and disjoint1000/1000 tuning/holdout acceptance. Do not spend holdouts
while fixtures or adaptation rules are still changing.

The22 missing historical area cells, full213 skill/advertised-identity acceptance,
70 build/act and210 role coverage, acquisition/economy/fairness/30–50 active-hour
pacing, final integration/mobile/locales/accessibility/PWA/endgame/save stability,
two-hour soak/review and owner playtest remain open. No external blocker or
pending question; browser works and CI is excluded. No agents, installs, commits,
pushes or publication. Root retains the live human2 claim and packet until the
umbrella goal is accepted. Temporary config cleanup and exact closure are in
`p15-druid-current-source-screen-v2-artifacts.json`.


## Follow-through: free skills and owned mercenary equipment

[The owned adaptation screen](2026-11-01-druid-owned-adaptation.md) tests three
legal skill choices and two owned merc packages on seeds1and8: ten trials/60waves,
all draws at repeat-Throne wave5, none qualifies for extension. Nine priority
slots allow adding learned Raven without replacing Poison. Merc gear reaches
native snapshots but Rogue31 still dies before the difficult pack. No earned
state or production change, cost, farming or holdout use follows.

Reader4 supersedes reader3 only for timeout classification: use terminal-wave,
not cumulative area duration. All15 earlier repeat-Throne draws occur before
60s, consistent with the action cap; Oak's one60s boss draw remains. Existing raw
recordings, wins and timings are reused. Stop this underlevel boundary screen;
freeze intended-power role fixtures and adaptation before numerical acceptance.
