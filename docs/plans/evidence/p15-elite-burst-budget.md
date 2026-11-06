# P15 — Elite burst budget and Den companions

2026-10-30, HEAD b5a0898 plus local private-v1 work. Root is sole writer in
claimed human worktree2; no independent balance or campaign acceptance.
[Contract](../decisions/P15-elite-affix-burst-v1.md),
[BUG432](../../../production/bugs/BUG-432-elite-affix-burst-budget.md),
[BUG433](../../../production/bugs/BUG-433-den-companions-inherit-boss-tier.md).

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Node24.21.0/WSL, existing installed tools only. Historical failures, recipes,
source copies, journals and outcomes remain intact.

## Runtime changes

Act I forced and idle-promoted groups now give the existing single selected
affix to their first fitted member. Promoted followers keep their tiers and
natural skills; filler remains ordinary. Count, roster, index, level, affix
draw, RNG, presentation and pity routing stay intact. Legacy and Acts II–V
affix composition remain controls.

Shared JSON Attack multipliers change rareElite2→1.5 and rareMinion1.3→1.1.
These two coefficients intentionally apply globally; champion1.5 and all HP,
armor, MR, resistance and cooldown coefficients remain. Exact Attack overrides
still win. L7 Dark One leader124→93 and minion81→68. Through61Defense the
leader's ordinary hit63→32 and native1.5× critical125→78.

Den bossEncounter's two companion Carvers explicitly use existing `boss:false`.
The leader remains a boss and all three enemies remain present. At native L7,
companions now have ordinary Attack65/critDamage1.5 rather than boss104/1.75.
The boss, encounter levels, RNG, IDs, count and treasure class stay unchanged.
Companion health and rewards correctly follow their ordinary tier. No engine
tier fallback change or automatic reclassification of other regions.

## Diagnosis and correction

Fresh unchanged alternate Nova5 profile on pre-fix current source,
`p15-current-cold-nova5-v2`, technicalPASS43.988s:40 first-wave farms toL6,
DenW1 wins4500ms, W2 wins31435ms leaving24/180HP, W3 defeats1735.294ms.
43waves/42wins/1loss/11750XP/174items/~15.13min raw combat; no clear or claim.
This remains a failed alternate diagnostic, not a core14 or full-act result.

Frozen input `p15-den-frozen-input-v1` retains five native settled waves from
merc-equipped preparation. L6 hero180maxHP/Defense61, actual Nova1/Blast5/Bolt1/
Warmth1; RogueDefense70/Attack53. Exact replay of all five original outcomes
passed. The original L7 rare leader has308life/124Attack and four group members
independently cast Arcane. Resurrection is finite per original body. The hero
targets the leader; Ice Blast at3000ms dodges in the original loss.

Study prefixes `p15-den-{cause,chain,tier,affix,affix-attack,minimal-tier}-study-*`
retain every tested hypothesis. Cause-v1 failed from a guessed observation hash
export; v2 uses actual `hashObservation`. The960 isolated-fight study and later
carried-resource three-wave models did not justify Dark One base nerfs, HP cuts
or free MR. Native three-wave grid0/32; single-affix alone14/32 and still loses
the original seed. Single-affix plus rare/minion coefficients26/32, original
76HP; also lowering champion gives28/32 but is unnecessary for the predeclared
26/32 screening floor. No HP or champion reduction was adopted. These models
do not recompute award-dependent progression or reach W4 and are not statistical
certification, native settlement or campaign acceptance.

An initial written rationale incorrectly assumed2× rare criticals and187damage.
Native critical multiplier is1.5: original125damage, not a full180HP one-shot.
It exceeds the77HP carried from W2; ordinary63 plus critical125 exceeds fullHP
over two actions. The simulations used native1.5 throughout, so their results
are unaffected. Decision/BUG/new test were corrected before runtime edits;
`p15-elite-critical-correction-v1.json` records this explicitly. Historical
executed recipes and first mistaken RED remain unchanged.

## Earned sequence and recovery

`p15-elite-burst-preparation-v1` uses the exact previous merc-equipped policy
after BUG432: technicalPASS61.365s, W1/W2/W3 now win, W3 leaves76HP. W4 defeats
at1735.294ms. L7 retry also loses; W1-only training reaches its existing budget.
114waves/112wins/2losses/31970XP/463items/~23.37min raw combat, no full clears.
Thus winning the modeled first three waves did not establish a Den clear.

That W4 reveals all three Carvers accidentally have boss tier. Frozen study
`p15-den-boss-role-study-v1` exactly replays the original W4 and rebuilds the
unchanged leader and IDs with the existing flag applied only to companions.
66 isolated fights: native0/32 grid wins, ordinary companions24/32. The original
76HP seed still loses at3700ms. This role correction alone is not claimed to
guarantee the full sequence.

`p15-den-full-training-v1` evaluates BUG432+433 using a separately declared
legal recovery policy: same initial40 first-wave farms, native hero/merc gear,
and at most two training/retry cycles. After a Den loss, train by completing
Blood Moor challenges instead of fleeing afterW1. Preserve40admissions/cycle,
160total/600wallseconds/10logicalhours; stop on any training nonwin. No free
items, XP, resources, seed, unlock, increased caps or favorable repeats.

