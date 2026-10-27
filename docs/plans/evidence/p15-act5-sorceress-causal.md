# P15-S02 — Separate mana pressure and fire resistance

Status: paired eight-seed diagnosis complete, independently reviewed. No
production tuning, full-area viability or pacing acceptance. This continues the
[original screen](p15-act5-sorceress-screen.md); both original candidates still
fail a full native area. [Compact metrics](fixtures/p15-act5-sorceress-causal-metrics.json)
retain all56 rows, edits, input hashes, resource/action metrics and raw hashes.

## Native input and causal controls

At HEAD`370aecb2`, observe the exact production staging return without changing
it. Capture Cold W3 and Fire W1 native engine inputs; retain their native
recordings. Prove native/direct recorded, plain/recorded and A/A parity before
interventions. All16 captured event arrays/outcomes exactly equal the retained
original screen's first repetition. Its opening enemy presentation includes
grid placement and Holy Freeze Chill; that presentation is not the raw input.
The audit records those two expected differences rather than claiming raw-team
equality. Initial audit assumptions of repetition0 and presentation=input were
rejected and corrected; no combat data was changed.

Use the same earned L35 gear/48-point allocations/native preparations as P15-S01,
against native L56–58 enemies. Each native baseline runs in separate restored
stores and restores the caller. Counterfactuals clone the captured inputs and
run only the pure combat engine: no counterfactual settlement, rewards or save
promotion. Intervention fields are exactly hero starting mana, hero
`manaRegenPerSecond`, or native Blood Lord `stats.resistances.fire`75→0.
All other fields, including enemy magic resistance and hero damage, stay exact.

The recovery ceiling125MP/s is50MP maximum relevant cost divided by the engine's
0.4s minimum action period. It is an experimental ceiling, not proposed tuning.
Actual ordered costs are Cold30/35/12 and Fire50/20. Pre-action observations
prove every ordered skill affordable at every observed action in every recovery
variant; minimum pre-action mana is65Cold/474Fire. Actions below the maximum
ordered cost in other variants include cooldown skills and are **not** a count
of mana-caused missed casts. Basic attacks can still be legitimate cooldown fill.

## Paired results

Seeds1–8, seven variants per seed:56 pure-combat observations. The independent
denominator remains eight seeds per variant; this is not a holdout set. Every
hero survives. All failed observations are60s draws, with no victory-only TTK.

| Snapshot / intervention | Wins /8 | Victory-only seconds min / median / max |
| --- | --- | --- |
| Cold W3 baseline |0|—|
| Cold W3 starting mana474 |8|38.5 /46.75 /55.784|
| Cold W3 recovery125 |8|38.5 /45.508 /47.5|
| Fire W1 baseline |0|—|
| Fire W1 recovery125 |0|—|
| Fire W1 Blood Lord fire resistance0 |8|27 /34 /43|
| Fire W1 both interventions |8|27 /33.75 /37.5|

Cold W3 baseline begins at2–53/474MP. Either isolated mana intervention resolves
this wave in the sampled seeds. Fire W1 begins at474MP and continues to fail
with all ordered skills affordable: resource supply alone does not resolve it.
Changing only Blood Lord fire resistance resolves that snapshot at ordinary
recovery; coupling both changes adds little median time improvement.

Baseline Fire records305one-damage hits out of765hero-sourced non-dodged direct
fire damage events across all targets. Recovery-only records457/959. Both
resistance-removal variants record zero such one-damage events. This attribution
excludes source-less periodic DoT and does not identify a specific spell's entire
damage. The resistance intervention also changes subsequent targeting/RNG/events;
its later differences are consequences, not independently fixed combat histories.

These observations support separate mana and resistance obstacles at the frozen
snapshots. They do not establish that mana/resistance are the only obstacles,
justify refilling every wave or removing authored resistance, or demonstrate a
six-wave clear. Next screen legal resource allocation/priority and complementary
damage choices with unchanged enemies before considering production tuning.

## Verification and retention

The original pilot launch failed before tests because `--workspace false`
treated `false` as a workspace path. Preserve that failure. Correcting only the
launch command passes the seed1 pilot in16.59662136s. The eight-seed screen adds
per-action affordability assertions and passes1/1 in64.424335438s wrapper time
(54.293s test,63.63s Vitest). All1810 runtime/config/test hashes, diagnostic and
config bytes and genuine fixture gzip remain exact before/after. Input clones
remain unmutated; caller stores and genuine ancestry are conserved.

Independent static/artifact review: APPROVE, no material findings. Reviewer
recalculates all56 rows, declared edits/hashes and metrics; readers released.
No independent runtime QA or human playtest is claimed. No repository runtime
or test change was needed, so this diagnostic does not require another full
unit run. Blood Raven's separate original full-suite gate remains independent.

All consumers finished. Root read-back/hash verified104archive members, then
removed the exact102files/two nested directories/raw root, with remaining[] and
failures[]. The archive includes executable diagnostic/config, original launch
failure, native inputs, recordings, audits and compact publication. Shared caches,
source and genuine fixture remain intact. Root retains these exact artifacts
through full-v1/independent consumers, then owns their eventual removal:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-p15-causal-0pl11bjd.evidence.tar.gz`
- sibling `.manifest.json` and `.retention.json`.

Archive SHA256:`a8251aa60b64c9a115c1b5095a0757fbb246c702be0f19e98af406752dcaceb3`.
Manifest SHA256:`f592a8c60fb311428abeb898ffad198924e8ddd6183a38e2e8e8bf0c2a328d8d`.
