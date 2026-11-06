# P16 — Canonical socket validation performance

2026-11-04. BUG712 is locally resolved; F21 runtime performance and the full
private v1 remain incomplete. Previous goal turn was status-only/no progress.
The existing human2 registry entry was revalidated in_use by the current
session before checks and edits. Inherited source changes are preserved.

## Cause and change

The retained earned save contains 8,540 backpack items. Profiling ten native
current JSON decodes identified 35,607 microseconds of matchedWord self samples.
The profile also includes serialization/assertions outside timed decoding;
it is not a browser measurement or a full attribution of decode cost.

Canonical socket validation previously searched all 35 recipes even for empty
contents, and resolved effective socket capacity twice. The local change groups
recipes by their actual authored rune count, preserving order within groups,
and passes already validated capacity into matching. Insertion preview also
reuses its resolved capacity. Indexing uses rune count rather than assuming
every future recipe has equal socket and rune counts.

All descriptor, material, rarity, eligible base, capacity, runeword identity and
personalization checks remain. No save format, authored data, validation-result
cache, trust flag, dependency or public API changes.

## Affected verification

Five new semantic cases passed before implementation: all 35 authored words
on concrete legal bases without mutation, and four incomplete plain-socket
states that reject claimed runeword identities. This behavior-preserving
optimization has no claimed behavioral RED. The retained baseline report has
five actual passes and 32 unselected tests; its aggregate passed counter is not
used as the executed-case count.

The affected socket-contents, socket-runtime, socket-v19 and native-save-descriptor
files pass all 63 cases. Scoped strict types pass. Initial lint correctly rejects
one unnecessary optional check on required RuneWord.allowedSlots in the new
fixture; only that test line is corrected. The changed authored-word case passes
again; final scoped strict types and explicit two-file lint pass. The 63-case
report predates that one-line fixture correction; its exact fixture bytes are
retained. All pre-existing test bodies remain byte-identical. Unselected cases
in filtered runs are outside that run's scope, not disabled acceptance tests.

No broad suite/build, completed-act replay or timing rerun was used.

## Frozen comparison

Seven measurement pairs alternate baseline/candidate order in separate Vite
SSR module graphs, without a listener, HMR or file watcher. The baseline module
is injected from exact pre-edit production bytes. Both graphs load the same
remaining current source and the same retained save. One warm-up precedes the
seven pairs; every sample is retained. The plan froze acceptance before timing:
socket median at least 10% lower, complete-decode median at most 5% worse.

| Node measurement | Baseline median | Candidate median | Reduction |
| --- | ---: | ---: | ---: |
| Socket validation, 9,147 item representations | 8.311622 ms | 4.185361 ms | 49.6445% |
| Complete current JSON decode | 69.326613 ms | 60.272281 ms | 13.0604% |

Both criteria pass on the sole benchmark run. Full serialized state matches for
both warm-ups and every measured decode; the item population and source inputs
stay unchanged. The save is version33 and canonical JSON is 4,494,337 bytes.
This measures Node/Vite SSR on one retained save; individual decode pairs vary.
It does not prove browser/device, startup/storage, population or soak budgets.
No campaign, formal balance or whole-app acceptance credit is added.

Baseline production SHA256:
`a9b4a61324e3aad41a173bd3207bc3a75450f6d28dbe4fc94342d77f7d51df77`.
Candidate production SHA256:
`8a5efdd4c0d58672ba5eb8bf218d0ce7be5c7575aca860241f9502bf3fff74d5`.
Earned input file SHA256:
`aa7f9ed5196513e1a0045c59624550c815876b745d5e48c4512129859ca8ed76`.
Canonical JSON SHA256:
`a16ffc887d5916bdbad9690eafc58aa145dc7f68cc059fab47aad75476f5c1f6`.

Separate Python raw-report readback recomputes all medians, alternating order,
acceptance thresholds, actual executed-test counts, original test preservation,
source hashes and cleanup. Root five-axis self-review and security check pass;
these are not independent QA acceptance.

## Evidence custody and remaining scope

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-save-decode-profile-ewrl28ga`.
It retains baseline/candidate bytes and patches, prospective plan, profile,
all seven measurement pairs, original lint finding/correction, JSON test/lint
reports, tool session outcomes, archived scoped config, readback and manifest.
All recorded tool sessions are terminal. Profile PID4031754 and benchmark
PID4033621 are absent. Exact profile/baseline/candidate caches and the temporary
scoped config are absent; no cleanup failure remains. Root retains the required
packet and human2 through unfinished umbrella review, then owns exact cleanup
and worktree release. The packet is required diagnostic evidence, not disposable
staging data.

14/14 intended builds cleared Act I; 9/14 completed five-act Normal; formal
balance0/210. Five builds and broader economy/affordability/30–50-active-hour
pacing, higher difficulties/endgame, PWA/accessibility/performance and independent
acceptance remain open. No new agents, install, CI, commit, push or publication.
Browser works in WSL; there is no pending owner question or browser blocker.