TechnicalPASS20.949s. L6 ordinal40 loses W4 at3700ms. Five complete Blood Moor
challenges atordinals41–45 earnL7. Whole Den retry ordinal46 wins all four waves
in7500/17628/13500/7500ms, ending68/192heroHP. Native Akara return and Claim grant
500XP/+1skillpoint.63playedwaves/62wins/1loss, six complete challenges,
22860totalearnedXP/418items/1188145.593ms raw combat (~19.80min). Independent
economy conservation, version32 export decode and within-run source/campaign
manifest equality pass. Original losses remain in the journal. This is one
earned Den recovery path, not Act I completion or a pacing acceptance result.

## Verification

- BUG432 corrected RED-v2:8FAIL10.476s; initial narrow GREEN193PASS14.638s.
  Existing all-members-affix and rare-tier literal oracles were deliberately
  reconciled to the adopted contract, without suppressing tier/cadence/payload,
  natural-skill, RNG, roster, later-act or unrelated assertions.
- BUG433 RED:2FAIL15.859s. Combined final focused consumers480PASS/13files
  31.269s, including manual/idle Den companion regression. Scoped lint-v2
  PASS17.226s. Production/PWA build PASS18.516s; existing bundle-size warnings
  remain, with no blanket performance/PWA acceptance inferred.
- Public production Chromium-v2:2PASS38.672s, zh-CN360×640/en1280×800. Public
  Import uses the actual earned L7 pre-retry export, unchanged state. Ordinary
  Enter/Skip four waves→Victory→Akara→Claim→Export→Reload. No bridge or store
  injection. Both exports L7/currentXP3029/+1skillpoint/ordinal47, actual Den
  clear and claimed objectives. Duplicate owned inventory IDs absent; Claim
  remains disabled after reload; touch target44px and no errors/overflow.
  This proves browser retry/claim from earned state, not browser fresh acquisition.
- Browser-v1 timed out entering the large pretty-printed save before import or
  combat; failure retained. V2 waits for visibility, compacts identical JSON
  whitespace and preserves original errors safely. No source or state change.
  V2 mobile victory capture showed the top of an internal scroll. Separate
  visual-v3:2PASS49.423s; the mobile claimed-quest card was visually verified.
  The mobile victory capture shows the long reward list; full result-heading
  visibility is not established by that image. Victory is proved by DOM/export.
- Types-v1 exceeded180s; exact owned process collected and laterPIDabsence
  verified. Types-v2 completed236.738s and found three JSON-to-tuple casts in
  the two new regression files. Corrected the JSON fixture casts through
  `unknown`; emitted gameplay/test logic is unchanged. Final types-v3
  PASS10.931s; final two regression files also pass the isolated integration run.
- Engine-v1 was deliberately stopped before the companion/source edit after
  finding stale rare-tier literal consumers;202.285s/partial, never acceptance.
  Full ordinary unit-v1 receivedSIGTERM15 at205.882s, before its1800s bound;
  signal origin is unknown, with no agent stop request issued for that run.
  Source3101inputs stayed stable;48files completed with one skeletal-mage
  cross-wave failure. All owned descendants were collected and exact finalPIDs
  verified absent. This partial interrupted run is not integrated acceptance.
  The mage failure reproduces separately (12PASS/1FAIL across3files40.537s);
  BUG434 tracks its causal investigation.

## Continued earned Act I route

`p15-earned-act1-merc-full-training-v1` runs another fresh process, repeats the
declared earned preparation, allocates the Den quest point, and follows the
existing Den-farm-toL12/five-area Act I policy with earned hero/merc gear.
No imported checkpoint, new power or favorable retry. Original160admission/
600wallseconds/10logicalhours/L14caps remain; any later nonwin stops this case.

TechnicalPASS91.384s, manifests/export/economy exact. After the retained L6loss
and L7Den retry,57further complete Den farms earnL12. Blood Moor, Cold Plains
and Burial Grounds (actual Blood Raven) clear; Dark Wood W1–W3 win, W4 defeats
18494ms from301HP. EndL12,108admissions,306playedwaves/304wins/2losses,
66completedchallenges,159520totalearnedXP/2881items/4136479.629ms raw combat
(~68.94min). No Act I completion, Andariel claim, Act II unlock or pacing
acceptance. The original route failure and full journal/checkpoint remain.

Remaining: full current validation, continued earned Act I→V progression,
14-build/economy/30–50-hour pacing, signatures/scaling and integrated acceptance.
Owner playtest follows implementation. Chromium works in WSL; CI remains locally
deleted by owner request. No commits/push/PR/install/deploy. Retained packet
artifacts/typecache and umbrella claim are owned by root until final review.
All browser/diagnostic sessions are collected; exact disposable763-file bundle
was hashed then removed after consumers, and all four diagnostic Vite caches
are absent. `p15-elite-burst-cleanup-v1.json` and full-unit cleanup receipt retain
verification. Current mage causal work has its own separate owned process.
