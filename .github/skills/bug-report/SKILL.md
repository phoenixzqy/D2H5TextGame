---
name: bug-report
description: Captures a bug as a structured report under `production/bugs/<id>.md` with reproduction steps, expected vs actual, environment, severity, and a fixed-seed repro when applicable. Use whenever an issue is found during QA, playtest, or post-merge — never patch first and document later.
---

# Skill: bug-report

## When to use
- A test fails unexpectedly.
- A user / playtester reports an issue.
- A regression is detected by `smoke-check`.

## Required fields (block intake if missing)
1. **ID**: next free `BUG-NNN`.
2. **Title**: short, imperative ("Combat log scrolls past last line on mobile").
3. **Severity**: Critical / High / Medium / Low.
   - Critical: data loss, crash, blocks gameplay loop.
   - High: blocks a feature path with no workaround.
   - Medium: workaround exists; visual / minor functional.
   - Low: cosmetic / polish.
4. **Reproduction**:
   - Build / commit SHA.
   - Browser + viewport (e.g. Chrome 124 @ 360×640 mobile emulation).
   - Locale (zh-CN / en).
   - **Seed** if engine-related (`engine/rng.ts` seed value).
   - Numbered steps.
5. **Expected**: what should happen.
6. **Actual**: what does happen.
7. **Evidence**: screenshot / video / console log / Playwright trace
   path.
8. **Affected systems**: which agent owns the area
   (engine-dev / frontend-dev / content-designer / etc.).
9. **Suspected root cause** (optional).
10. **Workaround** (optional).

## Phase 1 — Reproduce
Before filing, reproduce at least once. If you can't reproduce, file
as `Severity: Low` with a `Cannot-reproduce` tag.

## Phase 2 — Reduce
Trim the steps to the minimal path. If engine, capture the seed.

## Phase 3 — File
Create `production/bugs/BUG-NNN-<slug>.md` with the fields above.

## Phase 4 — Triage hand-off
Assign to the owning agent via the `agent` tool with:
- The bug file path.
- A failing reproduction test (Vitest or Playwright) where feasible —
  this is the **Prove-It Pattern** from `test-driven-development`.

## Phase 5 — Close
When fixed:
- Add commit SHA + the regression test path to the bug file.
- Set status `Fixed in <SHA>`.
- Do NOT delete the bug file — it's audit trail.

## Owner
`qa-engineer` files; `producer` triages priority.
