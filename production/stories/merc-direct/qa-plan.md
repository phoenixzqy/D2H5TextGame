# Native mercenary direct damage — QA plan

Type: Logic / Integration / Config/Data. Native repair only; feature acceptance open.
Contract: `docs/plans/decisions/D04-merc-direct-v1.md`; causal bug: BUG-374.

1. Frozen `src/stores/merc-direct.test.ts`: all seven actual pool→factory→projection
   loadouts and default registry. Seed5 literal first-cast recipients/damage,
   retained secondary skills/Fire Mastery, zero MP, one action, repeatability and
   immutable saved/input state. Seven causal RED failures precede production edits.
2. `src/engine/skills/merc-direct.test.ts`: exactly one of each row; schema rejects
   missing/duplicate identities, foreign/malformed effect metadata and costs,
   scaling/Attack leakage and cross-row caps/status/crit/sequence permissions.
   Deep copy/freeze nested effects/base/status/sequence/tags; full merc catalog
   remains schema-valid, repeated default loading preserves player/native siblings.
3. `src/engine/combat/merc-direct.test.ts`: ranks1/20, flat Attack invariance,
   ordinary increases/crit/Defense/resistance/minimum1; effect-only Chop crit,
   overflow and intervening basics; independent hit/crit/status RNG and misses.
   Literal Burn amount/expiry/stacks; Chill proc/expiry/cadence; Paralyze/DR/action
   interruption; Smite ordinary/boss expiry. First-two selection covers third
   untouched, single target and dead originals. Five bolts cover one/many originals,
   misses, target/caster death/reflection; one cooldown/zeroMP and exact expiry.
4. `src/stores/merc-direct-lifecycle.test.ts`: actual loadouts publish/replay each
   changed mechanic with literal damage/status observations; terminal HP/MP/stats/
   statuses/buffs/enrage converge, initial/saved/recorded inputs remain unchanged.
5. Run native focused regressions, engine, ordinary unit, typecheck, lint and
   external build on bound unchanged inputs. Preserve failed receipts honestly;
   stop source continuation on BUG180/366 timeout recurrence. No test-budget or
   performance acceptance claim from completion alone.

Manual browser/mobile/locales/a11y/equip/save/reload, earned recruitment, balance,
campaign/pacing and full-v1 gates remain pending. H3 is terminal failed-no-app;
no alternate application launch/retry, protected fixture access/replay, diagnostics,
closed policy matrix or new acquisition/lineage/gameplay replacement run.
Root owns exact external packet evidence and eventual cleanup:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-direct-3u9ht7ur`.

## Native verification — 2026-10-28

Four new files provide99cases: resolver40/combat45/frozen primary7/public
lifecycle7. Final unchanged2085-input map
`e3495bca891687447282cda5a91ba49270b641e9f7b28684b9d3c1dd34e8e7c4`
passes focused330/11files, engine11345/422, ordinary21201/997 with zero failures,
pending or todo, project types, scoped/full zero-warning lint, ordinary dependency
audit997tests/1581modules and external build. The primary's literal values and
fixtures remain frozen. Actual failed schema/Burn-observer/lint/type attempts,
reviewed corrections and native receipts remain retained. All42 recorded check
PID/driver observations are absent; disposable build verified removed with no
cleanup failures. [Evidence](../../../docs/plans/evidence/merc-direct.md).

Independent native source/completed-gate reviews approve; final evidence and
exact staged/committed blob/tree/parent review govern the local checkpoint.
This closes native test execution only. The manual/earned/full-v1 acceptance
listed above remains open; no browser retry or replacement gameplay run.
