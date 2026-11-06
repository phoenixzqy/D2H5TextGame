# BUG-495 — Campaign audit binds a Baal retry to the first Throne proof

- Severity: Medium; test/evidence accounting.
- Status: open; recorded before correction.
- Reproduction: native1409 W1–W7 win but Baal draws, preserving the one-time
  Throne proof. Native1410 retries all eight waves, wins and Claims Eve.
- Expected: retain once-only quest proof and independently verify the winning
  retry completed its own Throne checkpoint before its Baal kill.
- Actual: the recorder omits unchanged successful retry checkpoint graphs;
  auditor pairs Baal1410 with the first proof1409 and rejects the legitimate
  native win. Save already owns title/Nightmare; all eight waves/rewards retained.
- Evidence: p15-nova-act5-throne-dexterity-continuation-v1 report/raw/exit in
  d2-counted-source-z3jj3xa1. Baal45.6seconds, hero971HP/38mana,64actions.
- Fix: retain successful native Throne checkpoint at index4 even with an
  unchanged graph; auditor rebinds only that verified later admission, preserving
  one-time proof counters and rejecting cross-admission Baal without a checkpoint.
- Validation: positive retry, missing/defeated/wrong-context checkpoint negatives,
  recorder unchanged-graph retention, and separate re-audit of the original run.
  Do not overwrite failed evidence or replay the earned game.


## 2026-10-31 — Fixed and verified

Recorder retains successful unchanged native index4 checkpoints in the Throne.
Auditor accepts only a living-hero/native next-wave witness at the Eve Claim
boundary in a later admission, with unchanged graph, prior Throne proof and
unclaimed/in-progress Eve without Baal proof. It rebinds admission without
counting another proof. Missing, defeated, wrong-area/index/ordinal witnesses
still reject. Selected changed-behavior regressions:11PASS (72other cases skipped).

Separate p15-nova-act5-baal-retry-reaudit-v3.json passes the original native win:
1411 cumulative admissions,64actions, both one-time proofs and actual title/
Nightmare. Wave1410/index4 outcome/935HP comes from the original raw journal;
the unchanged graph is reconstructed from the prepared save and verified equal
to recorded Baal.before. The original recorder did not capture this checkpoint.
No gameplay replay, altered export, reward replacement or failed-evidence rewrite.

Two initial re-audit driver failures remain retained: v1 passed a save map to the
live-map campaign observer and omitted sibling endgame; v2 compared a snapshot
made at current time to the frozen export timestamp. v3 uses savedCampaignState
and the original clock for the native round trip. Scoped types caught one
possibly-undefined currency in the new fixture; its assertion now uses the
native zero default. Final strict types pass (p15-baal-retry-final-types-v2).

Final focused9-file lint passes p15-baal-retry-final-lint-v2 (10.185s).
Its first4lint errors are corrected with typing/formatting/narrowed optional
access only; no behavioral retest or campaign replay was needed. All task-owned
verification groups are terminal and their task Vite caches are absent.
