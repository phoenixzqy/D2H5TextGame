# D04 — Native mercenary War Cry

Status: scoped native contract approved by independent producer plan review.
Parent checkpoint: `42f7fbc0bfe27b01222e9e487d03d495c45a3cb0`.

`docs/design/gacha-spec.md` §4.2 advertises area Stun6s/CD12. The current
mercenary JSON and executable placeholder contradict that control contract.
Resolve the exact `mskill-war-cry` row as a non-damaging, guaranteed finite
Stun on all living hostiles, including hostile summons; exclude allies/dead.
Ordinary duration6000ms; boss/chapter-boss3000ms through canonical Stun halving.
Ranks1–20 are flat, zero MP, one paid action/CD12; no Attack, accuracy,
damage, critical or on-hit status roll participates.

Preserve actual factory War Cry → Bash → Chop selection during cooldown;
ordinary basics are eligible only when no secondary is available. Attribute
later Bash damage/control separately. Player War Cry and mercenary Bash retain
their own contracts. Existing non-stacking Stun retains the active source and
later expiry; an expired record starts a new application. Applied Stun survives
source death to finite expiry while an ally keeps combat alive.

Non-damage, guaranteed control, flat scaling, explicit zero cost and boss
duration are scoped reconciliations of omitted details, not verbatim GDD quotes.
Use the existing DebuffEffect/status application path. No shared runtime, type,
persistence, acquisition, dependency or CI change is planned. Narrow exact-ID
schema closure rejects ignored damage, chance, boss-duration and scaling fields.

Validation: actual-loadout causal RED, then corrected-primary GREEN after an
independently approved order-only assertion correction (exact recipients/values
retained; predecessor and failure preserved), strict immutable resolver/schema/sibling checks, native targeting/control/cadence/payment/lifetime
and public publication/playback, then native unit/types/lint/external build.
Constructed mechanics do not establish earned acquisition, balance or pacing.
H3 remains terminal failed-no-app: no browser/application/retry, protected
retained fixture access, diagnostic or replacement gameplay experiment. Browser,
devices, locales, accessibility, campaign/pacing and full-v1 acceptance stay open.
