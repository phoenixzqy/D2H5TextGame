# BUG-659 — Double Swing exhausts prepared Act IV attempts

- **Status:** Open — observed progression failure; no verified fix.
- **Severity:** High for intended-build acceptance.
- **Owner:** Root; game/level design and campaign preparation.
- **Affected systems:** Physical damage, owned equipment selection, intended
  Double Swing rotation/growth and Act IV throughput.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted
production tree `1566ace2ed41d60cabeeb224cf43aefad255f45f21d9e43b6ae06e3367a65e7d`.
WSL/Linux native Node/Vite SSR store/engine driver; browser/viewport/locale not
exercised. Seeds at ordinals708/709/710:1469841449/2103346813/2156794067.

1. Continue exact earned Act III level47/next678 export, SHA256
   `2eb82f0f14d031e74d850992279f7732ce4c04488e4248c4cc877ad6776c45b5`.
2. Retain the intended profile, Prayer, native earned equipment and original
   `challenge-prepared-act4-v1` limits; perform30 cleared-Travincal training admissions.
3. Observe the three permitted Plains of Despair attempts, all reaching Izual W5.
4. Read the retained journal; do not replay failures or renew spent attempts.

## Expected and actual

Expected: earned intended Double Swing equipment/ranks support Normal progression
with actual boss victory and legal quest Claims.

Actual: three60-second draws. Boss Life37433/43058/42541 ends17724/21600/24628.
Hero and Prayer survive; hero minimum mana494/505. Hero total direct damage
8835/6956/10766, Prayer16260/19784/12852. Hero Swing damage to Izual only
7117/6106/6544; Bash6/3/7. No Act IV Claim/clear or Act V entry.
Terminal level49/next711 preserves all33 admissions,195waves (192wins/3draws),
3460851XP,2115new items,2108salvages and all previous costs/failures.

## Diagnosis and evidence

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-swing-earned-act4-v1`: native report/journal/export, first frozen
readback with nine negative controls and passing closure. Retained-only
`-failure-analysis.json` SHA256
`e56bf284408bb6b700fa34611bfbba6a93105b9064b186395e932180a2095cfe`.
[Progression evidence](../../docs/balance/2026-11-03-swing-earned-progression.md).

Attack scaling already exists: BUG505 added20% ×(effective rank−1) Attack per
strike. Do not duplicate it based on the superseded sentence in D04. Hero
Attack199 retains the ilvl9 Cleglaw scimitar; no Sword Mastery is learned.
All67 weapon decisions select nothing, rejecting187 distinct higher-Attack
owned candidates under the all-stat nondecrease campaign policy. An eligible
owned unique scimitar would project391Attack at−10speed/−8magic resist. This
establishes a preparation-policy limitation, not a native equip defect or a
proven Izual correction. Missing ordinary War/Legend Sword drops (BUG660) are a
separate content omission; existing better weapons were already owned.

No accepted numeric tuning or verified workaround. Attempts708–710 remain
exhausted. Any future diagnostic requires its own bounded plan and cannot count
as earned continuation or erase the three failures. No new agents dispatched;
root self-review is not final independent acceptance.

## 2026-11-03 — Selection corrected; retained preparation remains incomplete

[Owned-weapon evidence](../../docs/plans/evidence/p15-barbarian-owned-weapon.md):
the intended level6 physical selector and first-affinity precedence pass35
focused cases, scoped strict types and lint. One exact retained-save check
selects a stronger owned weapon but stops during staging:149 backpack items
require50 transfers before retrieval, beyond its frozen32-action limit.
All33 settled transfers and the whole partial terminal save reconcile; native
equip never occurs. The original source save remains unchanged, and the partial
successor is retained without restarting preparation or renewing its limit.
No combat, time advancement, Act IV clear or verified throughput correction.
Status remains Open; original attempts708–710 remain exhausted.

## Retained damage attribution — 2026-11-03

[Six-wave attribution](../../docs/plans/evidence/p15-act4-damage-attribution.md)
reconciles every damage source and exact Izual Life deltas without combat or
native-save mutation. Throw's rank-one Swing filler deals only79boss damage
across three fights; Swing's current199Attack produces95–105noncritical boosted
hits while Howl consumes roughly one-quarter of hero actions. Existing Attack
scaling and mitigation explain these observations; no new formula correction
is justified. Next evaluate attainable offensive equipment/rotation preparation
under a prospective bounded diagnostic; preserve all failed and exhausted
route/preparation budgets. No encounter fix or acceptance follows.


## 2026-11-03 — Sword preparation improves diagnostic damage; failure remains open

[Preparation evidence](../../docs/plans/evidence/p15-swing-offense-preparation.md)
records the sole bounded18-simulation diagnostic:15exact control waves and
three candidate boss waves, with native56-point respec/allocation, no gear change
and no income/settlement/admissions. Iron Skin16→1 funds Sword Mastery15;
Swing precedes Howl. Izual remaining Life17724/21600/24628 becomes4704/10109/11852
(73.46%/53.20%/51.88% reduction), but every fight remains a60-second draw.
Adopt the corresponding growth/priority and sword-affinity preparation in five
campaign paths;11selected regressions, final scoped strict types/lint and exact
independent v2 readback pass. Original setup/type/lint failures remain retained.
This verifies preparation, not an ActIV clear or earned continuation. Status
remains Open; original attempts708–710 and the separate32-action staging budget
remain exhausted. No original save, cost, failure, seed or ordinal is rewritten.

## 2026-11-04 — Combined owned sword diagnostic succeeds

[Combined evidence](../../docs/plans/evidence/p15-swing-sword-combination.md) records three Izual defeats in24.985–32.238s with
391Attack after the accepted skills/rotation and owned sword preparation.
No damage tuning is justified. The native equip succeeds but its external
verifier fails before capturing the terminal export; separately reconstructed
state passes conservation/roundtrip checks and stays explicitly reconstructed.
No earned clear, campaign admission, rewards, repeated native actions or renewed
attempt/staging allowances. BUG659 remains Open; full-v1 acceptance is separate.

## 2026-11-04 — Native forward diagnostic clears Acts IV and V

[Forward evidence](../../docs/plans/evidence/p15-swing-verifier-forward-diagnostic.md)
continues the explicitly reconstructed preparation in two prospectively capped
diagnostics. First admissions711–713 win all18 Act IV waves;714–718 win all33
Act V waves. All main Claims, consumed sources, Baal title and Nightmare unlock
reconcile with the observed native level50/next719 export. No new gear, reset,
training, retry or combat-formula change occurs. Native earned-point growth
raises Sword Mastery15→17→20; gear, companion and reset allowance stay exact.

Separate raw journal/economy/quest/point/source readers pass. BUG669's future
capture helper now has three passing regressions plus scoped types/lint.
The original missing terminal observation remains unavailable; both forward
diagnostics preserve reconstructed ancestry and confer no earned completion
or formal balance credit. Original708–710 failures and staging costs stay spent.
This verifies the preparation's forward viability, so further damage tuning is
not justified by those failures. Status stays Open for an observed earned
intended-build route and independent final acceptance; full Normal count stays10.
