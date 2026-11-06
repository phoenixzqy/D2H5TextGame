# P15 — Monster Charge Attack component

Type: small behavioral tweak,adopted by root under existing full-v1 authorization
on2026-11-04. New design delta,not recovered numeric approval; supersedes only
Charge's fixed-only damage in earlier monster signature/family decisions.

[Corrected Duriel evidence](../evidence/p15-duriel-corrected-paired-screen.md)
shows Charge60–90weaker than ordinary Attack220. The design calls Charge high
single-target burst. Shared Charge shall add100%current snapshot Attack to its
sampled60–90physical base,using existing `attackDamagePct` resolution before
ordinary multipliers,crit,resistance,defense,shields/minimum1. No defense bypass.

JSON `monster-charge.attackDamagePct` is required,finite/nonnegative,default100;
curve knob,not a duplicated engine constant. Zero explicitly disables it for
tuning. Keep rank1/CD4s/mana0/melee/single-target/no status or native combo tags.
All Charge users,ActsI–V/difficulty variants,use their actual projected Attack.
Early Charge damage intentionally increases too; earned balance remains open.
No saved-data change/migration,RNG draw or cadence change.

Acceptance: closed schema permits the component for Charge only among the five
physical skills; rejects missing/negative/nonfinite/malformed values. Adapter
copies/freezes JSON tuning. Literal regressions prove220Attack adds220before
normal mitigation,physical dodge,cooldown filler and input immutability. Native
chapter/early ActI probes plus affected tests,scoped types/lint and desktop/mobile
Chromium verify integration. Other four skills keep fixed damage/status/delivery.
Constructed probes do not accept first-clear win rates,acquisition or pacing.
Do not replay spent screens or completed campaigns. Next qualify representative
first-clear acquisition/pressure rather than escalating values against heavy gear.

Plan review: ready; covers native adapter,both schema allowlists,old test oracles,
early users,mitigation/browser integration. Root-cause review: upstream authored
Attack component,reusing shared math;no per-boss engine branch or invented gear.
Security check: pass;local numeric data/schema/adapter/tests only,no secrets,
dependencies,network,CI,permissions or external commands.
