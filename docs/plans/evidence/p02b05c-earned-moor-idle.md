# P02b05c — earned Blood Moor and active idle pilot

Status: **failed discovery; gameplay acceptance remains open**. One frozen
production en/desktop attempt completed forty earned first-wave farms and won
Blood Moor waves1–2, then wave3 ended in a native draw with one living zombie.
No full clear, idle eligibility, idle run, repeat/stop or reopen was reached.
No retry, alternative build, extra farm, refill, seed search or product change.
Full P02/P11/C0–C4/G0–G7/private v1 remains open.

## Exact scope and freeze

Measured parent0107455261e3f783de30f63ef407d9d26667b0da plus the two new files:
`tests/pwa/blood-moor-earned-idle.spec.ts` SHA
4427499f64ab2f2cc9145da308f3937158be8b6246ca618a570f440df661cf34;
config96e56e6ddc08989516de52f0e1a978e5ce557da9ab3a64a2486d3b1a0925a660.
External runner9ef10e98d75e84005612f814be8a00cac8722f17e8a041e8aeebe720308a2f00
and commands77444f3f33874e61e59a6b19b9938f7f6804aa472258b46ea89747fa9fab3982.
Producer, independent QA, GD and TD approved exact source readiness before
publication/execution. Drafts and corrected review findings are archived. No
post-freeze test amendment or fabricated runtime/missing-capability RED.

One fresh Sorceress, ordinary controls, free fielded Inner Sight, Fire Bolt1,
exactly40 partial W1→native W2→Pause→Flee farms. Each original hero alive,
nonempty same enemy roster dead, terminal victory log, disabled Skip and exact
reward/progression journal passed. Level6/XP67/8818,344 unique earned items,
5157 rune shards; mercL9/XP249/4404. Ordinary preparation applied15Vitality,
10Energy, FrostNova+5 and Frost→Fire combo, native first-earned hero glove5/
boots3 and merc glove4. Exact prepared full-domain save passed: bag341,
hero core10/25/25/45, HP120/190 MP102/137 defense43, empty clears/idle target.
No Den quest acceptance, debug bridge, direct run service or save import.
Date alone fixed2026-10-20T12:00Z; timers native. Expected seed2330410254 and
ordinals0–39prep/40manual/41idle/42repeat are source-derived expectations;
unreached41/42 are not observations or explicit runtime arguments.

Three planned criteria: genuine manual full clear→Farm Here unlock; one actual
idle UI clear→automatic repeat without restart click→Pause/Stop before reward;
full settled-domain equality through Stop/4000ms/save/committed IndexedDB and
same-context reopen. Only prep and two manual wins were reached. The complete
idle checkpoint and active-page failure diagnostics strengthen future proof,
but unexecuted assertions certify no behavior.

## Observed failure and accounting

Browser one test/one failure,106.118s case;108.755s process, exit1, no timeout,
size stop, retry, signal or remaining task process. It failed at the strict
wave3 all-enemies-dead assertion. W1 original hero displayed HP70%, W2 65.26%,
W3 87.37%; all three show original hero present/nondead. W3 has one living
Zombie A and terminal log **“The battle ends in a draw.”** Skip is disabled;
the final defeat panel was not awaited. This is native terminal playback, not
a Playwright timeout or observed final settlement. Screenshot and captured terminal UI logs (up to 200 entries per snapshot)
remain in the report/archive. A draw is a nonwin, never a successful clear.
No gameplay defect is inferred from this single failed candidate.

Observed/source-derived counts at failure:41 starts,83 installed/computed
battles (80 prep including abandoned W2 +3 manual),43 Skip calls,42 observed
settlements (40 prep +2 manual). Of83 computations,40 abandoned prep W2 and
terminal-but-unsettled manual W3 are not observed settlements. The attachment
labels failed-run counters as lower bounds if an unfinished action/transition
could compute unobserved work; it does not claim hidden service handles were
instrumented. Frozen successful-path maxima remain43/87/46/46. Existing full
unit-suite simulation activity is separate from this browser accounting.

Readonly IndexedDB polling retained stale observations then known newer W1/W2
journals. Latest committed W2 journal is heroL6/XP547, bag397, rune shards5850,
gem shard1/wishstones2, no clear or idle target. W3 no-new-reward/finalization
is not certified because the test stopped before the1500ms settlement effect.
There were zero browser console warnings/errors and page errors. Runner Node
NO_COLOR/FORCE_COLOR warnings are retained separately from the page console.
English/1280×800 only; no mobile/CJK/visual/a11y/full campaign acceptance.

## Validation, provenance and resources

Full unit3268 actual passes/161 files/zero other statuses,57.296s; T18.545s,
L52.895s including purity57 engine test files; list exactly1 case/1.924s, all
exit0. Existing15s full-unit target exceeded, unchanged. After all source/test
consumers released, production build/bridge8.971s exit0/four clean chunks;
existing large-chunk/art-manifest precache warnings remain. Build never
interleaved with fingerprint consumers. Nine preserved source/tool/input
hashes, frozen spec/config and all tracked parent files remained unchanged.

Case180s/pilot240s/build210s plus2s exact-owned cleanup grace,32MiB per command
report/log,64MiB total task RAW+dist+.vite remained unchanged. Pilot JSON
2,922,804bytes,137 attachments, disposable attachments419,434bytes; final
monitored task total45,597,379bytes. Dedicated Linux subreaper tracked task
ancestry/confirmed process groups and PID birth identities; all six commands
ended with no signals or nonzombie survivors. Installed tools/browser caches
were preserved. One audit invocation used RAW as cwd and failed before output;
unchanged audit reran in worktree successfully, with no gameplay rerun.

[Packet](fixtures/p02b05c-earned-moor-idle/packet.json) and indexed raw archive
retain exact frozen/draft source, source/tool identity, command/process metadata,
full unit/browser reports, all native journals/terminal logs and failure image.
Independent outcome and durable evidence reviews follow below. Exact cleanup
follows all readers and the local feature commit, then a separate closing ledger.

## Independent review and next work

GD/TD approved the outcome. Producer approved the complete durable packet.
QA verified all records and requested one evidence-only wording correction:
terminal UI snapshots retain at most200 log entries. That correction is applied
here and in the archived draft. QA APPROVED the corrected57-record packet
caa2536d95007df66655afb8849499a7c191338af9dc386454a5aca0540596d4;
archive3b5f41f3bf081ed663039a70fe0812a2b8220b3a5332e0644230bfb6726542d0.
All independent readers released; approval concerns evidence completeness,
not the unreached gameplay criteria. Next concrete gameplay slice
is the already advertised but separately missing Chill slowdown, preceded by
an explicit D04 scheduling contract, causal RED and structured bug report.
It is not established as this draw's cause. No additional measurement adapter
or stronger first-clear retry follows this checkpoint automatically. Earned
Den/Andariel, idle UI, campaign/pacing/balance and full v1 remain open. No
push, PR, merge or deployment.
