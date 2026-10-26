# BUG-282 — Implement the max-Poison Plague Epidemic

- Severity: Medium — the advertised max-stack combo uses ordinary half spread.
- Status: Reproduced; implementation pending. No skill or acceptance credit.
- Owner: root, engine/design/QA; no delegation or independent approval.
- Baseline: BUG281 payload/helper correction `d18e689c`; exact source hashes
  are retained with the continuing task below. Linux, Node/Vitest, seed7.
- Browser/viewport/locale: not applicable to this synthetic engine reproduction.

## Reproduction

1. Prepare one held enemy with1HP and ten Poison stacks at8HP/s. Its Poison
   begins at1700ms, so no earlier periodic death can precede the actual hit.
2. At1700ms, allow one paid rank1 Plague Javelin cast. Keep a second living,
   held10000HP enemy outside the authored line-3 area.
3. Inspect the real death spread and final neighbor HP. Repeat with nine
   pre-cast Poison stacks; the paid hit itself then raises that target to ten.

Expected from `docs/design/combo-matrix.md`4.3: casting a Plague skill on an
already max-poisoned target makes its death spread100% instead of50%, once per
combat per cast. The max-stack neighbor should receive ten stacks and lose
400HP over5s, finishing9600. The nine-stack control retains ordinary50% spread:
five stacks,200HP lost,finishing9800. Captured potency is not mitigated twice.

Actual: both cases receive five stacks at1700ms,8HP/s per stack, expiry6700ms,
and finish9800. Inputs are unchanged. The first complete diagnostic run has
one failure/eleven passes, including all ten passing BUG281 controls. A narrowed
observation run has one failure/one pass/ten intentionally filtered cases; these
are diagnostic filtering, not skipped repository tests.

## Evidence and correction requirements

Root retains `epidemic-original-red.test.ts`, `epidemic-red.test.ts`,
`epidemic-red.log/json` and `epidemic-observe.log/json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s`.
Root owns retention and exact cleanup after the continuing consumers finish.
This evidence is unearned and does not establish native class/build viability.

The engine currently supplies the same0.5 fraction for every Poison/Plague
death. Capture eligibility from Poison before the paid hit, preserve ordinary
spread otherwise, and enforce the once-per-cast limit across multiple targets
and later deaths. Use authored tuning, transient battle-only authority and the
existing frozen-source/death-order/status-expiry integration. Cover expiry,
miss/refusal, multi-target cast identity, deterministic replay and immutability.
Do not grant Epidemic merely because a normal hit raises nine stacks to ten.

Workaround: ordinary Poison/Plague death spread still functions. Security check:
pass for first-party local engine/data/test work; no credentials, dependencies,
network, permissions, CI or persistent save fields are requested.
