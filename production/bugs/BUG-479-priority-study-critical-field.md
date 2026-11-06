# BUG-479 — Read the recorded crit field in priority-study metrics

- Severity: Low / P3 (external QA reporting only).
- Status: fixed in independent raw-event metric correction.
- Environment: WSL/Node24.21.0, frozen pure-engine study; browser/viewport/locale
  not applicable. HEADb5a0898806bfba369a2d84a1b6c41d0bbb057fce.
- Reproduction: run `p15-nova-tomb-priority-study-v1`; its external TS driver
  counts damage events using `e.critical`, whereas native damage events expose
  `crit`. All726reported critical rates therefore default to zero.
- Expected: derive critical rates from actual recorded `crit` flags.
- Actual: a reporting projection uses an absent field. Engine recordings,
  winners, input/result hashes, death rates, TTK and eligibility are unaffected.
- Evidence: external study TS/JSON/raw JSONL and `src/engine/combat/combat.ts`
  native damage-event type. The study passes two exact full recording controls.
- Affected systems: external QA metric projection, root sole writer.
- Fix: independently derive the field from retained raw output, bind exact
  study/raw hashes, and retain the original report. Do not rerun or promote
  gameplay outcomes solely to correct this derived metric.
- Verification: `p15-nova-tomb-priority-metrics-correction-v1` passes2.635s;
  all726raw rows match the original report,668have nonzero native critical
  rates. The correction binds exact study/raw hashes and retains the same
  sole qualified order. Wrapper confirms no owned descendants; task Vite
  cache was already removed by the completed study launcher.
