# P15 — Skeleton/Mage owner growth and earned Necromancer Act I clear

BUG496 is fixed locally for missing owner-level body progression. Fresh player
Skeleton/Mage bodies receive validated JSON growth after rank and before Mastery;
current/next Skills previews use the actual owner level. Costs, caps, startup-only
summoning, hostile bodies, unrelated templates, RNG and rewards keep their existing
contracts. Malformed runtime levels retain generic preparation without earned
growth; invalid pure preview levels still reject.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Root retains this packet through umbrella QA and owns eventual disposal. Work stays
in claimed human worktree2 on `feat/playable-foundations`, HEAD b5a0898806bf;
existing unrelated edits and original checkout remain preserved. No CI, agents,
installs, commits, pushes, PRs or deployments.

## Exact failed-wave comparison

The immutable before/after `p15-skeleton-owner-growth-wave-*-v1.json` reports
have identical input hashes: retained earned L12 Catacombs ordinal106/index4,
unchanged hero/team/ranks/resources/seed/passives. Before: draw60s, hero272HP,
summon damage19, all summons dead and nine enemies alive. After: win24.14s,
hero363HP, summon damage5248, all summons alive and no living enemies.
This isolated replay publishes no saved progression or rewards. It establishes
that owner growth fixes the recorded damage starvation, not five-act balance.

## New native attempts preserve every earned successor

Ordinal107 (`p15-necro-catacombs-continuation-v1.json`) wins W1–W3, then loses
W4 at14.24s;5300XP/13items retained. All four summons die by7.12s. A champion
Bone Warrior deals264physical damage to the hero; a later critical trash hit
adds66. Hero entry330HP becomes0HP, while233mana remains. This is survivability
and removal pressure, not mana starvation or continuing one-point summon damage.

Ordinal108 (`p15-necro-catacombs-defensive-continuation-v1.json`) uses the public
Akara free stat reset:55earned points refunded/reallocated4Dexterity/1Vitality,
stat allowance3→2, skill allowance3unchanged, no currency cost or skill rewrite.
Dexterity improves attack/speed/dodge; Defense remains132. W1–W4 win; W4takes
54.468s and leaves66HP. W5defeats at7.7s.8290XP/33items retained. This adaptation
alone does not clear the challenge; canonical matrix profiles are unchanged.

Only new XP toward owner13/Skeleton12 (third body) is acquired next. Dark Wood
ordinals109/110 reach their declared two-nonwin limit;11530XP/52items retained,
leaving3132XP to the breakpoint. The subsequent first-wave/flee route preserves
that save. Native111/112/113 win W1, earn1500/1600/1700XP and use the normal
flee sequence without awarding the installed unplayed W2. Prior training, ranks,
items and admissions are never repeated or replaced.

Native Catacombs114 then wins all six waves, including Andariel; combat67.828s,
ending329HP/163mana. Sisters Claim completes and ActII unlocks. Final earned
save is L13/Skeleton12, next native ordinal115, no unused stat/skill points and
respec allowances2stat/3skill. This is a real earned continuation, not a fresh
whole-campaign proof or a guaranteed win-rate result.

Authoritative successor/economy receipt:
`p15-necro-skeleton12-act1-reaudit-v1.json`. The native first-wave continuation
report omitted the quest argument when formatting `campaignTotals(waves)`;
its original totals therefore contain wave-only16350XP/66items. The separate
re-audit preserves that report and adds the actual8000XP/1item Sisters Claim:
24350XP/67items conserved across the continuation. No gameplay replay was needed.
The original native reward, rank/stat, exported-save and stable-source audits pass.

## Focused verification and browser

Relevant existing consumers kept their numeric invariants with owner growth.
The new malformed-runtime case fails before its boundary fix and passes after.
`p15-skeleton-growth-mage-corrected-cases-v1`:39selected cases PASS;55unrelated
cases unrun. Earlier corrected body/Mastery16cases and native Skeleton3cases
also PASS; historical failed logs stay retained. No test is disabled or weakened.
Scoped12-file ESLint PASS (`p15-skeleton-growth-lint-v1`); scoped strict types
PASS (`p15-skeleton-growth-types-v3`). No full unit/engine/earlier-act replay.

`p15-skeleton-growth-browser-v2.json`: zh-CN360×640/en1280×800 PASS, no page,
console or HTTP errors and no horizontal overflow. Original earned L12 import
shows Skeleton202.98Attack/563.68HP and Mage142.8Attack/320.32HP. The Mage stats
are scrolled into view before capture; root inspected the mobile screenshot.
The earlier v1 screenshot shows the tree and is not visible-stat proof. These
are current dev-source Skills checks; production/PWA acceptance remains separate.

All owned verification processes are terminal; exact task Vite caches are absent.
`p15-skeleton-owner-growth-artifacts-v1.json` pins retained source/artifacts,
failed evidence, terminal receipts and cleanup observations. Do not remove this
packet while the full-v1 goal still consumes its earned saves.

Next: continue this Necromancer from115 into ActII, using only relevant new
breakpoints and current-area checks. The earlier Nova Baal checkpoint remains
accepted within its stated scope. Fourteen viable builds/all29areas, final
combined-source five-act integration, economy/30–50active-hour pacing,
production/PWA/endgame/holdout/soak and final owner playtest remain open.
