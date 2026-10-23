# Earned mercenary levels now advance combat statistics

2026-10-23; BUG095, implementation base `6b3e351`.
The authored level-3 Rogue previously reached level16 with higher core/HP but
retained hire-level Attack25, DEF26, speed122, mana capacity79 and dodge.094.
Shared bare old→new formula deltas now advance those five values to70/65/161/
150/.172, keeping existing class HP policy, saved offsets, current mana and MR.
Equipment continues to project exactly once over the unequipped saved baseline.
Both XP crossings and upgrade use the same transition. Canonical upgrade progress
advances its threshold; custom thresholds/XP remainder and missing entries retain
their contracts. Nonfinite statistics or XP arithmetic reject before publication.

Validated decode and positive XP/upgrade repair only a completely identifiable
historical catalog hire: known ID (including instance suffix), positive earned
level difference, exact class/fallback-grown core and lifeMax, and all five hire
cache values. Only those five fields refresh. This compatibility rule is immutable
and idempotent; unknown IDs and modified histories remain exact.

The reproduction first failed on real factory/store earned L3→L16 progression.
Independent QA supplied18 additional cases (five historical failures before the
repair,13 controls). Producer review found XP arithmetic overflow: three new
regressions failed with70 controls passing, then passed after atomic guards.
Ten pure-engine cases cover raw growth, soft/hard caps, floors, zero-delta exact
values, invalid grants and nonfinite output. Existing earned equipment/combat
oracles were corrected from L3 frozen values to actual L6 values; pure custom
saved-baseline equipment tests retain their original assertions.

The production browser imports the byte-for-byte genuine native106 W4 checkpoint
from the retained earlier-boundary attempt, before its deferred failed-wave
settlement. Input SHA256:
`6d3803b9e09585e941967e7628089967f2fd6e7bfd2b01a2e16dd84cd2f4fa2e`.
The fixture is unchanged. Complete disk/export equality requires exactly five merc
fields to change; it protects the player's full contents, all3915 unique owned
items, gear, XP, configuration, life252/252, current mana79 and MR0. Capacity becomes
150 without refilling mana. Ordinary locale controls, explicit Save, page close,
new-page Continue and exact continued disk/export are checked for en/zh-CN at
360×640 and1280×800. Roster screenshots show L16/STR25/DEX61/VIT16 and XP6497/49138;
combat derived values are proved by ordinary exported saves, not roster labels.

Final frozen validation: **8678 tests / 281 files pass, 192.54s; engine4222 /
109 files passes, 36.87s; typecheck and full lint pass**. The clean production
build passes with VITE_E2E unset; all four JS chunks pass the forbidden-bridge
scan. Final ordinary-control browser cases pass2/2 in38.516s, zero retries,
skips, flaky cases or page errors. Source779files and build760files match their
frozen manifests after the runs, with no drift. Existing large-bundle/precache
warnings and repository test-time budget overruns remain open.

Validation corrections are retained honestly: the first full runtime suite
passed8678/281(198.79s), while readonly fixture assignments and lint syntax still
failed static checks. Those were corrected before all final frozen validation.
The first browser batch passed2/2(46.8s); the final batch uses a clean rebuild
following the finite-check syntax fix. A nonempty-output rebuild was excluded
from final build proof because it retained old chunks.

Producer source/security review APPROVE; independent QA source/test review APPROVE.
A separately reviewed fresh campaign remains necessary for C1. This scoped fix
establishes no Andariel victory, fresh ActI completion, campaign pacing or C2–C4/
G0–G7 acceptance. Full private-v1 scope remains active.

Root retains required raw input/provenance, scripts, reports, logs, screenshots and
source/build hashes at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-growth-p0ei0ryu`
through dependent C1/full-v1 consumers, then removes them. All processes are terminal and readers released. Exact disposable tmp/cache/
dist/browser-output cleanup succeeds; remaining[]/failures[] and preview38967
closed, recorded in cleanup.json.
The independent QA draft was archived here and its exact original temporary
directory removed; `qa-draft-cleanup.json` verifies remaining=false/failures[].

Reproducible browser harness: [spec](fixtures/bug095-growth.spec.ts.txt) and
[config](fixtures/bug095-growth.config.mjs.txt). Required raw input and retained
paths above are owned by root; no push, PR, merge or deployment.
