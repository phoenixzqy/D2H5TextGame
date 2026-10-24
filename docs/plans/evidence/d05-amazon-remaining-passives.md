# D05 — Amazon Avoid, Evade and Pierce / BUG172

2026-10-24. Base `b5ce230`; existing claimed human worktree, root sole writer.
Implemented in `9658f86` and locally verified. Independent acceptance,
earned seven-class builds and balance remain open.
[Contract](../decisions/D05-amazon-remaining-passives-v1.md).

## Behavior

All six authored Amazon passives share fresh player composition. Avoid adds1pp
magical dodge/rank; Evade adds0.5pp each physical/magical dodge/rank; Pierce adds
2% direct physical damage and1% equipment-derived Attack/rank. Unlocks12/24/30,
cap20. Native learning owns Dodge/Avoid/Penetrate prerequisites. Exact authored
and canonical aliases resolve maximum valid integer rank once. Wrong class,
invalid rank/level and lookalike aliases give nothing.

Pierce/Penetrate Attack percentages add before multiplying fresh equipment Attack.
Pierce uses the existing per-type direct-hit path; fixed elemental bases stay
unchanged. Existing dodge/hit and damage rules remain controlling. No passive casts,
RNG draws, resources, save shape/version or potency changes. Current recordings
stay fixed; next-wave/replay resets preserve original pools and reward ownership.
Both locales replace unsupported ranged/movement/projectile promises with actual
bonuses and next-wave timing. Fractional current/next values remain exact.

The existing scalar-only definition is extended to a frozen multi-stat record;
all six identities have their exact allowed coefficient count. Old single-stat
shapes retain maxProperties1. JSON validation remains strict/allErrors, finite
nonnegative tuning with no invented balance ceilings. No generic passive metadata
is blindly activated for other skills, forms, spirits, mercenaries or summons.

## Verification

- Original unchanged runtime:10causal composition failures, including native stats,
  fixed physical hits, additional magical/physical misses and additive Attack.
- Schema/UI initial9fail/9pass. Initial Pierce prose oracle wrongly asked for
  percentage points; corrected to equipment-derived Attack before frozen final
  UI6RED/6controls. Initial run retained, no credit for that incorrect expectation.
  Closed-schema3RED/3authored controls; genuine missing-validation failures.
- First green38PASS/4files; final focused85PASS/7files,11.57s. Source/definition
  copy/freeze/duplicate/missing/alternate tuning, rank1/20/cap, exact aliases,
  wrong classes/levels, gear removal/nonaccumulation and real direct-hit oracles.
- Native4PASS, including ordinary prerequisite allocation of all six, recording
  stability, next-wave bonus publication, exact original pools, explicit
  reset/replay/no refill/no income/no compounding. Constructed finisher isolates
  lifecycle and proves no campaign or balance outcome.
- Engine5849PASS/184files,105.88s, exit0. Final full11876PASS/471files,
  two existing skips,611.55s, exit0.
- Initial typecheck and final typecheck pass. Standard lint passes; final browser
  lint attempt first reports its normally ignored-file warning; explicit --no-ignore on both new browser
  files passes. No lint configuration changed.
- Explicit VITE_E2E=false production build passes; all four emitted JS chunks
  scanned with the five repository forbidden bridge patterns, zero matches.
  Existing bundle/PWA manifest/Browserslist warnings remain unresolved.
- Chromium production4/4 en/zh-CN×1280×800/360×640,90.15s. Zero retry/skip/flaky
  or captured errors. Native learn/rank-up,44px controls, both Evade stats and
  fractional current/next deltas; all three passive combo exclusions. Four exact
  Save→close→Continue player/inventory/map/merc/formation pairs compared again
  from export payloads. L30 eligibility is constructed, not earned.
- Chinese mobile Evade and English desktop Pierce screenshots inspected: actual
  descriptions and values readable. No full visual/a11y/performance acceptance.
- Root code/evidence self-review only. Exact fresh stat ordering, per-type damage,
  immutability, no allocation/gear drift and save compatibility checked. No
  independent reviewer/QA approval is claimed.

## Retention and remaining work

[Versioned fixture directory](fixtures/amazon-remaining-passives/) retains all26
raw files in `raw-evidence.tar.gz`, including failed reproductions/ignored-file
lint attempt, complete browser report and exact process records. Archive members
verified byte-for-byte; all11attachments and13final source/test hashes verified.
All14task process records terminal. Build/browser staging removed, port4454closed;
remainingDisposable[]/failures[]. The historical task scratch root is removed:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-passives-l3mdixt8`.
Versioned evidence remains for full-v1 consumers.

Authoritative earned Rite resume remains L33/nextNormal402 with decompressed
SHA256 `c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action, reset, allocation, farm or Baal attempt occurred.
Remaining advertised skills, earned build viability, acquisition/balance, pacing,
economy/endgame, independent acceptance, C2–C4/G0–G7 remain open. No push/PR/merge
or deployment. Next root task: shared skill-schema compilation, then missing
Necromancer Poison Mastery/Druid Elemental Mastery (resolve elemental/DoT scope).
