# Lightning Sentry earned-growth correction

2026-11-01. Type: data tuning. Author review: CONCERNS; broader balance, disjoint holdouts and final acceptance remain open. Scope is the existing D06 trap rank-growth knob.

| Parameter | Before | After | Reason |
| --- | --- | --- | --- |
| Lightning Sentry damagePerLevel | 6 | 24 | An invested level24 trap must overcome ordinary Act II MagicResist and resistance rather than spending all its pulses near the damage floor. |

Rank1 remains75–110; rank2 becomes99–134, rank7 becomes219–254 and rank20 becomes531–566. Against the observed Summoner's25 Lightning resistance/81 MagicResist, ordinary cap pulses become317–343 instead of60–87. This supplies a useful primary-damage choice while retaining the same paid points and mitigation. It is not a claim that every route or late-act build is balanced.

The source edit changes only Lightning Sentry's JSON growth. Preserve3s half-open lifetime/1s interval/three pulses, all-enemy targeting,22MP/2s, unlock24/cap20/transitive prerequisites, separate seeded target rolls, ordinary MagicResist/resistance/shields/reflection, death and recast rules. No weapon scaling, new runtime branch, save migration, enemy reduction or reward grant.

Acceptance: failing actual-data/preview assertions first; native paid pulses at ranks1/7/20 against25 resistance/81 MagicResist, with one payment and exact pulse clocks; truthful bilingual current/next/MAX; existing affected trap mechanics remain green. Then compare a fresh exact-earned-source whole-area forecast with the retained failures, and qualify before any native retry. No earlier-act or broad acceptance rerun. The package has no validate:data script; actual skill JSON is checked with the existing Ajv validator.

Author plan challenge: keep this to one curve parameter and its direct tests. Preserve the earlier Talon/Tail fixes and all old evidence. Reallocation is evaluated independently; a winning combination does not isolate a global balance effect. Later acts, acquisition cost, difficulty spread and30–50 active-hour pacing still require their own evidence.


## Focused result

162/162affected tests, scoped strict types and corrected lint pass. Actual skill JSON passes the existing Ajv validator. Corrected RED reproduces the intended growth failures before the edit; the initial mana-event assertion mistake is retained and corrected without weakening damage checks. Full2090-input audit changes exactly five declared data/test paths. Binding: p15-lightning-sentry-growth-source-binding-v1.json; current launcher v26 validates the transition before inherited historical verification, while production loads current disk bytes.

At the same earned24/next290 source and legal Lightning20/CBS7 reset, old growth loses to Summoner with2538HP remaining; new growth clears all six waves and kills Summoner19.686s. Native admission290 matches the winning forecast exactly. Current-investment Lightning7 remains a60s draw with539bossHP, so the data correction does not silently bypass paid allocation. Later native Tomb draw retains7622DurielHP; paid order controls alone still draw. Already-owned Rogue Doomslinger/Coif/Bloodfist/two-socket shield plus2Eld/4Nef qualify and reproduce a59.4s Duriel win at ordinal292. Independent Act II readbacks pass, all inherited losses/rewards/gear remain owned, and only one qualified free reset is consumed. No additional farming.

BALANCE-CHECK: CONCERNS. These focused before/after controls establish the intended mitigation improvement and a viable earned Act II continuation. They do not establish the full1000-seed/class/tier/difficulty grid, ±20%build floor, economy, holdouts, later acts or30–50active-hour pacing; those remain umbrella work.
