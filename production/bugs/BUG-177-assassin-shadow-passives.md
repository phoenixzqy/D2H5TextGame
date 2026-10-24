# BUG-177 — Apply Fade and Venom in actual combat

Severity: High. Status: fixed locally in `947f020`; independent acceptance open.
Owner: root (engine/frontend/content). Baseline `2a1dc00`.
Environment: Vitest Node/jsdom; no browser, viewport or locale required.
Seed: 7 for actual basic-attack reproduction.

1. Compose a level-30 Assassin with Burst of Speed 1, Fade 1 and Venom 1.
2. Compare the six resistance values, magical dodge and poison damage increase
   against the same player without those allocations.
3. Run a real basic-attack battle with explicit eligible Venom projection.

Expected: authored Fade adds 2 resistance points and 0.5 percentage points of
magical dodge; Venom adds 3% poison damage and poisons successful basic hits.
Actual: all bonuses are absent and no poison status is applied. All three native
reproductions fail on the baseline. Evidence: retained `red-native.log` and
`red-native.test.ts`; current `src/stores/assassin-shadow.test.ts`.

Root cause: marker-only passive builders are correctly excluded from active
casting, but there is no fresh-player Fade/Venom consumer or basic-hit poison
consumer. Descriptions also conflict with authored rank tuning. Workaround: none
for the missing learned effects. Resolve the explicit mechanic contract before
patching; do not replace poison-on-hit with a damage percentage alone.


Verification: 57 focused passes, engine 5,976/197 files, full 12,085/497 files
with two existing skips, types/lint/build pass, production desktop/mobile × en/zh
8/8 and eight exact Continue pairs. Source/Git state remained frozen during full
validation. [Evidence and retained failed attempts](../../docs/plans/evidence/d05-assassin-shadow.md).
Earned class/build balance and full-v1 acceptance remain open.
