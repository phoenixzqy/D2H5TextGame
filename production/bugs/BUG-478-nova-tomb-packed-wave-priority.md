# BUG-478 — Keep an area attack available in the packed Tomb waves

- Severity: Medium / P2 (maintained preparation policy; ordinary skill ordering is available).
- Status: priority fix verified on native W1/W2; overall Tomb remains open as BUG480.
- Environment: WSL, Node24.21.0, private native campaign; browser/viewport/locale
  do not apply to this pure engine measurement. HEADb5a0898806bfba369a2d84a1b6c41d0bbb057fce,
  dirty source manifest retained with the report.
- Reproduction:
  1. Run fresh Act II Nova with `nova-act2-prepared-v1`, explicit
     `act1-training-v1` recovery and normal salvage.
  2. Earn24/Blizzard through declared cold training; clear Lost City at25 and
     Arcane at26. Enter Tomb at ordinal370/runSeed4016518477.
  3. The controller installs owned Static1→IceBlast1 for the entire six-wave
     Tomb challenge, including the packed first wave.
- Expected: retain an owned area attack for packed waves while preserving a
  suitable owned Duriel order; use native preference changes and recording.
- Actual: W1draws at60000ms with hero412HP/509mana and ten mummies still alive
  at84–107HP. Recovery's Arcane farm371 also draws at its boss and honestly
  reaches the third training-nonwin limit; no Tomb retry or Act II clear.
- Evidence: `p15-maintained-nova-act2-cold-earned-v1` report/journal and exact
  extracted `p15-nova-tomb-packed-input-v1.json` in the retained umbrella packet.
  InputSHA2563ea4ac7e84a05b8ecd7e34391dc121a4458d768e6f82cfb3ba8e4154b13f85aa.
  Native source/campaign/export/economy/quest/preparation/recovery audits pass.
- Affected systems: campaign preparation policy/QA; root is the sole writer.
- Suspected cause: the boss-focused single-target order suppresses owned
  Blizzard20/Nova8 in waves containing multiple resurrection-capable enemies.
- Next step: replay exact actual Tomb W1 and historical Duriel control with
  owned orders and unchanged32seed/26win criterion. Retain every rejected arm;
  no gameplay formula/enemy/XP change or imported native campaign save.
- Study: `p15-nova-tomb-priority-study-v1` passes two exact complete controls
  and726trials in31.820s. Only Static→Blizzard→IceBlast wins both original
  inputs and32/32combat seeds for each. Packed actual14.760s; historical
  Duriel27.284s. Historical boss gear stays its original gear; this does not
  prove the fresh future Duriel outcome. All rejected orders remain retained.
- Fix plan: add paid Blizzard to the existing whole-Tomb Static/IceBlast order.
  Reuse the native combo setter and restoration; no wave-stage callbacks,
  carry writes, changed bounds or gameplay tuning. Update controller regression,
  scoped types/lint, then run another fresh normal-salvage campaign.
- Plan review: ready; one owned-order addition addresses the suppressed area
  attack and passes the existing criterion on both actual frozen inputs.
- Metric correction: the study's critical-rate projection is handled separately
  as BUG479; winner/TTK/eligibility evidence is unchanged.
- Regression: missing-Blizzard order check fails before the one-line addition;
  `p15-nova-tomb-order-green-v1` then passes all20controller checks. Scoped
  strict types and explicit no-ignore lint pass. Next fresh native measurement:
  `p15-maintained-nova-act2-tomb-aoe-v1`, with the same normal salvage/recovery.
- Native result: tomb-aoe-v1 technically passes309.916s with all audits and
  stable manifests. Exact1600earlier waves and engine/data remain unchanged;
  only the controller/order assertion campaign files differ. Tomb W1wins
  14.760s, W2wins38.159s; W3defeat and recovery-boss draw remain retained.
  Totals372admissions,1609waves/1599wins/10losses,2454400XP/15479items.
  This verifies the first-wave priority correction, not full Tomb acceptance.
