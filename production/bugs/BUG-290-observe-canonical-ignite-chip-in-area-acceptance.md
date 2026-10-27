# BUG-290 — Observe canonical Ignite chips in area acceptance

Severity: Medium (false negative blocks production acceptance;no runtime defect).
Status: fixed locally in `f97b84d1`;production rerun pending.
Build:20b07133. Linux/Playwright Chromium1280×800,en;constructed L90 Amazon,
public Catacombs entry;native seed7 mechanics separately established.
Owner:root (public browser QA);independent acceptance remains open.

1. Run production amazon-area-acceptance.config.ts with task-isolated build/output.
2. Create/import/equip normally,allocate four skills19→20/MAX,cast Fend then
   Exploding Arrow through the ordinary active-skill priority and Catacombs entry.
3. Observer waits for a chip whose title begins Burn;this times out atline333.

Expected: recognize the actual localized canonical Ignite/点燃 chip and still
require selected-skill typed positive Fire hit and positive hostile DoT.
Actual: event log shows multiple [Burn] applications,but active stored status is
ignite. Trace0-trace.trace records exact title Ignite. combat.json names ignite
Ignite/点燃 while burn is Burn/燃烧. CombatScreen uses status.id for chip labels.
The initial public test incorrectly used the event alias for the stored chip.

Evidence:area-public-attempt1.json/log,public-attempt1-report.json,trace.zip and
error-context.md in /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-area-8f7ngk0q;
fire-chip-trace-diagnosis.json retains exact trace member/context. Terminal
1failed/3notrun38.283s,2451inputs/HEAD exact. No passing browser result claimed.

Repair only the exact expected chip titles;retain cast/hit/status/DoT/save/offline
and geometry assertions. Do not change runtime,status vocabulary or thresholds
for this observer error. Wait for original engine/types/lint consumers to end,
then file this bug before correction and run focused strict public checks and
fresh four-context production acceptance. Preserve initial report/trace/source.
Security check:pass;first-party local test-only correction,no secrets,remote or
campaign/replay. Root owns exact retention/read-back/cleanup;full privatev1 open.


Original consumers are terminal:engine9661/365,full types/lint/build/bridge/
precache all pass. Only exact Burn→Ignite and 燃烧→点燃 expected chip literals
changed;2450 other inputs/all762 build files exact. Final focused public types/
lint pass. Fresh browser/full run pending;no runtime or assertion weakening.
