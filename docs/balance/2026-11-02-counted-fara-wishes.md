# Counted-source and Fara finite wishes — 2026-11-02

BUG587 implements six10-wish bonuses: Gheed, Fara, Alkor's Experiment, Jade
Statuette, Jamella's Trade and Malah's Elixir. Main rewards remain450 across24
quests; finite side rewards now total140 across14/22 quests. Eight specialized
side publishers still need their frozen10-wish bonuses. Planned finite totals
remain side220 / main-plus-side670. Repeatable bounties retain their gem shard
and grant zero direct wishes, including the first claim.

## Settlement and compatibility

The shared currency journal now reserves distinct currency keys for the same
finite source under the existing quest lease. Another source or duplicate key
still refuses. Each opaque owner retains its own baseline presence, attributable
independent additions, grant/outstanding state and release. Ordinary additions
use direct Map lookup, without array allocation in the inventory hot path.
The old source allowlist and exact+1 gem facade remain. There is no second
transaction, new persisted state, whole-wallet backup or save compensation.

Gheed and Fara reserve both currencies before any publication. Gheed keeps
XP1000, the actual merc share and five-lot exchange; Fara keeps its real Talk
receipt and prerequisite, with no XP or actor normalization. Alkor's five
points, Jade's1000 rune shards, Jamella's concrete perfect gem and Malah's
effective Vitality remain. Recover/Talk/Jade Give pay nothing. Exact canonical
reward checks now require the existing full bags plus wishes; arbitrary extra
rewards and missing bonuses refuse before payment.

Each publisher verifies after payment boundaries and marks claimed last.
Failure restores wishes and the catalyst before final source/actor restoration
checks, verifies both currencies last, attempts every restoration and releases
all owners. Independent additions to either currency survive. Unknown wallet
overwrites remain untouched and cause an explicit AggregateError while other
participants restore. Retries pay a complete reward exactly once.

## Evidence

The external packet is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`bug587-baseline-v1.json` retains all original changed-file bytes. Fifteen
original assertions fail in `bug587-red-v1.json`: six missing authored bonuses,
six missing native payments and three rejected same-source currency pairs.

687 distinct cases pass incrementally across18 affected suites. Counts use
actual assertion status, excluding filtered/skipped cases. Coverage includes
real public Claim, existing reward/source/actor rollback, partial/throwing/silent
wish ingress, independent additions, overflow before XP, retained wallet
aliases, explicit restoration failure, real gem compatibility, schema loaders,
and the Gheed/Fara UI-to-crafting flows in both locales. Spending the catalyst
preserves the new wishes.112 final Claim cases and22 final journal cases pass;
the last four affected bilingual UI cases also pass.

The initial UI assertions used a nonexistent reward label; they now read the
actual `gacha:wishstones` key. Their post-crafting wallet expectations now retain
the additional wishes. The strict type check identified unknown-shaped Fara
reward data; a numeric boundary check resolves it. The new journal test's void
arrow lint issue is corrected. Raw failed attempts remain alongside final
receipts; assertions were not disabled or weakened. Scoped strict TypeScript
and explicit affected-file lint pass.

Removing exactly the six additional fields reproduces the previous side
document byte-for-byte. All main fields and the five bounty bags remain
unchanged. Authority27 pins2101 source inputs and17 deliberate transitions;
the kill engine and campaign helper manifest remain unchanged.

## Full-v1 limits and next work

The retained Javelin campaign has no side claims, so prospective non-kill
arithmetic remains455, never paid. Its historical98607-wish wallet, completed
five-act/1314-admission chain and all14-build evidence are untouched. No new
earned campaign admissions or reward grants are claimed. Balance acceptance
remains0; authored bonuses do not prove actual Hell income or pacing.

Next are Cow rumor, Lost Caravan, Drognan, Summoner's Secret, Ormus, Larzuk,
Anya and Nihlathak; then actual L70 Hell income, protected inventory pressure,
chronological build acquisition/fairness/independent holdouts, defeat/retry,
manual/idle, calibrated30–50 active hours, integrated G0–G7, soak, review and
later owner playtest. Browser works; CI is excluded. No pending question or
external blocker exists. No completed campaigns or unrelated suites were rerun.

The exact temporary type config and audit cache are removed after their users
finish. Root retains the registered worktree and external packet for full-v1
and review consumers and owns eventual cleanup. No install, commit, push or
publication is performed.
