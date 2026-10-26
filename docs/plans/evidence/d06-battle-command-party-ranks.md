# D06 — Battle Command paid party-rank increment

Status: local paid-rank increment over `2a7e4600`. Full validation completed
with one source-identity refusal; its frozen rerun passes. BUG241 remains open, with no new skill
credit, independent approval, browser, earned-build or balance claim.

[Provisional full contract](../decisions/D06-battle-command-v1.md).

## Implemented and observed

- Strict JSON/schema ownership replaces the generic indefinite self buff with
  one dedicated party-rank effect. JSON duration is8000ms plus500ms/rank above
  one, bonus1; existing cost/CD curves and ordinary rounding are retained.
- Native class/unlock/transitive prerequisites project Command independently.
  A real paid cast creates private battle-local bindings for current living
  player allies. Markers/imported bonus fields cannot create these bindings.
- Current eligible learned active ranks gain1 during [cast,expiry). A learned20
  becomes21, an unlearned hero skill keeps its existing unboosted fallback,
  and allocation maps are unchanged. Nonstacking, alias cooldowns, invalid MP,
  dead allies and later summons are covered.
- Leap, Concentrate and Battle Cry capture `rankBonus:1` separately from their
  paid rank. Effective21 is valid with this provenance; ordinary21 without it
  remains invalid. Leap/Concentrate potency survives copy/fractional rebase and
  absence of a live Command/learned allocation until its own finite expiry.
- Rank1/2/20 ×seeds7/19/41/97 actual production Command casts raise caster and
  allied diagnostic Fire10->20 during the interval, then return to10. Matched
  inert casts preserve payment/action/RNG controls. Fixtures are synthetic,
  with native legal Command configuration; they are not earned-party evidence.
  Recordings preserve input and replay exactly; playback resources/active
  status views match the engine, including the later summon case.

## Validation so far

Original actual-skill RED:5failed/one native prerequisite control passed.
Additional REDs exposed native effective21 crashes in all three paid consumers;
the original assertions are retained and pass after provenance support.
One intermediate source typo used an out-of-scope variable in the Battle Cry
branch; the causal check caught it and it was corrected. A new negative-control
test initially demanded a landed hit at a seeded dodged timestamp; it now
requires nonempty landed hits across the active interval and checks every
landed amount, preserving seeded dodge behavior.

59new tests total:25definition/schema,12causal/native,20captured-rank boundaries
and two paid copy/rebase cases. Focused183/6 PASS. Final engine8453/314 PASS,
145.86s Vitest/147.053s process. Production build PASS16.969s; strict Ajv2020
accepts all213skills/seven classes; actual755-URL offline-precache guard and
five-chunk bridge scan with positive/negative controls PASS. Existing chunk-size,
Browserslist-age and generated-art manifest precache warnings remain unchanged.
No limit was relaxed.

The final type check found an exact-optional-property error in the new UI
fixture. It was corrected with explicit zero defaults for absent native ranks;
production source and engine tests stayed byte-exact. Repository lint/purity
passes222.35s; the corrected test-file lint also passes. Corrected whole type
check passes159.562s. Do not treat the earlier
pre-captured-rank type check as final coverage.
No assertion weakening, new skip, retry or timeout change was made. The `-t`
diagnostic RED selected only three tests; its six filtered cases are not new
source skips. `npm run validate:data` does not exist; the recorded strict Ajv
validator checks the actual repository schema and all authored class files.

Full unit attempt:16990passed/one failed/two existing skips,763passing files
and one failing file,826.45s Vitest/828.049s process. The restored-mode contract
correctly refused source identity drift while a separate new passive test was
installed/strengthened during its measurement. Its collection includes all
untracked files under `src`; freezing only the19 implementation/test/contract
paths was insufficient. All19 remained byte-exact, and the unchanged failing
file passes with the complete source held still (one test,11.326s process).
This is a workflow error, not evidence of a gameplay failure or a green full
run. Future measurement/full runs must hold the entire collected source still.
The new passive test is a separate next increment, not part of the earlier
764-file discovery or this paid-rank implementation's acceptance claim.

## Review and remaining work

Author review confirms the dedicated effect, private paid bindings, unchanged
learned authority, bounded maps and pure engine dependency direction. It is
not independent signoff and does not approve the full skill for acceptance.

Remaining BUG241 work: native passive profile application/removal with final
life-capacity/recovery/action-phase handling; effective corpse recovery/search/
ward ranks and their paid metadata/settlement; native fresh-authority refresh
and qualified cross-wave remaining-interval carry; other specialist consumers
where reachable; bilingual details and production mobile/desktop save/offline
verification. Current registration intentionally rejects carried bare Command
markers; qualified paid carry is not implemented yet. Current synthetic active
tests do not prove native passive, resource, carry or UI behavior.

Inventory is unchanged148bounded/63unverified/one engine-only/one review-needed;
Barbarian29/30. Genuine Ancients401 remains untouched. C2 and full privatev1
remain unfinished. No campaign, remote, PR, push, merge or deployment action.

## Retained diagnostics and completed cleanup

Archive:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-battle-command-qtsp4boh-retained.tar.xz`.
SHA256:`98886987e9a4ebfeb63f49b80e7abb4a46a4d09c4f833b2a34d68017a0d014bd`.
All54 retained regular members were byte-verified, including original REDs,
the failed full attempt, stable rerun, source/build manifests and terminal receipts.
Cleanup receipt:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-battle-command-qtsp4boh-cleanup.json`.
Root owns both retained paths until BUG241/full-v1 evidence consumers finish,
then removes them.594exact scratch files/seven directories were removed;
21recorded PID/start identities absent, scratch absent, remaining[]/failures[].

Production build disposal is complete:761files/10directories byte-verified
against the retained hash manifest, removed, and exact `dist` path absent.
Full unit session9220/PID3598764 exited1 and its terminal result was collected.
Stable mode rerun session5605 exited0. Corrected type
session66873/PID3598766 exited0 and its terminal result is collected.
Repository lint session13738/PID3590100 exited0
and its terminal result was collected. Completed test-file lint session2614 exited0.
The existing umbrella worktree claim remains in use by this root session.
