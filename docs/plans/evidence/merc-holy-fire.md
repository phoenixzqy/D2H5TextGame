# Native mercenary Holy Fire — BUG-377

Native repair and native validation complete. Browser/earned feature acceptance
remains open.
Base: `3d6a2b1db8531a9f3856b4a4838380d0eea53dbd`.
Contract: [D04](../decisions/D04-merc-holy-fire-v1.md).

The advertised 8 Fire damage per second now comes from a passive, zero-MP aura,
flat at ranks 1–20. Its first pulse is at 1,000 ms, then every 1,000 ms, against
each living enemy. The actual factory-qualified signature mercenary retains its
sole skill bar and ordinary basic-attack fallback. Living Stun/Freeze does not
interrupt presence. The first eligible source in registration order supplies
the aura; duplicates do not multiply damage. That same source is revalidated
between recipients, with takeover only at the next global boundary.

Closed exact-row JSON/schema metadata and the immutable resolver replace the
active damage/Burn placeholder. Both locales describe the new native behavior.
The existing scheduler runs Holy Fire after Prayer and before Grim Ward, with
an immediate winner guard. The unchanged aura damage consumer preserves native
modifiers, resistance, Defense, absorption, minimum damage and shared downstream
consequences, including Frozen Armor Chill and Life Tap. Pulses draw no hit,
base, critical or proc RNG and add no Attack or inherited Burn. Fire mitigates
against Defense, not Magic Resist. No saved marker, clock, dependency, CI,
recruitment or generic damage-consumer change is introduced.

## Causal and public evidence

The independently approved actual pool → factory → projection/default-registry
primary was frozen against the committed Telekinesis parent before execution.
SHA256: `449d81c72e0361038ea22411a5bf66e95a30e726a22219eb461a52207e5706a6`.
At ranks 1 and 20, a held surviving real source must emit exactly four literal
8-Fire records: two living recipients at 1,000 and 2,000 ms, excluding a dead
recipient, with no source action, status payload or MP use.

Causal RED fails both cases before BUG-377 filing and production edits: no aura
hits, exit 1, 11.522770 s, unchanged 2,095-input map
`7f16a5c39f41bfb55ff744ae7ce7ab78882e3bf6a62b948a374b1dfd88aa31b1`.
An initial authored edit partially writes schema before its compact-JSON row
replacement assertion fails. The ensuing GREEN attempt collects zero cases;
it is invalid evidence and is not reported as passing. Exact authored row and
locale replacements correct the preflight failure. Unchanged-primary
GREEN-authored then passes both cases. Failed logs and edit lineage are retained.

Four new files add 91 cases: actual primary 2, resolver 37, combat 43 and public
lifecycle 9. They cover closed/copy-frozen tuning, catalog/default-registry
neighbors, factory authority and rejection, cadence/deadline, source and target
death, duplicates and takeover, scheduler ordering, flat ranks/Attack, native
mitigation and RNG, no Burn, shared recovery/Chill, basic fallback and fresh-wave
clocks. Public recorded-battle publication/playback converges for ordinary and
source-death cases; saved/input/recording remain immutable and deterministic.
Engine corpse statuses and empty playback corpse presentation are explicit.

The first focused run passes 268 cases and fails one: a manually forged Holy
Shock projection has invalid empty bonus keys, so the existing validator drops
it. Scoped lint separately rejects a combined heal/target filter that loses
the event discriminant. Independent review approves test-only corrections:
use the real rank-1 Holy Shock composer while retaining the no-native-hit/end
at 1,000 ms oracle and asserting the sole 20-Lightning hero hit; split the heal
filters while preserving exact 2-HP heals at 1,000/2,000 ms and final 104 HP.
The approved correction SHA256 is
`be881bb442adc42edfea6eb4f8e9c224457b53b81dc0770636d8218b650ed147`.
Production and frozen primary stay unchanged. Failed predecessors and the
independent correction review remain retained.

## Native gates

Final 2,099 permitted input map:
`26a57ba7809af4080297f856c050eacce86ea815505ee1849a359ccd559c94ce`.
Diagnostic workspace/protected paths are excluded before snapshot reads.
Corrected focused tests pass 269 cases across 9 unique files (33.246638 s), with
zero failed/pending/todo. Scoped lint passes with zero warnings (23.290773 s),
types pass (214.049328 s), and the boundary audit passes 1,009 test files / 1,596 source
modules (5.190984 s). Independent producer review verifies terminal results,
permitted report paths, exact correction bytes and unchanged input maps.

External production build passes (29.965205 s) on the same unchanged input map.
Large-chunk and generated-manifest precache warnings remain; this is not
performance or PWA acceptance. Engine passes 11,556 tests across 428 unique
permitted files (454.068347 s), zero failed/pending/todo, with unchanged input
maps. Full lint/engine purity passes with zero warnings (555.937338 s).
Independent producer approves terminal engine/lint receipts and permitted
report/input bindings. Audited ordinary units pass 21,436 tests across 1,009
unique permitted files (1,765.753169 s), zero failed/pending/todo. All before,
after and current 2,099-input maps match; the ordinary file count matches the
boundary audit. No broad gate is inferred from focused success, and the
historical full runner remains refused before reads/subprocess. Final independent
evidence and exact staged/committed parent/tree/blob reviews govern the local
checkpoint.

## Retention and unfinished acceptance

Root retains required sources/predecessors, logs/reports/maps, reviews and safe
runner through unfinished acceptance at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-holy-fire-l0hmmoq6`.
Root owns eventual exact-path cleanup. The disposable external build is removed
after terminal independent review and release by readers: 762 files, 42,296,689
bytes, 9 descendant directories, no links or cleanup failures; its exact root is
verified absent. All 26 recorded check child/driver PID observations are absent;
no process termination or cleanup failures.

BUG-377 stays Open for browser/earned feature acceptance. Player inventory
remains 212 bounded / one unverified. Campaign/economy/build/pacing/defeat-retry,
devices/locales/a11y/performance/PWA/actual CI/human/soak/full-v1 acceptance stays
open. H3 remains terminal failed-no-app: no app/browser/retry, protected fixture
access/replay, diagnostics/closed matrices, new acquisition/lineage/gameplay
replacement run, remote action, deployment or worktree release. The umbrella
goal and existing claimed worktree remain active.
