# P15 — Duriel passive Frost Aura

2026-11-04. BUG-734 is fixed in the working tree. Duriel now authors a passive
15-base-cold pulse every 5000ms, starting at 5000ms, with 2000ms Chill to all
living effective player units. The wave-local scheduler uses ordinary damage,
mitigation, shields, status and death settlement without misses, crits, RNG,
action payment or cooldowns. Source control does not suppress the passive;
source death or loss of enemy allegiance removes its schedule. Both native and
chapter skill lists retain Charge and ordinary attacks. Frozen Terror's shared
active Frost Aura remains unchanged. Transient metadata needs no save migration.

## Verification

Native manual/idle RED precedes the correction: `native-red-v2.*` contains two
genuine missing-pulse failures; `engine-red.*` contains four. The earlier
`native-red.*` failed on an unsupported cache flag before running tests and is
not behavioral evidence.

Final focused run: **28 passed**: passive engine20, native Aura3, native Freeze3,
Act V shared-skill controls2. Exact twelve pulses through the inclusive60s
boundary, party Chill/cadence onset and expiry, Charge/basic actions, immutable
inputs and recorded/plain/repeat parity pass. Controls cover mitigation,
dodge/crit/Attack independence, ineligible/invalid sources, absent passive
authority from markers/skills, exact-once target death, and poison source death
at5/10s before a tied pulse while another enemy survives. Schema/factory copy
and unchanged native HP25600/Attack220/Defense280 are checked. Shield behavior
uses the existing pipeline; this run adds no independent shield regression.

Scoped strict types pass with zero diagnostics across909reachable files; scoped
lint passes. Initial test-only narrowing/matcher diagnostics remain in the
packet alongside successful v2 results. No gameplay changed after the green run.
No broad suite, build, population, acquisition, holdout or campaign replay.

Chromium desktop1280×800/zh-CN/manual and mobile360×640/en/idle both pass with
the native Tomb enemy and synthetic durable party. All three role cards show
localized Chill at5s and remove it at7s;36cold events have15damage without
crit/dodge and no Aura action exists. No horizontal overflow, console/page
errors or failed requests. Role/viewport screenshots were inspected. The first
browser harness failed because it tried to advance paused playback; v2 resumes
before advancing. Preserve the failure; no production workaround was added.
Header/location, synthetic character presentation and broader mobile UX are
outside this diagnostic's acceptance scope.

## Review and retention

Root's five-axis code review finds the fix consistent with the prospective
[contract](../decisions/P15-duriel-passive-frost-aura-v1.md): bounded metadata,
original-source eligibility, immutable tuning, stale-deadline deletion and
shared damage/death handling. Readability and architecture follow existing
ambient pulses; no dependency, credential, network or permission changes.
At most12native pulses/source under the60s deadline. Automated evidence is
adequate for this local mechanic; independent final QA remains outstanding.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-passive-aura-oow7i3w5`.
Retain RED/GREEN/check logs, browser v1/v2 results/native recordings/screenshots,
17source snapshots and their SHA256 manifest. Twenty-one of24native Tomb
battles were used; constructed regressions and Act V controls are separate.
`cleanup.json` verifies exact browser/wrapper PIDs30955/30946/31523/31522 absent,
both servers closed/caches removed, no remaining disposables/failures. The
packet is approximately1.4MB, below8MiB. Root keeps this exact evidence through
unfinished full-v1 acceptance, then removes it after all consumers finish.

BUG-732's active-Aura restoration is superseded by this passive contract; its
historical failures and successful verification remain intact. BUG-731 stays
open. The older cross-build screen predates BUG-732/733/734 and cannot establish
current-source acceptance. Counts remain14/14recorded Normal clears,
210/210supplemental source availability, formal balance0/210. Full privatev1
remains active/incomplete.
