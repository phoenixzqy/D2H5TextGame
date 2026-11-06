# BUG-423 — Shared lightning assertion predates authored Paralyze

Status: fixed locally; test oracle only. Severity: medium (QA).
Environment: HEADb5a0898 + private-v1 work, Node24.21.0.
Reproduce: run src/engine/combat/act1-lightning.test.ts after BUG422.
Expected: dedicated Act I affix and shared monster Lightning stay distinct;
shared Lightning preserves40–60/CD2/single/spell and gains finite Paralyze per
P15-monster-heal-lightning-v1. Repeat load preserves all remaining stubs.
Actual: one assertion still requires shared Lightning applyStatus undefined.
Evidence: p15-monster-heal-lightning-consumers-v1 log. Existing other30cases
cover the dedicated affix; do not revert the new functional shared status.
Fix: change this literal payload oracle only; rerun the complete file.

Resolution: Updated literal shared Lightning oracle; complete31case file passes.
Full results and limits: docs/plans/evidence/p15-monster-heal-lightning.md.
