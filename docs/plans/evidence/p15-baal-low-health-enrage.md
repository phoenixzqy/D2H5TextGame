# P15 — Baal low-health enrage, local verification

2026-11-05; root, solo. BUG755. Build b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus inherited local changes; not committed or independently accepted.

Ordinary/chapter Baal activates sticky enrage at20%Life: +150% attack speed
(2.5x) and +100% direct damage. Native manual/idle chapter base57600Life,
520Attack/560Defense/AS150 and rewards/waves are preserved. EffectiveAS375 reaches
the existing400ms floor; first actions400/800/1200/1600ms, versus above-threshold
1300/2600/3900/5200ms. Exact noninteger-Life boundary is fixed by comparing Life
with maximum Life times the fraction instead of dividing. No epsilon or retuning.

Six new native cases plus two selected shared Diablo policy/scheduler cases pass.
Coverage includes exact/above/dead/trash boundaries, frozen independent metadata,
same-seed landed damage/miss parity, activation during periodic damage with pending
action progress, sticky healing, input immutability and deterministic recorded/
plain parity. Native bilingual converter feedback passes. Shared log UI unchanged;
no new browser run justified. Scoped strict types600files/zero diagnostics,
changed-file lint and strict monster schema/source comparison pass.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-baal-enrage-992txn01`.
Retains RED, intermediate failure, final logs, baselines, diff/source review/hashes
and cleanup. Initial post-data failure exposed actual threshold rounding and an
incorrect guaranteed-hit test assumption; production hit mechanics stay unchanged.
Root retains this exact directory through full-v1 acceptance, then removes it. No
server/cache/build or task process remains. No spent run allowance renewed. This
is diagnostic evidence, not earned progression/balance acceptance.

Historical14/14Normal completions,210checkpoint sources/formal0/210 unchanged.
Tentacles/status rules, Duriel/progression/economy/pacing/build/difficulty and
integrated/independent/owner acceptance remain; full privatev1 stays unfinished.
