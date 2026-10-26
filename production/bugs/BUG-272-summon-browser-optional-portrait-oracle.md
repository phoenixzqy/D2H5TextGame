# BUG-272 — Read summon identity from its displayed card name

- Severity: Low; author browser observer, no observed missing summon or damage.
- Status: Corrected externally: four Revive contexts pass using actual displayed card names.
- Owner: root QA tooling; independent acceptance open.
- Environment: production Chromium en360×640; synthetic L60 Necromancer, Revive1/20 and native legal prerequisites. Protected campaign untouched.

## Reproduction

1. Run basic-summons-browser-active-tab.cjs after ordinary learned-slot selection.
2. Skeleton/Clay complete all eight locale/viewport cases.
3. Revive rank1 creates a body and repeatedly deals16Physical damage in the visible log, but the predicate times out30s.

Expected: identify a summon by its actual displayed name, independently of optional artwork.
Actual:65diagnostic frames have body names[''] or[], because the observer queries img.alt. The Revive card uses the intended text fallback when no portrait resolves. The exact native combo/learned allocation is present; this is not the earlier empty-combo failure.

## Root cause and correction boundary

CombatScreen renders the localized full displayName as the compact card title, with optional image or first-two-character fallback. Read that existing title instead of optional img.alt. Preserve exact body counts, exact localized names, positive outgoing damage, learned allocation, no-console-error, save/offline and30s timeout assertions. Run only the four failed/unexecuted Revive contexts in a fresh output path; preserve the eight completed Skeleton/Clay cases from the original run. Do not add art or alter engine/UI merely to satisfy this observer.

Original driver,191.736s/exit1 receipt, failure DOM/PNG and65frame timeline are retained under the active bone task. Terminal log SHA256 babb9d0717a5f3fcb31fc5bb59a1b66dccf3fde559c0e536dd7522d5db3b2fd7. A partially successful command is not a12/12passing run.

## Final local validation

Native21cases/related186in3files pass35.734s; full types120.220s and focused typed lint8.784s pass. Eight completed Skeleton/Clay contexts from the original failed aggregate command plus separate Revive4/4PASS80.285s establish12completed locale/viewport cases. No12/12successful single command is claimed. All original failed sources/logs remain retained. See docs/plans/evidence/d06-basic-necromancer-summons.md and its checkpoint packet. No production runtime change, independent sign-off or earned-build balance acceptance.
