# D08 — Ordinary-monster live equipment

BUG687 reproduces10 failures. Extend the existing closed nonboss policy to
actual combat tier `trash` for the fifteen configured ordinary act-table aliases.
Drop-tables §2.1/§3/§4 requires one weighted equipment attempt, no minima shift,
no extra jewelry, noDrop .6/.5/.4 by actual Normal/Nightmare/Hell difficulty,
and rarity multipliers1/1/1. Actual tier governs the reward under shared ordinary
wave aliases, as for champion/rare leader. Keep actual ilvl, source weights,
fixed rarity and post-curve offline MF.

Reuse the finite terminal-only act caps59/72/87/101/122. Never revive expired
early bands; valid levels below a source minimum can produce no equipment.
Missing/invalid configured sources, wrong actual acts and out-of-envelope
levels refuse before draws/publication. Preserve raw treasure-class JSON,
explicit caches, unconfigured tables, special sources and other combat tiers.
D10 .006 rune/.015 gem independent chances, quantity1, sampler caps, wishstone
behavior and shard formula stay authoritative. No persistence/history changes.

Plan: schema before authored row, extend the shared projection's tier predicate
and type, bind trash rarity to authored data, then verify real-pool failure
cases, exact noDrop/qlvl/source-weight boundaries, MF, material independence,
finite caps, actual spawn planning, deterministic next RNG, cache/special-source
isolation and native inventory publication/refusal/restoration. Only affected
tests/types/lint and one isolated production/precache/schema-build check.

Plan review: ready; existing actual-tier shared-wave behavior resolves alias
semantics; explicit low-level emptiness, finite caps, D10 precedence and
browser-precompiled schema integration cover the material edge cases.
Security check: pass; bounded local rewards and existing settlement, with no
network, credentials, dependency, permissions or CI changes. No agents,
installs, commits, pushes, publication, full suites or campaign reruns.
Full private v1, economy/pacing and formal balance acceptance remain open.
