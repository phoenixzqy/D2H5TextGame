# BUG-528 — Distinguish preparation time from total new combat time

Severity: Low; external evidence aggregate only.
Status: Reproduced and fixed in totals-v2; v1 retained.
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained dirty implementation.
Environment: Python3/WSL; browser/viewport/locale/combat seed not applicable to readback-only summation.

1. Sum the five independent reader count dictionaries in Paladin totals-v1.
2. Only the preparation reader exports logicalMs, so the aggregated logicalMs covers preparation rather than all new combat.

Expected: Label preparation, route and complete new combat time explicitly.
Actual: totals-v1 includes a logicalMs field within totals without declaring its narrower preparation scope.
Root cause: Summing heterogeneous reader metric dictionaries treats a missing time key as zero.
Resolution: totals-v2 sums each native wave left-to-right, separates the three time scopes and keeps v1 unchanged. No source behavior or campaign replay.
Owner: root (evidence tooling).
Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-paladin-act1-totals-v1.json and p15-paladin-act1-totals-v2.json.
