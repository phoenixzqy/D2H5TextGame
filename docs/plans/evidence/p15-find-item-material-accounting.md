# P15/P12b — Find Item material accounting

2026-11-04. The opt-in accounting component is locally verified. Production
gameplay and all 2,100 production source files remain unchanged. Full private v1
and all-source economy acceptance remain incomplete.

`findItemMaterialContext` validates successful searches against original enemies,
final slain enemies and native hero authority. The journal matches ordinary
reward calls followed by successful-search calls, retaining separate treasure
class and independent material ledgers for each source. Opening stock is
excluded; duplicate receipts cannot pay twice. Missing/extra calls, malformed
finds, metadata mismatches, search first-kill bonuses and nonwins refuse
atomically. Ordinary-only callers still refuse Find Item; other unsupported
sources and quest projection remain refused by the opt-in path.

Six new constructed accounting cases, one native integration case and all 27
existing accounting cases pass: 34 distinct affected cases. Scoped strict
TypeScript and explicit two-file lint pass on final source. The original RED
and lint failure are retained. The six cases were not repeated when the native
case was added; its invocation selected that case alone. No broad suite, build,
browser run or completed-act replay was needed for this Node-only tooling.

The native constructed fixture uses Barbarian 30, Find Potion 1 / Find Item 20,
synthetic Life/Mana/Attack, Blood Moor seed 19 / ordinal 0, real combat/playback/
settlement and only mocked durable save I/O. It makes seven paid searches:
three succeed and four fail. Eight ordinary and three search reward calls
reconcile exactly; **both sources yield zero materials**. Separate RNG instances,
corpse identities/ranks and failed-search exclusion reconcile. The positive
TC-plus-independent material payout is covered by the separate constructed
two-bag case, not by this native sample. W1 settles; normal advance stages W2,
which is aborted in cleanup. This grants no earned gameplay or campaign credit.

External raw readback validates per-kill TC plus independent arithmetic before
aggregating sources, inventory deltas and totals. Its earlier sample-specific
reader and output are retained; only readback was rerun for that correction.
All 2,222 other manifest inputs remain exact; two source differences after the
native report are hash-bound lint-only edits. Native report SHA256:
`dc04821982c9fd5ee051ac5fc2c8ed0700649bd6e3b86da22cd6b60e2583e09e`.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-find-item-materials-9w23ex0o`.
Eight recorded PIDs are absent; scoped config is archived as text and removed;
no task cache or server was created. Root retains the packet and human2 through
unfinished umbrella review, then owns exact cleanup/release. Self-readback is
not independent acceptance. Previous goal turn was status-only/no progress;
ownership was revalidated before closure.

**14/14 Act I; 10/14 intended Normal; formal balance 0/210.** Holy Bolt, Zeal,
Double Swing and Javelin remain unfinished. All-source encounter/income budgets,
acquisition distributions, affordability and pacing remain open, alongside
higher difficulties/endgame, PWA/device/performance, soak and final acceptance.
This component establishes no acquisition rate or completion-time claim.
