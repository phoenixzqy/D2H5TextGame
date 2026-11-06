# BUG-485 — Salvage eligible normals even when protected overflow cannot fit

- Severity: Medium; campaign bookkeeping performance/resource sink.
- Status: fixed locally.
- Environment: WSL/Node24.21.0; current human2 source. Native action helper;
  browser, viewport, locale and combat seed are not involved in this guard.
- Reproduction: retain protected rares beyond backpack capacity and a full
  stash, plus ordinary unequipped/unsocketed/unreserved backpack items; call
  recoverCampaignCapacity. Actual earned Act V stop has13904 bag items,
  11237 ordinary items and493 stash items.
- Expected: execute the valid ordinary-item salvage sink, retaining its actual
  material delta, then report protected-capacity-blocked if protected gear still
  cannot fit. Never consume equipped/socketed/reserved/non-normal/stash items.
- Actual: the transfer-capacity guard returns before normal salvage. Normals
  accumulate and are recopied by every native wave, needlessly slowing training.
- Evidence: p15-nova-act5-checkpoint-continuation-v1 native inventory/export and
  tests/campaign/capacity.ts transfer guard before ids salvage; original normal
  salvage/protected-only preservation tests in actions.regression.test.ts.
- Root cause: checking protected transfer capacity gates an independent legal
  normal-item sink. Move that check after the sink, retaining blocked status and
  no protected transfers when capacity is still insufficient.

- Verification: Fixed locally; four focused checks pass, and actual11297 salvage/33891scrap preserves all protected/stash/equipped payloads.
