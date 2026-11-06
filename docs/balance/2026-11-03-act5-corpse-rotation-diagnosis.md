# Act V corpse rotation diagnosis, 2026-11-03

Exactly twelve isolated battles compare the three recorded Frigid Highlands W5
failures. Every baseline event and complete final player/enemy team reproduces.
Frozen production2147/campaign123 input hashes agree before and after execution.

| Original ordinal | Baseline | Amplify → CE → physical | Owned weapon | Both |
| --- | --- | --- | --- | --- |
| 1456 | draw 60s | win 53.357s | draw 60s | win 48.702s |
| 1457 | draw 60s | win 57.215s | win 58.992s | draw 60s |
| 1458 | draw 60s | win 55.218s | win 57.577s | win 50.104s |

Amplify→CE→physical wins all three with original gear, carried statuses/resources,
cooldowns, real corpse authority, original RNG and unchanged learned ranks. It
retains9/12/9 CE casts and8/5/6 basic attacks. All heroes survive at1163Life and
756Mana. The stronger legal owned polearm raises attack206→387, but removes the
offhand, lowers speed145→140 and multiple defenses/resists. It wins two alone;
its combination with the rotation regresses ordinal1457 to a draw. Do not select
that gear change. No damage-formula or resource-starvation defect is established.
The supported cause is an unsuitable late pack action list: Wall/Teeth consume
actions while this identity relies on curses and mercenary/hero physical damage
for its first kill. These three inputs support a candidate, not general safety.

Implementation decision: declare the existing learned Amplify→CE order for all
five Act V main-route areas in the intended corpse profile, using an optional
area priority override before the existing learned-curse selection. Earlier-area
and unspecified-boundary orders retain their declared recipe. The combo setter
stores priorities; native CE authority separately requires the class, unlock,
allocated Teeth prerequisite and allocated CE rank. No source stats, rank costs, equipment,
corpses, skill coefficients or controller/retry limits change. This preserves the
Corpse and curses identity contract and the earlier CE+80 rejection.

Verification will cover native combo/save conservation, all five configured areas,
legacy profiles, unlearned ranks and restoration of the ordinary area recipe.
Only affected constructed checks/types/lint are needed. Any earned comparison
must be separately frozen, retaining costs and the exhausted original1459; these
isolated wins do not authorize restarting it or count as balance acceptance.

Plan review: ready for a minimal area-recipe correction; full native carry can
still differ from isolated-wave outcomes and remains required.
Security check:pass; local first-party code/evidence, no installs/network,
credentials/permissions/CI/publication changes. Root retains the packet until
umbrella review and owns eventual cleanup.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files:`d02-act5-fixed-wave-inputs-v1.json`,
`d02-act5-fixed-wave-diagnosis-v1-plan.json`,`.ts`,`.json`,
`-launcher.mjs`,`-attempt1.log`,`-attempt1-exit.json`,`-process-exit.json`.
Process exit0,8197.763ms including launch/capture; task cache absent. Twelve
battles only, no native admissions/save mutations/rewards/retries/population
acceptance. All twelve full inputs/events/outcomes and equipment candidates are
retained. Formal acceptance remains0/210; full privatev1 scope remains active.


## Recipe implementation and focused verification

The optional profile `priorityByArea` is implemented through the shared combo
preparer, intended-profile adapter and native runner. The intended corpse
profile declares Amplify → CE for the five main Act V areas. Existing learned
curse selection remains; unspecified/earlier areas use the ordinary recipe.
Five level63 area cases verify projected order, complete native save conservation
and restoration at other/default area boundaries. Legacy and unlearned-rank
cases complete the seven new cases.

The selected run passed37/38 cases; the final failure was a provably wrong test
expectation. Neither the combo setter nor the ordinary class-active projection
filters CE: its dedicated `composeCorpseExplosion` authority validates class,
unlock, Teeth and allocated CE rank. The corrected test proves both ranks are
zero, CE authority is absent and every saved domain except combo is unchanged.
That one case now passes; the37 previously passing cases were not repeated.
Total38 distinct selected cases pass;52 unrelated cases remain deselected.
Scoped campaign types and explicit unignored lint pass. The original type
invocation also included the already executed isolated diagnosis scratch file;
its three typing errors are retained and that frozen script is unchanged.
The successful type check covers all five changed campaign TypeScript files
and their imports. The first lint attempt only warned that tests were ignored;
the successful invocation explicitly includes them with zero warnings.

Receipts in the packet: `d02-act5-corpse-recipe-v1-green.log`,
`-final-case-v2.log`, `-final-case-v2.exit.json`,
`-types-campaign-only.log`, `-types-campaign-only.exit.json`,
`-types-config-campaign-only.json`, `-lint-unignored.log`,
`-lint-unignored.exit.json`. All failed receipts remain as evidence.
The previous goal turn was status-only (no progress). This turn changes the
incorrect test/documentation and closes the affected implementation checks.
Native Act V continuation and broader acceptance remain unproven.
