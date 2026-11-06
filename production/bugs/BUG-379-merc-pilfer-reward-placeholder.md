# BUG-379 — Pilfer never increases the native victory reward

- Severity: High — Pickpocket's advertised signature reward bonus has no effect.
- Status: Open — native repair verified; broader acceptance pending.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus existing independently verified native A/B changes, current claimed worktree.
- Environment: native Vitest/Linux; no browser/viewport involved.
- Locale: mechanical reproduction is presentation-independent; zh-CN/en descriptions also incorrectly promise chance-based gold theft.
- Seed: 7 for combat and the existing derived per-wave reward seed.
- Owners: engine-dev (paid combat result), frontend-dev/store integration (private native settlement), content-designer/writer (authored tuning and bilingual description).

## Reproduction

1. Load the actual mercenary pool and create mercs/tavern-thief-pickpocket through createMercFromDef and mercToCombatUnit.
2. Run an ordinary recorded battle with its owned mskill-pilfer bar at literal ranks1 and20. Observe multiple paid actions.
3. Separately field that actual Pickpocket in a constructed native Blood Moor run, with imported survivor stats and a synthetic hero finisher. This fixture isolates native reward wiring; it is not earned progression.
4. Drain real playback and settle the published recorded-wave receipt normally. Compare inventory credit to an independently reconstructed reward oracle using the unchanged reward seed and hero find plus literal30.

Expected: one nonstacking +30 percentage-point shard-find bonus after a paid native cast, with the existing no-gold currency design. Hero find0 yields101 rune-shards; find50 yields144 in these fixtures.

Actual before repair: the battle result has no paid bonus at ranks1/20. Native inventory receives78 instead of101 at find0 and120 instead of144 at find50. All four frozen primary tests fail their intended assertions, without collection errors.

Root cause: mskill-pilfer remains a generic physical stub. It creates no paid wave reward output, and native victory generation reads only the hero's GoldFind. Public attack text cannot supply missing reward authority.

## Evidence and retained boundary

Regression primary: src/stores/merc-pilfer-primary.test.ts, frozen SHA256 e5f2c0feb90f4b2538fab2306dbcfb9b088b598f9f4ace6b9531499ba9792b37.
Required evidence is retained at /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-pilfer-sd868yw1 under pilfer-primary-red labels: report/log/terminal receipt and byte-identical2114-input maps. Driver3587545 and npm3587547 are absent. Root owns eventual exact-path cleanup after unfinished acceptance.

The independently reviewed implementation contract is [D04 Pilfer](../../docs/plans/decisions/D04-merc-pilfer-v1.md). Existing native A/B changes, H3 failed-no-app boundary and all protected/closed-fixture restrictions remain. No earned/browser/campaign/economy/balance/full-v1 acceptance is established.

## Native repair checkpoint

[Native evidence](../../docs/plans/evidence/merc-pilfer.md) records the unchanged
four-case primary GREEN, 216/8 focused pass and 21708/1023 full ordinary-unit
pass, type/lint/boundary checks, final bilingual skill/recruitment copy and
rebuilt product. Exact input maps, independent reviews and disposable-build
cleanup are retained. The final recruitment change is two copy leaves only;
mechanics and tests remain identical to the full-unit inputs. No earned,
browser, balance, campaign or full-v1 acceptance is established.
