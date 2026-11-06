# BUG-576 — Bound combined kill-wishstone income

- Status: Implemented; final economy acceptance pending.
- Severity: Medium; recruitment remains usable but progression is inflated.
- Build: feat/playable-foundations; production tree
  `142ed2ee0c5bf201f3db9717328415c542c7658ad33f9ded4054e8694567e86d`.
- Environment: Node 24.21.0 production reward engine, browser/viewport/locale
  not applicable to this numeric reproduction.
- Reproduction: read the retained 18-segment Javelin Normal chain; regenerate
  only kill rewards with recorded run seeds, wave indices, actual slain units,
  native treasure tables and hero MF/GF. The first run seed is 724621742.
- Expected: combined faucets support the published recruitment cadence,
  with numeric candidates explicitly evaluated before full cohorts.
- Actual: after the separate mini-boss correction, 50,900 wishes over 20.333
  combat hours; 16,741 direct TC + 34,159 independent secondary. Guaranteed
  secondary awards alone total 32,721. Both authored sources are intentional;
  removing only one cannot reconcile cadence and cost.
- Evidence: external packet `d2-counted-source-z3jj3xa1/`
  `p15-wishstone-source-split-v2.json` reconciles all 7,020 waves and every
  recorded shard/rune/gem total. No combat replay, inventory mutation or new
  earned campaign is claimed.
- Affected systems: engine-dev/content-designer; root is sole writer.
- Root cause: quantities were budgeted per enemy independently of actual
  encounter throughput, with no combined kill-award probability knob.
- Proposed correction: P15-wishstone-kill-rate-v1, a provisional 0.02 coin on
  combined kill wishes, isolated from the item/material RNG and non-kill grants.
- Validation: 82 distinct affected checks across eight suites pass, scoped
  strict types and explicit lint pass. Native reward-only readback covers
  7,020 waves/90,262 kills and exact non-wish rewards. The numeric candidate
  remains unaccepted at L70 Hell; no commit or full balance acceptance claimed.
