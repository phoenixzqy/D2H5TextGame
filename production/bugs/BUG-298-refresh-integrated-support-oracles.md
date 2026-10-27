# BUG-298 — Refresh source-backed integrated support expectations

Status: Source-backed expectation corrections implemented in 5bd46eb7 and 9ff772cc; focused regressions pass. Combined broad gate remains pending.
Severity: Medium — stale integration expectations prevent the combined gate.
Affected systems: qa-engineer, engine-dev, content-designer.

## Reproduction

Build: 809afe9a46d6ad1b9f239598e17a346e435d630e. Vitest Node/jsdom, no browser
viewport. Seed7 for the constructed Skeletal Mage integration fixture; en/zh-CN
for log copy. No earned campaign action or balance claim.

1. Run the full workspace against unchanged repository inputs and HEAD.
2. Observe one loader, four localized status and one Mage integration failure.
3. Reproduce the Mage file separately with unchanged assertions.
4. In a separate diagnostic process, remove only opt-in projectile travel from
   the registered enemy effects; all three original Mage tests pass again.

Expected: complete authored Amazon Inner Sight passes its own paid schema;
its newly localized status has literal bilingual expectations; Mage checks
retain precise deterministic outcomes under actual impact-time RNG settlement.
Actual: the loader fixture deletes required payment/effect metadata from a
mercenary row renamed as Amazon; four log cases classify the now-localized
`inner-sight` as unknown; the Mage second wave expects pre-flight RNG outcomes.

## Evidence and diagnosis

Root-owned task:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_.
`slow-missiles-integrated-full.log` retains all six failures. The owned run was
intentionally stopped with SIGINT after diagnosis (323.492s, exit -2), not passed;
all2490inputs/HEAD stayed exact. The stop reason and exact owned PID are retained.
Full types148.188s and lint231.754s passed before any repository change.

Mage isolated reproduction: one failure/two controls PASS,8.435s. Diagnostic
pre-flight control: three PASS,8.311s; no product override or assertion edit.
Two task-owned wave-two JSON traces retain complete inputs and recordings.
Enemy Fire Bolt launches at1820ms and now lands at2320ms, after Mage actions at
1940ms. Cold Mage hits58 at1940ms and misses at3880ms; the final finisher now ends
combat at4000ms. Final hero mana687/exact carry0.244 replaces694/0.888 because
combat ends earlier. First-wave literals, payment, resource carry, immutable
publication, one-time settlement and replay controls still pass.

Controlling sources: D04-slow-missiles-v1 and Proposed ADR-012 require impact-time
RNG; amazon.json and the exact Amazon schema require paid finite Inner Sight;
both combat locales explicitly translate `inner-sight`.

## Correction boundary

Use the real authored Amazon row and retain malformed/foreign-status rejection.
Move the exact Amazon status into literal known-name checks while retaining
genuinely unknown-ID fallback checks. Update only the proven Mage literals and
add exact launch/impact/end-clock checks. Do not relax schemas, skip tests,
change RNG, remove flight metadata in production, or claim independent acceptance.

Security check: pass. Scope: local first-party fixture/copy expectations and
diagnostic traces; no credentials, dependency, networking, CI or save changes.
Root author plan review: ready with the paired pre-flight control and complete
trace. This is not an independent gate. Full integrated acceptance remains open.

## First correction and engine catalog subcase

5bd46eb7 updates only the three diagnosed test files. All409tests/3files PASS,
16.807s; scoped types8.755s/lint10.160s PASS. Schema and gameplay are unchanged.

The subsequent complete engine run reports9852PASS/onefailure across376files,
561.523s, all2491inputs/HEAD exact. Its sole failure is
`act1-lightning.test.ts` requiring every registered monster stub to be the original
object reference. Authored projectile decoration intentionally returns a copy;
unmarked stubs retain identity. This is not an engine-green result.

An external unchanged-gameplay correction probe keeps reference checks for
unmarked stubs, compares every field plus JSON flight for missiles, and checks
the original stub array is unmodified. All31Lightning tests PASS,4.339s, with
repository bytes/HEAD exact. Promote this source-backed expectation; preserve
the original failure and run the combined gate again. Do not remove flight or
relax damage, cooldown, RNG, affix, status or ordinary Lightning expectations.

## Current local proof

See [Slow Missiles evidence](../../docs/plans/evidence/d04-amazon-slow-missiles.md) for permanent regression paths, production/public/lifecycle results and honest interrupted broad-check boundaries. No new inventory credit or independent acceptance is claimed.
