# P15 — Fractional periodic spell phase correction

2026-11-01. BUG540. Root sole writer; local engine fix within existing v1 scope.

Use the authored absolute phase (start + integer * interval) for both due-pulse
recognition and next-pulse selection. Compare the reconstructed timestamp rather
than an exact zero remainder after subtraction. If a quotient-floor estimate lands
at or before now, advance one authored interval. No epsilon, artificial clock
nudge, loop-success guard, extra pulse, backdated pulse or damage/timing tuning.
Keep paid source/rank/expiry authentication, exclusive expiry and prior-wave endpoint.

Add a direct fractional-phase regression before implementation, preserve RED,
then fix the shared phase helper and its combat consumer. Verify all four spells,
one instant just before/after the pulse, expiry, and current/next future timestamps.
Re-run the retained full level25 Arcane input using an uninstrumented launcher;
retain all failed receipts and discard diagnostic state/income. Run affected
periodic/Inferno engine, store and UI checks plus scoped strict types/lint only.
Bind source transitions explicitly; unchanged Fire Ball checks remain reusable.

Security check: pass; first-party local pure engine/tests, no credentials,
permissions, dependencies, networking, data export or publication change.
Plan review: correct source-level arithmetic fix; both scheduler and settlement
must share the phase rule, otherwise skipping the hang would silently lose pulses.
