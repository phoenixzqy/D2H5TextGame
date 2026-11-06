# BUG-480 — Preserve Tomb party survival through the third wave

- Severity: Medium / P2 (maintained native campaign frontier).
- Status: resolved locally for Tomb W3 survival by earned native sockets; whole-chapter boss acceptance remains open (BUG481).
- Environment: WSL/Node24.21.0, private fresh native campaign. Browser/viewport/
  locale do not apply to this engine measurement. HEADb5a0898806bfba369a2d84a1b6c41d0bbb057fce;
  exact dirty source and campaign manifests are retained in the report.
- Reproduction:
  1. Run fresh Nova Act II with explicit prepared execution, established Act I
     recovery and normal salvage; no imported save or supplied seed.
  2. Retain all original failures/training and enter Tomb ordinal370,
     runSeed4016518477 at earned26, with owned Static→Blizzard→IceBlast.
  3. W1wins14.760s (831HP); W2wins38.159s (328HP). W3starts with hero328/833HP
     and no surviving Prayer body in the carried party.
- Expected: a bounded, earned preparation policy clears the six-wave challenge
  while retaining actual carry, costs and all failed attempts.
- Actual: W3defeat at9s with hero0HP/490mana. Recorded direct damage to the
  hero is fire14/lightning215/arcane9/cold86; flat Magic Resist is0.
  The subsequent cleared-Arcane farm371wins five waves, then draws at its boss
  with hero669HP/15mana and reaches the third training-nonwin bound. No retry,
  Duriel/SevenTombs Claim or Act III unlock is accepted.
- Evidence: `p15-maintained-nova-act2-tomb-aoe-v1` native report/journal;
  `p15-nova-tomb-native-proof-v1.json` verifies all1600prior waves exactly and
  unchanged engine/data. Exact failure inputs are retained as
  `p15-nova-tomb-survival-inputs-v1.json`, SHA256
  11fc6e45e52f7a79f6f6fe6d23a377b75e89b1eae646bb079a5a7b49b8f74595.
- Affected systems: native campaign preparation and QA, root sole writer.
- Confirmed limitation: Prayer is present in the initial Tomb party but absent
  from the W3carry. This is intra-challenge survival, not proof of a missing
  persistent mercenary revival API. The exact carried hero also survives the
  recovery boss but cannot finish it within60s.
- Next step: extract W2alongside the existing W3/recovery-boss inputs, reproduce
  complete recordings and screen owned priorities before selecting a native
  caster/merc gear or socket preparation. Preserve64/purpose,256total training,
  three training nonwins, six recovery cycles and level28limits. No carry
  refill, grants, altered enemies/XP, skipped losses or imported fresh-run save.

- Local resolution (uncommitted HEAD b5a0898): `tests/campaign/socket-preparation.ts`
  inserts owned Diamonds into initially empty hero/Prayer non-shield sockets and
  owned Topazes into Prayer's shield through native transfers and material actions.
  The once-only controller boundary preserves the24 insertion limit and all
  existing training/retry/carry constraints. Seven native socket tests, nine
  independent conservation tests and the once-only/retry regression pass;
  integrated59 checks, strict types and explicit no-ignore lint pass.
- Fresh verification: `p15-maintained-nova-act2-party-sockets-v1` finishes
  technically in246.156s.13 inserts/no refusals; the exact1600 prior waves,
  engine/data, native export and all campaign audits are verified independently
  by `p15-nova-socket-native-proof-v2.json`. Tomb W1–W5 all win; W3 ends833HP,
  rather than the prior9s defeat. Duriel W6 now draws at60s with413HP left,
  hero807HP/256mana; no SevenTombs Claim or ActIII credit. Arcane recovery371
  retains its boss draw and reaches the third training-nonwin bound. This fixes
  the original survival frontier and exposes BUG481's boss throughput frontier.
- Evidence correction: proof driver v1 incorrectly required the entire primary
  source hash to remain equal despite the intended campaign-workspace discovery
  change. Its failed script/log/receipt remain preserved. Proof v2 instead
  verifies the exact allowed workspace change, all unchanged engine/data files,
  the intended seven campaign-file changes and the full unchanged prefix.
