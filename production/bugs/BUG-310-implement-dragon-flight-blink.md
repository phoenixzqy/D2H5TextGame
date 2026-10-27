# BUG-310 — Implement Dragon Flight's missing movement adaptation

Status: Open — native reproduction retained before source changes.
Severity: High — advertised teleport behavior is absent; the physical kick works.
Build: 19e5d0965cb95ca016538299311efc316bb431c3; later documentation-only commits do not alter this source.
Environment: Vitest native store/engine in jsdom, no browser/viewport acceptance.
Locale: no locale dependency; en/zh-CN descriptions both promise teleport and kick.
Engine seed:7.

## Reproduction

1. Project a native level30 Assassin with legally learned Dragon Talon/Claw/Tail
   prerequisites, selected Flight, and Flight rank1,2 or20.
2. Give the constructed unit15MP, no regeneration, a living held enemy and a
   synthetic control beginning immediately after its first action.
3. Run the actual recorded battle. At1700ms Flight pays15MP and attempts one
   positive Physical kick. Observe its status-state events.

Expected: the teleport promise has a real no-movement adaptation with a finite
paid evasion window, plus the existing kick/charge-finisher settlement. The
provisional [Flight contract](../../docs/plans/decisions/D06-assassin-flight-v1.md)
uses the established Sorceress Teleport convention:1s magical dodge,+1percentage
point/effective paid rank. This is authored functional tuning, not earned balance
or independent design approval.
Actual: no blink state appears at any of the three ranks. Ordinary scalar kick,
single payment and positive Physical damage control pass. Source contains no
Flight-specific movement adaptation; it is only a listed martial finisher.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-assassin-flight-z9y3pvvj
contains flight-native.test.ts, flight-native-red.json/.log, exact repository and
external input hash maps, and immutable draft contract. Native3RED/one control,
9.241s;2539repository/four external inputs/HEAD exact. Preserve these original
failures; a missing observation alone does not establish causal evasion proof.

Affected systems: game-designer/engine-dev/frontend-dev/qa-engineer; root sole
executor. Root cause: source/runtime defines only Flight's Physical attack and
finisher identity while both descriptions retain an unimplemented movement
promise. No workaround implements the promised mechanic. Keep existing damage,
payment/CD, native/shadow authority, RNG, charge and death settlement; implement
and verify actual hit behavior, private paid state, exact expiry, lifecycle and
truthful bilingual UI according to the contract before skill credit.

Security check: pass for authorized deterministic local data/engine/UI/tests.
No dependencies, external destinations, credentials, permissions, CI, save schema
or genuine campaign changes. Independent design/QA and earned balance remain open.
