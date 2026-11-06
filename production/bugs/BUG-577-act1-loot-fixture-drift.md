# BUG-577 — Refresh Act I loot fixtures after ranged-source additions

- Status: Fixed locally; no commit created.
- Severity: Low; stale checks, no new gameplay fault.
- Build/environment: feat/playable-foundations, Vitest 1.6.1/jsdom on Node
  24.21.0; browser viewport/locale not relevant.
- Reproduction: run `combatHelpers.act1-boss-loot.test.ts` with the BUG576
  wishstone gate bypassed in memory. Eight failures persist: seven old
  eligibility counts and the seed1 item list.
- Expected: exact assertions reflect the previously implemented authored bow
  and javelin acquisition sources; all rarity/ownership/save checks remain.
- Actual: level12/14 counts are nine rather than eight; level19–59 counts
  are ten rather than eight. Seed1 bases are helm-skull-cap, weapon-bow,
  wp1h-scimitar and sh-kite. Weapon base rolls use attack, not defense.
- Evidence: `bug576-unrelated-baseline-v1.json` in the shared external packet;
  session56515 exits1, eight failures/four passes/nine cases not selected.
- Root cause: source additions were covered elsewhere but this older finite
  count/seed fixture retained its pre-addition expectations. The production
  treasure table is unchanged by BUG576.
- Affected systems: qa-engineer; root owns this fixture-only correction.
- Validation: all 21 cases in the corrected fixture pass within the affected
  81-check run. No snapshots or production loot tables were regenerated.
