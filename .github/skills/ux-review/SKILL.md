---
name: ux-review
description: Heuristic review of a designed or implemented screen against UX laws (Hick / Fitts / progressive disclosure / recognition-over-recall) plus accessibility, mobile, and i18n parity checks. Returns APPROVE / CONCERNS / REJECT.
---

# Skill: ux-review

## When to use
- A `ux-design` spec is being finalized.
- A screen has been implemented and is up for review.
- A flow underperforms (high drop-off in playtest).

## Phase 1 — Surface scan
Open the screen at 360×640 and 1280×800. In both zh-CN and en. Note:
- Time to first action (should be < 2s perceived).
- Any clipped text.
- Any horizontal scroll on 320 px width.

## Phase 2 — Heuristic checks
- [ ] Top-level choices ≤ 5 (Hick).
- [ ] Primary action in the lower 2/3 of the screen (Fitts).
- [ ] Touch targets ≥ 44×44 px; spacing ≥ 8 px.
- [ ] Recognition over recall (state visible, not remembered).
- [ ] Progressive disclosure (advanced detail behind tap, not always
      visible).
- [ ] Feedback within 0.5 s of every action.
- [ ] Reversible actions (undo, back, cancel always available where
      sensible).
- [ ] Empty / loading / error states all present.

## Phase 3 — Accessibility quick pass
- [ ] Keyboard-only completable.
- [ ] Focus visible.
- [ ] Live-region announces state changes.
- [ ] Color is never the only signal.
- [ ] Contrast ≥ 4.5:1 body / ≥ 3:1 UI.
- [ ] Reduced-motion respected.

(Deep audit → escalate to `accessibility-specialist`.)

## Phase 4 — Mobile-first check
- [ ] Reflows at 320 px width.
- [ ] One-handed reachable thumb zone for primary action.
- [ ] No hover-only affordances.
- [ ] Safe-area insets respected (iOS notch / Android nav bar).

## Phase 5 — i18n parity
- [ ] Both locales fit.
- [ ] No hardcoded strings.
- [ ] zh-CN length ~50–70% of en — layout breathes at both.

## Phase 6 — Verdict
```
UX-REVIEW: APPROVE | CONCERNS | REJECT
```
- **Blockers**: critical-path failures.
- **Concerns**: medium-impact issues.
- **Suggestions**: non-blocking polish.

## Owner
`ux-designer`. `accessibility-specialist` co-signs where needed.
