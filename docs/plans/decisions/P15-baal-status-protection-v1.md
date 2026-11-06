# P15 — Baal status protection v1

Date:2026-11-05. Bounded implementation default for BUG757; root, solo.

The detailed Baal rule in monster-spec§8 explicitly grants immunity to every
status except Stun (50% duration). It takes precedence over that document’s
contradictory§10 "All status75% (reduced)" summary; the summary is reconciled.
This is complete rejection, not a random avoidance chance or quarter duration.

Author `statusImmunities:["all-except-stun"]` on Baal only. This closed policy
extends the existing enum, preserving factory-owned copied/frozen wave-local
metadata. Shared canonical eligibility rejects current/legacy/future IDs except
Stun before application side effects or application RNG. Existing timed boss
Stun scaling remains50%, positive durations floor at1ms; legacy whole-turn
rounding remains unchanged. No persisted field or save migration is needed.

Ambient Holy Freeze must respect eligibility in both derived status/combo view
and action cadence. Slow Missiles must reject before creating a private flight
binding or displayed status. Rejected Mana Burn must not debit Mana; rejected
Frozen Armor Chill must not log success. Ordinary tentacles/other monsters retain
their authored rules. Direct hit damage and elemental resistance are independent.

Validation uses native manual/idle chapter construction plus targeted synthetic
combat diagnostics and playback. It grants no earned-campaign, pacing, balance,
independent review or owner acceptance; no exhausted run budget is renewed.
