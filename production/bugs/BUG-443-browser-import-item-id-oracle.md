# BUG-443 — Predict post-import item allocation in browser evidence

Status: browser oracle corrected and verified locally; no gameplay edit.
Severity: Low (incorrect cross-import sequence equality expectation).
Build: b5a0898 plus BUG440; WSL/Chromium, zh-CN360×640 and planned en1280×800.
Affected systems: earned browser evidence and item conservation oracle; root writer.

1. Import actual Prayer-v1 pre-Rocky attempt2/L15/ordinal131 through public UI.
2. Clear all four waves and return/export. Victory and exact earned XP pass.
3. Original browser-v1 compares new absolute IDs with uninterrupted native IDs.

Expected: all imported item IDs/payloads stay exact; post-import allocations
follow the existing hydration high-water contract and have exact new IDs and
intrinsic payloads. Actual: all37new item payloads/RNG prefixes match, while
suffixes differ by the legitimate counter restart after normal-item discards.
Native first seq3992, imported surviving highwater3878; native new37seqs are
contiguous. Hydration seeds only persisted owned/quarantine IDs, not discarded
history (`persistence.ts`, `rollItem.ts`). Existing items match exactly.

Evidence: `p15-prayer-rocky-victory-public-browser-v1*`; original31.496s failure
and export retained. No product bug inferred. Correct new-item IDs by predicting
highwater+1..+37 from the unchanged public checkpoint; retain exact whole item
comparison, all random prefixes/payloads and imported IDs, no ID-only stripping.
Original earned-run sink/ownership conservation remains exact in its own history.

Verification: v2 PASS2contexts/34.083s, zh-CN360×640/en1280×800. All four native
waves win; imported identities remain exact and all37new IDs are predicted
as3879..3915 with exact intrinsic payloads.297terminal owned items, L15/XP8709/
ordinal132, exact quest/currencies/material/export/reload. No errors, overflow,
bridge or power injection. Both final victory screenshots visually inspected.
