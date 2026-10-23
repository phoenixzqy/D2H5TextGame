# P18a — Worldstone Remnant foundation

Implementation: `c844125e469cad5f43aca6f7fee4c8f685cdd92c`, local only.
Contract: [D14](../../design/worldstone-remnant.md).
Verdict: bounded pure foundation approved; P18 and full v1 remain incomplete.

## Implemented boundary

Closed JSON/schema/Ajv content defines four level90 waves, fifteen originals,
Ashen/Glacial threats, repeat flawless-gem caches and a two-modifier achievement
reward. Canonical monsters, executable skills, eligible bosses, loot and
materials are cross-validated. Shared modifier archetypes and out-of-order
wave identities refuse. All authored display keys have zh-CN/en entries.

Admission uses actual `hasAct5CampaignReward` authority. Strict closed state
checks safe counters, campaign entitlement and claimed reward ownership;
achievement eligibility/title projection is derived. Plans freeze hero,
modifier, ordinal, seed, manual mode and explicit endgame origin, without
campaign replay/quest provenance or elite/chapter overrides.

Captured original identities and private issuance seals reject structural
progress copies, manufactured bindings, mismatched attempts and invalid final
original populations. Ordered victories propose the modifier cache only after
wave four. BUG135 records the causal extra-original failure and correction.
Legitimate enemy summons remain distinct from original monsters. Pure
proposals are repeatable; they do not consume a native settlement receipt.

## Validation and review

| Check | Result |
| --- | --- |
| `npm run test:engine -- src/engine/endgame` | 60 tests / 3 files pass, 3.00s |
| `npm run test:engine` | 5403 tests / 158 files pass, 53.21s |
| `npm test` | 11088 pass / 411 files, 2 existing skips, 418.15s |
| `npm run typecheck` | exit0 |
| Typed scoped ESLint, including otherwise ignored `tests/helpers/endgame.ts` | exit0 |
| `npm run lint` | exit0, engine purity included |
| Production build to task-owned output | exit0 |
| Production test-bridge token scan | 4 JavaScript chunks, zero hits |
| Source/test/script/config freeze | 1076 files, zero drift; base unchanged throughout tests |

The full suite ran alone with unchanged source; lint/build began after it
exited. Commit publication changed Git history only; the validated source
matches the implementation commit. The 3s engine and 15s full-suite budgets
remain unmet. Existing bundle-size and oversized asset-manifest precache
warnings remain; no performance/offline gate is accepted here.

Both modifiers' positive paths use production `buildMonsterUnit` and
`runBattle` for all four waves, with an explicitly constructed high-power
hero. These are functional controls, not earned playthrough or balance proof.
Negative synthetic outcomes cover failed, incomplete and substituted members.
The campaign fixture exercises the real Eve/Throne/Baal source graph but does
not represent an earned five-act run.

Independent read-only `design_contracts`: APPROVE after required identity fix.
Independent read-only `qa_save_review`: ADEQUATE after exact-population and
both-modifier coverage fixes. Both inspected source/assertions without running
checks; validation above was run by root. Both released readers and created no
artifacts/processes. Narrow security review: pass; no network, credentials,
dependency, permission or agent-behavior changes.

## Remaining work and retained evidence

SaveCurrent remains19. No native dungeon entry, committed ordinal, authentic
recording acceptance, ordinary reward integration, completion count/cache
publication, achievement Claim/title selection, save20 migration or UI exists
yet. No browser test is claimed for this pure slice. Next integrate these
domains with explicit origin dispatch, current ownership and full rollback;
then prove repeat clears, reward consumption, loss/retry and exact reload.
Earned unlock, multi-build balance and the seven-class/213-skill, five-act,
30–50 active-hour C2–C4/G0–G7 objective remain open.

Exact diagnostic root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-endgame-10850na9`.
Root retains it through native integration and umbrella evidence consumers,
then removes the diagnostics. `artifact-ownership.json` enumerates files.
Relevant logs: `closure-red.log`, `closure-green.log`, `membership-red.log`,
`membership-green.log`, `foundation-green.log`, `engine-final.log`,
`full-final.log`, `typecheck-final.log`, `scoped-lint-final.log`,
`lint-final.log`, `build-final.log`. Initial failed attempts are retained,
not represented as passing checks. Review/freeze/cleanup receipts:
`final-reviews.json`, `source-freeze.json`, `source-freeze-check.json`,
`bridge-scan.json`, `cleanup.json`.

The completed build consumer released task-owned `dist`; it was removed with
portable file APIs after checking the exact path and absence of symlinks.
`dist`, `browser` and `review-snapshot` are verified absent; no disposable
cleanup failure remains. All task validation processes exited. The isolated
worktree remains claimed for the unfinished full-v1 objective. No push, PR,
merge or deployment occurred.
