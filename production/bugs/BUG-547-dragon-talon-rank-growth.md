# BUG-547 — Restore Dragon Talon investment against Act III Defense

Status: fixed locally with +60/rank follow-up; 51 focused checks and earned Act IV complete. Severity: High (martial build progression).
Owner: root, gameplay data. Full independent balance acceptance remains open.

Environment: feat/playable-foundations dirty worktree, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce,
Node24.21.0 production engine/stores; browser/locale independent. Baseline source
b034079020d713da9d493913b91c3af6a4b6d5c12cf09108a6a19f0ea72eecb2.

Reproduction:
1. Restore earned Martial28/XP68069/next356 from
   p15-martial-act3-route-native-v3.json in the retained counted-source packet.
2. Run p15-martial-act3-durance-talon-baseline-forecast-v1.spec.json with
   p15-javelin-focus-run-v21.mjs and area-forecast-v11. Preserve the native
   preceding Durance loss (ordinal355, seed3872949911); forecast seeds are
   recorded in their complete wave observations. Forecast income is discarded.
3. Native allocation of ten available points gives Talon11; a normal free
   skill-reset control gives Talon20/Tail11. Both lose wave4, despite the
   preceding three waves clearing. Owned gear/orders/points were compared first.

Expected: investment in the advertised physical repeated-kick finisher produces
meaningful damage after ordinary chapter mitigation, without changing rank1.
Actual: rank20 is116–136 per attempt. Regular Serpent Magus Defense129 largely
absorbs even cap-rank hits; rare physical resistance30% is applied before
Defense. Rank11 is80–100. Three attempts repeat this damage floor.

Root cause: fixed per-attempt rank growth4 is too small for the Defense curve.
The engine correctly applies resistance then flat Defense; no bypass, weapon
scaling or global mitigation change is justified. Dragon Tail fire also uses
Defense, not magicResist; earlier informal magic-mitigation diagnosis is corrected.

Scoped proposal: Talon growth4→40; rank1 remains40–60, rank11 becomes440–460,
rank20 becomes800–820 per attempt. Preserve three attempts, original target,
4MP/1s, hit/crit/Defense/reflection/death and class/unlock rules. Tail remains6.
Impale20 is2925–2960 every2s with Defense bypass: Talon remains subject to each
attempt's ordinary mitigation. This is provisional tuning, not equal-investment
balance approval. No save shape change or migration.

Security check: pass; five local data/test paths, no credentials, dependency,
network, permissions, CI or publication changes. Author plan: focused RED/GREEN
native mitigation, schema/registration, preview and bilingual allocation tests;
then unchanged-earned-source qualification before any new native action.
No broad earlier-act replay; rank1 checks cover preserved starter damage.

Outcome: +40/rank is implemented in the JSON data. Fifty focused tests pass,
including native mitigation, rank-one behavior, schema/registration and bilingual
preview/allocation checks. Scoped strict types and lint pass. The unchanged
earned-source Talon20 reset forecast clears all six Durance waves; the native
retry matches initial teams, events and metrics exactly. Mephisto dies25.5s;
the hero finishes82HP. Guardian Claim/Act IV unlock pass independent readback.
No save migration. Equal-investment balance, holdouts and full build identity
remain open; see docs/balance/2026-11-01-dragon-talon-growth.md.

## Act IV follow-up — reproduced before further data edits

The initial +40 correction is incomplete. From the retained28/XP161689/next359
source, owned full-set, arcane, physical and speed wards can clear the first four
Plains waves. Izual has43201HP,50% physical resistance and363Defense. Talon20's
ordinary noncritical attempt becomes about42damage. The same source projected
to level48 with paid ordinary growth still times out: Talon-only deals15657 and
leaves27544bossHP. Shadow support also times out while surviving at994HP. Those
projected rewards/state are discarded. Evidence:
`p15-martial-act4-plains-growth-forecast-v1.json`, same next359 seed/teams recorded
in full. No browser/locale dependence; no further native farming was performed.

Expected: a maximum-rank fixed-damage martial finisher retains useful ordinary
damage against on-chapter resistance plus Defense. Actual: +40 remains too near
the mitigation floor even at level48; more vitality/XP does not fix that damage.
Root cause remains the fixed per-attempt growth, not mana or global mitigation.
Proposed follow-up40→60 leaves rank1 unchanged and yields1180–1200 at rank20,
so a minimum ordinary attempt after50%/363 is227 rather than37. Preserve all
eligibility, target, payment, timing, reflection and save rules. Add a native
max-rank chapter-mitigation RED, update exact preview expectations, then run only
the affected checks and exact-source Plains qualification. Full balance stays
CONCERNS until equal-investment and holdout acceptance. Security check: pass for
the same five local data/test paths, with no network, dependency or save changes.

Follow-up outcome:15REDfailures/36passes, then51/51GREEN; scoped strict types and
lint pass. At actual28, the corrected source plus owned Arctic Rogue wards and
hero physical/arcane/speed wards qualify all Plains waves; native teams/events/
metrics match exactly. Izual53.742s. A subsequent owned Isenhart Defense/MR setup
clears City, River and Chaos; Diablo22.4s, final Claim/Act V unlock independently
pass. No further farming. Current earned29 Act V frontier is retained in
docs/plans/evidence/p15-martial-earned-act4-complete-v1.md. This is a joint earned
preparation result, not proof isolating the tuning delta or full balance approval.
