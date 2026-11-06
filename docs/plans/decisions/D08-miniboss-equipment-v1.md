# D08 — Live miniboss equipment

BUG686 reproduces11 real-pool failures. Implement drop-tables §3/§5.6 for
the five configured mini tables and combat tier `boss`, without changing combat
identity. Three noDrop0 replacement picks inherit actual-act trash equipment
with source minima+3; one independent noDrop0 pick inherits actual-act jewelry.
Use rarity multipliers3/4/8 for these ordinary rolls and the existing independent
.5 rare+ bonus. Bonus source minima retain their existing unshifted contract.
Both ordinary and bonus sources extend only terminal bands to finite act caps
59/72/87/101/122. Actual ilvl, source weights, fixed rarity and post-curve offline
MF remain authoritative. Invalid/missing sources, mismatched acts and impossible
ordinary groups refuse the entire bag before publication.

D10's accepted independent material contract takes precedence over old prose:
keep one actual-act rune and one gem, current difficulty/quality caps, shard
formula, act-scaled6–10 wishes, difficulty scaling and final kill-wish gate.
The live ordinary projection replaces mixed mini-TC draws, as §5.6 prescribes;
raw TC JSON and explicit quest caches retain their authored mixed rewards.
Unknown/unconfigured sources, chapter bosses and goblins keep their existing
rarity context. No save format, earned-save or historical-evidence changes.

Plan: closed schema before data; validate all five unique act/table bindings
and references through the browser-precompiled catalog; prepare equipment and
jewelry before draws; pass an explicit local rarity context through ordinary
and conditional rolls; expose finite unshifted equipment to the bonus consumer.
Verify real-pool reproduction, exact minima/weights/caps, both bonus branches,
MF, actual spawn coverage, schema/source refusal, cache/special-source isolation,
determinism and native atomic inventory delivery/refusal/restoration. Run only
affected tests/types/lint and one isolated production/precache check.

Plan review: ready with distinct loot identity, unshifted bonus minima, D10
precedence, finite bonus-source projection and browser schema integration.
Security check: pass; bounded local rewards and existing settlement, with no
network, credentials, dependency, permission or CI changes. No new agents,
installs, commits, pushes, publication, broad suite or campaign reruns.
Full private v1, economy/pacing and formal balance acceptance remain open.
