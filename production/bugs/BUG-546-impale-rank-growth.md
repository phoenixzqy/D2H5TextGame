# BUG-546 — Restore Impale rank growth for Javelin single-target progression

Status: fixed locally; full balance acceptance pending. Severity: High (Javelin boss path).
Owner: root, gameplay data. Independent balance acceptance remains open.

Environment: feat/playable-foundations dirty worktree, Node24.21.0, native
production stores/engine, no browser/locale-dependent reproduction. Baseline
source tree2c6638a4b2877040ef35df40dde11b38b579f14f3eeb45ab6c8cd830cc100a13.

Reproduction:
1. Restore verified earned24/XP247702/next249 Javelin source
   p15-javelin-act3-bazaar-native-v1.json in the retained counted-source packet.
2. Run p15-javelin-act3-durance-boss-forecast-v1.spec.json with the existing
   v20 launcher and area-forecast-v9 driver. All projected income is discarded.
3. The level28/Impale8 control and level40/Impale20 control survive the full
   Durance pack route, then retain Mephisto draws at60s. Exact run seed and
   full teams/events are recorded in each wave observation.

Expected: earned investment in Javelin single-target damage can bridge the
chapter-boss budget; buying more skill ranks must provide meaningful growth.
Actual: current +7 gives rank20 only208–243 direct damage. Mephisto remains
18184HP at28 and19606HP at40, of33600; neither control runs out of life.
The chain20-only level28 control leaves17319HP. These are failed diagnostics,
not campaign income, pacing or build acceptance.

Root cause: the authored fixed damage curve has no weapon Attack scaling;
rank20 ordinary Defense bypass works correctly but cannot supply the needed
single-target budget. No engine/timing/resistance change is justified.

Scoped proposal: Impale growth7→150; keep rank1 at75–110,10MP/2s, prerequisite,
bypass, single-target selection and captured10%/s Bleed unchanged. Rank8
becomes1125–1160, rank20 becomes2925–2960. Retain Lightning Strike75 and Poison15.
Use existing literal native rank/Defense/Bleed tests and bilingual previews.

Security check: pass; local gameplay JSON and literal expectations only, no
secrets/dependencies/network/CI/save-format change. Author plan review: ready
with larger rank20 test target to preserve full Bleed lifecycle after the hit.
Full equal-investment balance/holdouts and final integrated acceptance stay open.

Validation: the three existing affected test files pass all 62 checks after
15 expected RED failures. Scoped strict types/lint pass. Fresh actual earned28
Durance qualification and native continuation match all six initial teams,
events and metrics; Mephisto falls at44.856s and the final quest Claim unlocks
Act IV. No reset is spent. No commit/push is made in this task.
Evidence: docs/plans/evidence/p15-javelin-earned-act3-complete-v1.md and retained
p15-javelin-act3-complete-readback-v1.json. Broader balance remains CONCERNS.
