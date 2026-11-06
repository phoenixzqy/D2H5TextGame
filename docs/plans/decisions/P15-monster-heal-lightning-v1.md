# P15 — Monster self Heal and three lightning Paralyze actions

Adopted2026-10-30 by root under complete private-v1 authorization after read-only
design advice. Routine bounded adaptation using existing heal/status consumers;
numerical balance remains provisional and unaccepted. No user decision needed.

Monster Heal is active/self/CD4/MP0/rank1: floor(maxHP×.30), capped to missing
HP on a living self. No ally healing, flat roll, RNG draw, resurrection, mana
restoration or ordinary attack during its chosen action. Existing pure-heal
eligibility skips full/dead targets without payment/CD; natural later priority
may remain covered by earlier attacks. Replace the old JSON flat30 with
heal{pctOfMaxLife:.30,target:self}; remove heal_self marker source.
The monster locale/spec says30%; D04-minor-heal-v1 supplies the shared healing
floor/clamp/eligibility convention, not a new random heal implementation.

| Skill | Preserved direct Lightning range | CD | Target | Flight |
| --- | ---: | ---: | --- | ---: |
| monster-lightning-bolt |50–70|2|single-enemy|500ms|
| monster-thunder-storm |30–50|3|all-enemies|none|
| monster-lightning |40–60|2|single-enemy|none|

All active/MP0/minLevel1/maxLevel1. Each landed hit applies Paralyze1000ms,
chance1, one stack; existing5000ms residual gives50% rejection on repeat.
Use the shared half-open lifecycle and action/channel lock; no additional slow
or immunity. D04-sorceress-direct-lightning-v1§Paralyze is the precedent.
Do not add absent native combo tags or change dodge/mitigation/delivery. JSON's
Storm40–60/CD4 and Lightning40–65/all/CD3 normalize to the installed values
above; direct numbers do not change in combat. Remove exactly3old native
damage definitions and one Heal marker, register copied immutable JSON-backed
skills. No generic buff/stat rewrite or new status authority.

Validation: genuine native RED, alias/schema/source-isolation checks, injured/
full/dead/clamp/CD/ManaBurn healing, seeded repeat Paralyze acceptance/rejection,
expiry/action-delay/typed-dodge and preserved projectile/target/damage. Natural
monster bars and chapter control sources remain exact; explicitly exposed
Heal proves only its payload, not natural reachability. Shared consumers plus
scoped regressions/types/lint. Existing combat diagnostic conventions suffice;
capture one bounded before/after cohort before mutation, without outcome-based
reruns. Paralyze legitimately consumes additional RNG, so only unaffected
controls require full recording equality. No earned/pacing/reward signoff.

Root plan/root-cause/security review: sufficient existing HealEffect and
OnHitStatus primitives; fix authored payloads instead of adding alternate
healing/paralyze logic. Local JSON/pure engine only, no credentials/network/
permissions/installs/publication; original checkout read-only, existing claimed
worktree and retained packet. CI excluded, browser launch resolved.


Frozen diagnostic recipe (before production mutation):192fights/arm, five realL20
subjects ×native/probe ×16seeds0–15, plus Tainted/DarkArcher ×16. Cantor/HorrorMage
trash; DarkElder/Beetleburst/Mephisto boss tier. Synthetic2000HP/80Attack hero,
AS100,zero defense/resists/dodge/crit/no skills. Native bars remain exact. Probes
expose Heal/Bolt/Storm/Lightning only; healer probes start at floor10%maxHP.
Native60s/1000actions. Input immutability,seed0replay/plain and A/B/A required.
Use logged direct/periodic/heal/Paralyze/hero-action metrics, W/L/draw, victory
TTK p50/p95. Controls require complete equality; altered lightning may consume
more RNG. No rewards/drop/campaign/pacing or natural Heal reachability inference.
No outcome-based repeats/tuning. Packet prefix:p15-monster-heal-lightning-v1.

Baseline preflight correction: Cantor is Act2, not Act3. Driver-v1 stopped at
its first missing-definition lookup, before any fight/output. Exact failed log
and receipt retained; driver/launcher-v2 correct only that ID/act and artifact
version/cache names. Same predeclared cohort and no outcome-based selection.
