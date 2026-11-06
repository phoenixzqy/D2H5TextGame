# BUG-466 — Offer settled loot before automated capacity recovery

Status: fixed locally and fresh bounded-policy validation passed; no commit. Severity: High (campaign harness).

Environment: HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus local changes,
Node24.21.0/Vitest1.6.1/WSL. Browser/viewport/locale do not apply to native
campaign orchestration. Fresh cases use native clock1793304000000 without
supplied save, seed, equipment or points.

## Reproduction

1. On frozen current source run Nova/training/recovery with default salvage.
2. Compare the same source and initial state with explicit retention policy.
3. Isolate a safe equipment boundary with native first-wave rewards and
   explicitly constructed initial caps just below capacity; equip one before
   the next admission salvages leftovers.

Expected: native loot remains available for the caller's build/equip boundary;
before starting another admission, housekeeping may remove eligible leftovers.
Native equip/capacity gates, sink accounting and default policy remain exact.

Actual: `enter()` calls capacity recovery immediately after native victory/flee,
before the caller grows/equips. It can salvage or stash newly earned upgrades
before the picker sees them. The current-source inventory-policy comparison
isolates a concrete consequence: default salvage retains four losses and stops
in Dark Wood at L14; retention wins Act I at L13 with both merc rings and a
better shield. The policy comparison alone does not prove ordering is the only
lost-gear mechanism; the bounded fix needs another fresh native measurement.

Evidence: packet `p15-gear-retention-comparison-v1.json`, two fresh case reports,
compressed journals and completed exit receipts in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Both source/campaign manifests match across cases; independent native reward,
save, quest and recovery audits pass. No processes remain from that comparison.

Affected system: campaign QA, root sole writer. Move housekeeping to admission
start, allowing existing caller preparation between admissions. Add a failing
native boundary regression before editing; retain complete sink and save checks.
Do not loosen capacity or grant power. Preserve diagnostic retention for future
comparison; no installed tools, agents, commits or publication.

Native boundary reproduction1FAIL/3PASS sees zero of97 caps at the caller
boundary. Removing only the post-victory/flee housekeeping calls gives4PASS;
next-admission native salvage removes every eligible leftover while the actual
equipped cap remains, with independent economy/export proof. Integrated50PASS
38.808s, scoped strict types15.162s and explicit-file lint14.989s. Logs/receipts:
`p15-gear-preparation-order-*` in the retained packet. The retention comparison
is a single native stream and cannot certify all builds or inventory UX.

Fresh `p15-gear-preparation-order-act1-v1` wins native Act I atL13 after117
admissions,346 waves/344 victories/two retained losses and222120XP. Its exact
observed waves and totals equal the retention diagnostic. Unlike retention it
reconciles3059 actual salvage removals, preserves both native quest Claims and
Act II unlock, and passes export/source/campaign/economy/quest/recovery audits.
Wrapper52.660s exit0 confirms no owned descendants. Independent summary:
`p15-gear-preparation-order-act1-proof-v1.json`. This proves the correction on
this current Nova stream; full economy/UX/build/late-act gates remain required.
