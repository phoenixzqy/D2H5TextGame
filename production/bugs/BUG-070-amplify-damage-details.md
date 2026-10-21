# BUG-070 — Expose Amplify Damage resistance points and duration

- **Status:** Fixed — bounded bilingual presentation accepted; runtime BUG031 already fixed.
- **Severity:** Medium — gameplay works; exact curse meaning is hidden from the player.
- **Owner / affected systems:** frontend-dev, writer, qa-engineer; Skills detail and bilingual copy.
- **Build:** `6e39e4d` (Meteor archive-only follow-up does not alter app).
- **Environment:** Linux source reproduction; no browser/viewport executed for this report.
- **Locales:** zh-CN and en.
- **Seed:** Not applicable to static presentation; no combat simulation claimed.

## Reproduction

1. Read authored `skills-necromancer-amplify-damage` in necromancer.json and immutable `AMPLIFY_DAMAGE_DEFINITION`: all enemies, physical-resistance reduction50points, duration3000ms, ranks1–20.
2. Trace `SkillsScreen.dynamicDescription`: no Amplify-specific formatter; no damage/summon row, so generic utility prose returns without the authored curse explanation.
3. Read both `necromancer.amplify-damage.desc` strings: ambiguous50% and several turns rather than exact resistance percentage points and3s.

This is a source reproduction. Frozen baseline source bytes/hashes precede any fix;
reviewed tests will separately demonstrate actual unchanged-production RED.

## Expected

Bilingual detail states all living enemies lose50 physical-resistance percentage
points for3seconds at every skill rank, using immutable JSON-derived metadata.
Keep L1/no prerequisites, authored mana15/CD3 and scaling, displayed through existing
rounding conventions. Preserve learning, resources, combo, current recording and save.

## Actual / root cause

The generic utility formatter discards the authored curse semantics; old locale
copy also lacks precise potency units and duration. Existing runtime implements
D04; no engine defect or new balance choice is inferred.

## Evidence / workaround

Read [D04](../../docs/plans/decisions/D04-amplify-damage-v1.md) for exact mechanics.
[Bounded control](../../docs/plans/p08a02d-amplify-damage-ui.md) defines the fix.
Root-owned RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-amplify-ui-0bebeotd`
retains baseline-source-freeze.json and exact original UI/locales. Archive and verify
all evidence before exact cleanup. No fullP08/C1/private-v1 acceptance.

## Bounded resolution

Source `857164c` adds the immutable authored curse formatter and canonical/legacy
localized labels. Actual frozen V4 RED14failed/12controls became26passed; full5470
units/202files, types/lint/productionbuild pass. The separate two-path production
browser increment `67034d6` passed both locales on its first attempt; QA personally viewed
all18originalPNGs. Native0→1→2 point/rank-only changes, pausedDOM/resources/combo,
combo edits and explicit wholeSaveCurrent/meta close/reopen equality are verified.
Imported eligibility is scaffolding; full hidden recording identity is unit proof.
See [evidence](../../docs/plans/evidence/p08a02d-amplify-damage-ui.md) for exact
validation, finite nine-size Chromium scope, durable disposition and cleanup.
GD/TD/QA/producer approval applies only to BUG070/P08a02D. Ordinary15s unit target
miss and existing build warnings remain; nativecasting/earnedcampaign/balance/
performance/allbrowser/touch/fulla11y/fullD04/P08/C1/private-v1 remain open.
