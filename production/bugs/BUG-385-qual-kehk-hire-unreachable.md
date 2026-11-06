# BUG-385 — Complete Qual-Kehk’s explicit Warband hire route

- Severity: High — advertised side-quest completion and Claim have no executable path.
- Status: Resolved locally; bounded current27 implementation/integration/browser accepted.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus preserved local changes.
- Environment: Linux/WSL static source/cross-reference reproduction, not a browser playthrough.
- Viewport/browser: not applicable to this source-routing reproduction.
- Locale: authored English data; both zh-CN/en need aligned current-town copy.
- Seed: not applicable to missing action/event routing.
- Affected systems: engine-dev/frontend-dev/content-designer; root integrates.

## Reproduction

1. Read `quests/side-act5-qual-kehk-merc` and its `obj-hire` in `src/data/quests/side.json`.
2. Follow `hire-mercenary` / named `mercs/act5-barbarian-recruit` into `mercStore.hireMerc`.
3. Follow `mercenaryUnlock` in `src/features/quests/claimReward.ts`.
4. Compare giver `npc/qual_kehk` with actual Act V `npc/qual-kehk`.

Expected: after qualified Rescue, explicitly enlist/re-enlist the named recruit
at current-town Qual-Kehk, then separately Claim its ensure-owned reward.

Actual: hireMerc creates/fields but publishes no quest event; Claim whitelists
mercenaryUnlock only for Blood Raven. Owned roster rows disable Hire. The giver
also differs from the canonical NPC ID. Ownership flags cannot demonstrate the
required actual current-town enlistment.

## Evidence and repair boundary

Read-only producer and independent design-contract investigation reproduced the
source path. Relevant files: compact Act V preserved sides; side catalog;
mercStore.hireMerc and MercsScreen recruit gate; Claim’s exact mercenaryUnlock
branch. [Approved concrete contract](../../docs/design/qual-kehk-warband.md)
preserves existing free mechanics, hero35/recruit22, actual instance investment,
qualified Rescue and no ownership backfill. Full private-v1 remains active;
this report claims no browser/gameplay or earned progression acceptance.

## Local resolution

[Implementation evidence](../../docs/plans/evidence/qual-kehk-warband.md) records
protected Enlist, separate ensure-owned Claim, source/save compatibility and
bilingual headed production checks. Complete1070-file unit coverage reconciles
across runs (22567 tests); strict types/full lint/build pass. Failed attempts and
constructed-capability limitations remain explicit. No full private-v1 acceptance.
