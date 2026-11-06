# BUG-536 — Restore capped caster throughput in crowded Act V waves

Status: locally resolved in earned route; independent balance acceptance pending. Severity: High.
Owner: root, content/game balance; independent acceptance remains open.

Reproduction: inherited dirty feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce.
Paladin data SHA256 7ec3c4db4059a6b5dce4625c2582aefcac76b77192f5cc1b8afb980e06c2246f. Node24.21.0/WSL, production engine;
no browser viewport or locale dependency. Both locales derive ranges from data.

1. Restore the earned Holy Bolt Bloody Foothills completion / Frigid defeat:
   packet p15-holy-bolt-act5-bloody-continuation-v1.json,30/265034/next537.
2. Load p15-holy-bolt-act5-frigid-owned50-forecast-v3.json. Its projected50
   preparation uses owned gear, native sockets, HolyBolt20/Hammer20/Conviction16.
   These projections are diagnostics; no level or material spending is earned.
3. Inspect Frigid W4 seed2472180142:16 Frozen Terrors, including a21963HP leader.
   Hero survives but the native production battle draws at60000ms.

Expected: P15 supplies viable, distinct earned caster builds through the authored
campaign. Capped area damage should support crowded groups without changing
primary identity or treating a timeout as a clear.

Actual: owned50 armor solves W3 caster survival, but W4 still draws near fullHP.
Hammer11 and Hammer20 projections both fail. More defensive stats cannot fix a
safe timeout; weapon Attack does not scale these spells. This does not prove
that every possible equipment/party policy fails.

Cause under evaluation: Hammer60–90 plus6/rank gives174–204 at20 against
sixteen enemies, slowed by repeated authored Chill. Skill CD2s, native HP/MR,
percentage resistance, dodge/crit, party loss and wave carry remain real.

Evidence: exact forecast/spec/rows/method/exit records in packet
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1;
passing p15-holy-bolt-act5-bloody-readback-v1.json proves the earned frontier.

Candidate and bounds: docs/plans/decisions/P15-blessed-hammer-growth-v1.md.
No free farming income, increased timeout, enemy-specific exception or physical
fallback is allowed. Earlier/later balance, holdouts and final review remain open.

Candidate withdrawn before earned use. Standalone before/after inputs replay native
aura correctly but Holy Bolt first never casts Hammer at the current action period.
The6→12 comparison is exactly identical and cannot justify that tuning. Restored
the sole task-owned production coefficient to6, retaining rejected input/binding
and failure evidence. Check explicit Hammer-first W4 with legally earned Hammer20
before proposing a curve change. No post-candidate reward or spending occurred.

Preparation follow-up: unchanged6/rank data qualifies the complete prospective50
Frigid route with future3Dex/2Vit/0Energy allocation, HB20/Hammer20/Conviction16,
Hammer-first W4 and Holy-Bolt-first other waves. Source remains earned30/265034/537.
No stat reset, no extra point grant and no projection spending. W4 wins50117.647ms;
all six waves win. The root is a preparation/priority constraint at this frontier,
not evidence for the withdrawn Hammer coefficient. Bounded actual training and
fresh earned-state requalification are still required; broader balance remains open.

Earned follow-up, 2026-11-01: actual level50/10241/1191 preparation with78MR
fails Frigid W3 after a dodged Holy Bolt prevents healing. Two native normal
Diamond fusions and eleven flawless insertions qualify the exact source at80MR
and37Arcane resistance. Actual Frigid1191 clears6/6 and its rescue actions;
independent route readback passes. Crystalline1192 then wins W0–2 and draws W3
at60000ms with837/846HP. All income and paid preparation remain retained.

Resume source p15-holy-bolt-act5-frigid-continuation-v1.json is earned50/112151/
next1193. Full Crystalline forecast v2 with Hammer-first order clears W0–2,
then draws W3 (seed713652825, eight authored scaled enemies) with821/846HP.
The opening18-enemy input is seed3429098796. Unlike the withdrawn Frigid
study, these inputs actually cast Hammer. See P15-blessed-hammer-growth-v2.md
for the new fixed-input evaluation; no candidate source change is yet accepted.

Local resolution: the new exercised comparison supports6→12 growth. Fixed
W0/W3 inputs each win64/64 at12 (before64/64 and60/64), with no deaths and
exact native baseline reproduction. Four normal Diamonds in owned belt/boots
and explicit elite healing priority qualify Crystalline; native Crystalline/
Ancients clear. A single available stat reset balances casting speed and mana
for Baal (48872ms); native Arreat also clears. Terminal report
p15-holy-bolt-act5-throne-continuation-v1.json and independent readback pass,
preserving all29clears and63paid insertions. Source remains uncommitted locally;
broader build balance, earlier ranks and holdouts are still required.
