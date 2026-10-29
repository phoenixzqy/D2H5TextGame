# BUG-376 — Replace the contradictory mercenary Telekinesis placeholder

- Severity: High — advertised damage/control feature has no working equivalent.
- Status: Open — native repair verified; browser/earned feature acceptance pending.
- Affected systems: engine-dev / content-designer / writer.
- Build: `9d2bae89d04ae9eda7416fea8126c21c312e4d8f`, existing claimed worktree.
- Environment: native Vitest, constructed mechanics; browser/viewport not exercised.
- Locale: native engine; zh-CN/en wording also promises unsupported movement.
- Seeds:3 and9, independently precomputed hit/base/crit/proc literals.

## Reproduction

1. Load `mercs/act3-iron-wolf-telekinesis` through the real pool/factory/projection
   and default registry. Preserve its sole `mskill-telekinesis` skill bar.
2. Construct surviving resources, zero MP, speed100, one cast at1700ms before a
   future hold; use ordinary targets with zero dodge/resistance/mitigation.
3. Execute `src/stores/merc-telekinesis.test.ts` with seeds3 and9.

Expected: authored Arcane20–32, normal damage pipeline, CD2/zeroMP/flat ranks;
seed3 damage20 plus landed Stun1700–2700ms; seed9 damage31 without control.
The no-movement adaptation explicitly reconciles advertised50% Knockback into
50% landed Stun1000ms ordinary/500ms bosses, distinct from player utility.

Actual: stub Arcane20–30 with no control. Seed3 applies no Stun; seed9 deals29.
All three causal primary cases fail before production edits. No earned or browser
acceptance was attempted. Workaround: none for the advertised control mechanic.

Root cause: registry executes a separate hardcoded placeholder rather than a
validated authored mercenary DamageEffect with explicit status metadata.

Evidence retained by root through unfinished acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-telekinesis-1wffcccm`.
`red-result.json`: exit1/3failed,11.050042s, unchanged2090-input map
`84a4255e91e09e0f9a13736b47460d2b442d80b31480521b8ccf10f6322419d6`.
Primary SHA256:`b7385d9e7b4084947ee7e1fbdfa4c54bfb8ea2d91f47c92d813918e947e676ee`.
Contract: `docs/plans/decisions/D04-merc-telekinesis-v1.md`.

## Native repair verification

Validated immutable authored Arcane20–32 damage and landed50% Stun replace the
exact placeholder; schema closure and zh-CN/en wording match D04. The original
frozen primary passes3/3 after repair. Four new test files add80cases across
resolver/schema, engine combat and public recording/playback lifecycle.

Final unchanged2094-input map passes focused235/8files, engine11476/426, audited
ordinary21345/1005 with zero failed/pending/todo, project types, scoped/full
zero-warning lint, dependency boundary audit and production build.
[Native evidence](../../docs/plans/evidence/merc-telekinesis.md) records failures,
reviewed test-only corrections and external wrapper bookkeeping lineage.
Browser/earned acceptance remains pending; this bug stays Open.
