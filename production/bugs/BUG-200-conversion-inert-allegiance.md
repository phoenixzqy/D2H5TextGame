# BUG-200 — Make Conversion change actual combat allegiance

- Status: locally fixed and verified in runtime `2a37023d` and presentation
  `f93a4e23`; independent and earned acceptance remain open.
- Severity: High — a paid advertised control mechanic has no targeting effect.
- Source: base `bafc8e0` plus the concurrently completed Holy Shield repair;
  exact probed source hashes now match committed `36fc086`.
- Environment: Node24.21.0, Vite Node runner using the real native player projection;
  seed7. Browser/viewport/locale not applicable to this engine reproduction.
- Owners: root acting as engine-dev/game-designer/QA. Independent acceptance open.

## Reproduction

1. Project a synthetic level30 Paladin with allocated Sacrifice→Zeal→Vengeance,
   Conversion rank1 or20, and Conversion as the native combo.
2. Isolate heroHP2000/MP100 and two living ordinary enemy monsters. Hero acts
   at1700ms; the first enemy acts at1860ms. Other actions are held by synthetic
   statuses. Resources/gear/timing are constructed, not earned campaign state.
3. Run the retained `conversion-native-repro.ts` through the Vite Node runner
   with the repository alias config. See [evidence](../../docs/plans/evidence/d04-conversion-repro.md).

Expected: the struck monster's real scheduled action targets its former ally
while Conversion is active. Enemy identity must remain intact for actual death,
victory, reward and corpse provenance; merely converting enemies must not clear them.

Actual at both ranks: the hero pays25MP; `converted` applies at1700ms and expires
at2700ms. At1860ms the converted monster deals100Physical to the hero, leaving
heroHP1900. The other monster remains at2000HP. Replay and inputs are immutable.

Cause: the adapter emits a status marker, but literal original sides still drive
all attack/skill/healing targeting. `converted` also lacks authored eligibility
and duration; the unknown-status1s fallback is not a controlling design contract.

Required repair: define a useful finite authored conversion contract and tier
eligibility; add authenticated effective allegiance across real scheduled skills,
support targets, relevant hostile aura/pulse scopes and summons. Preserve original
side for rewards/victory/results and test expiry, source death, bare markers,
last-enemy behavior, wave/replay and no duplicate progress. Do not reduce converted
monsters to basic attacks solely to simplify the fix.

No workaround or campaign action is claimed. Original failure and observation
correction are retained; the detailed synthetic repeat is explicitly identified.

## Local repair and verification

[Contract](../../docs/plans/decisions/D04-conversion-v1.md) explicitly authors
8seconds and ordinary-tier eligibility. [Final evidence](../../docs/plans/evidence/d04-conversion.md)
proves native rank1/20 actual monster→former-ally100HP loss with heroHP2000
unchanged and25MP paid. Wave-local effective allegiance covers real scheduled
skills/heals/hostile auras/summon descendants while original sides preserve
victory/deaths/rewards/corpses. Expiry, forged markers, immunity, source periodic/
reflected death and last-enemy waiting are covered. No saved paid state.

Five new files/63cases; final engine7491/269, full14289/634/two existing skips,
typecheck/lint/build/bridge/precache PASS. Production four locale/viewport cases
plus two mobile visual supplements pass; twelve exact five-domain Continue
pairs and thirty geometry samples. All1366actual committed source blobs and760
build hashes match frozen tested inputs. Only one skill credit; Paladin30/30
locally bounded is not earned class/build or independent balance acceptance.
All evidence uses disclosed synthetic fixtures; genuine L33/next402 and Baal
uncleared state remain unchanged. Full privatev1 remains unfinished.
