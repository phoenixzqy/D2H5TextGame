# P15 — Boss poison damage immunity local evidence

2026-11-05; root, solo. BUG759 fixed locally, not committed/independently accepted.
Decision: [explicit damage immunity](../decisions/P15-boss-poison-damage-immunity-v1.md).
Packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-boss-poison-damage-b1pf1eam.
Root retains this exact packet through full-v1 acceptance, then removes it.

Seven original reproductions fail before the fix (red.log); initial7/7 and
native25/25 pass (green-focused.log/green-native.log). Final affected-tests.log:
297/297 across12explicit files, including15 strengthened new cases and18native
cases. Real manual/idle Andariel/Mephisto take zero Poison Nova/Plague Javelin
poison damage in engine and actual playback; other damage and independent status
protection remain. Unchanged RNG, ordinary75cap/minimum1, typed components,
penetration, all seven canonical types, frozen copies and periodic poison versus
physical Bleed are covered. Immune rates are excluded from settlement, provenance,
recovery weighting and lethal prediction; explicit status type precedes legacy
aliases. Susceptible controls require positive damage/status application.

Strict scoped TypeScript:602implementation/data files,zero diagnostics (types.log).
Changed-file ESLint exits0 (lint.log). Strict Ajv/schema-source comparison passes
(schema-source.log): only Andariel/Mephisto gain poison damage immunity; other
ActI/III archetype fields/rows and schema properties are preserved. Empty/all7
canonical arrays accepted; malformed/duplicate/unknown metadata rejected.
Incremental diff, hashes and self-review are in the packet. All test/type/lint/
schema processes terminal; no task server/browser/cache or disposable remains.

No presentation change, browser diagnostic, campaign rerun or exhausted retry/
sample renewal. This corrects the named encounter rule; no balance, acquisition,
30–50h human pacing, independent or owner acceptance follows. Historical14/14
intended Normal completions,210checkpoint sources/formal0/210 remain unchanged.
Browser works; CI excluded; full private v1 remains unfinished.
