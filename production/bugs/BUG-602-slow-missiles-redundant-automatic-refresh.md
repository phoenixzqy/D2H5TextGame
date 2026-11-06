# BUG-602 — Skip redundant automatic Slow Missiles refreshes

Status: fixed locally (uncommitted). Severity: Medium.
Found: 2026-11-02. Owner: root (engine-dev responsibility).
Environment: Node24.21.0, Vitest1.6.1, pure native engine; browser/viewport/locale
not involved. Base b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained
source authority66 and campaign manifest106 in the root evidence packet.

## Reproduction and evidence

1. Inspect the frozen `amazon-bow-survival-v1` pilot, creation1793304000000,
   Catacombs admission106, native seed3453207551, wave1.
2. Its paid Slow Missiles actions occur at1244,4976,8708ms: each refresh spends
   mana and an action before the preceding6000ms window expires.
3. Use seed7 and an unstunned learned Amazon in `projectile-impacts.test.ts`
   to reproduce without replaying the campaign.

Journal: `p15-bow-survival-fresh-act2-v1/amazon-bow-survival-v1.json.journal.jsonl.gz`
under `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The pilot loses Catacombs wave5 and then Dark Wood recovery wave5, ending at12;
this wasted rotation is observed but is not proven to cause those defeats.

## Expected, actual and cause

Automatic selection should spend the next action on available offense/basic
attack while every living hostile already has a paid unexpired window.
Instead `hasAvailableEffect` treats Slow Missiles as always available once
its shorter cooldown expires. P15's statement that this is already prevented
was incorrect. Workaround: remove Slow Missiles from the automatic rotation.

## Quick design refinement and implementation plan

Type: small behavioral tweak, no tuning. D04 says “Ordinary debuff refresh
replaces, never stacks”; that permits refresh and does not already prohibit
this behavior. Refine automatic availability: cast only when at least one
current living opponent has no private paid binding or its expiry is at/before
the action clock. Newly spawned opponents therefore allow an early cast;
an allowed all-enemy cast still replaces existing windows without stacking.
Do not filter by projectile capability or trust visible/imported markers.
No damage, cost, cooldown, duration, save/schema or default build changes.

Write focused failing rank1/20 and canonical/alias rotation/payment regressions,
then gate the shared selector at `hasAvailableEffect`. Cover expiry, offensive
fallback, forged markers and new opponents; reuse existing flight/lifecycle
checks. Run only these affected files, scoped strict types and ESLint.
Plan review: ready; all native Slow Missiles calls reach shared selection;
`castSkill` is private and no direct public/manual bypass is introduced.

Security check: pass. Scope: local first-party engine/tests/docs. Summary:
private paid authority remains required; no dependencies, credentials,
networking, privilege, grants or publication. Findings: none. Continue within
the existing root-only/no-install/no-commit/no-push/affected-check constraints.
This does not accept a build or change the full-v1 goal (balance0/210).

## Fix and verification

The shared availability check now reads private paid target bindings and skips
the cast only while all current living opponents remain covered. Seed7 RED
reproduces five rotation failures; the marker control and eight existing impact
checks already pass. After the fix,55 distinct affected cases have passing
evidence:45 in `bug602-green-v1.json`, four corrected rank/alias cases in filtered
`bug602-green-v2.json` (one overlaps), and seven display cases in
`bug602-display-v1.json`. The filtered run intentionally leaves ten unrelated
cases unexecuted; this is a composed result, not one all-green55 run.
The first GREEN's three failures were test expectations: aliases resolve to
the canonical action ID and native integer mana rounding charges8 at rank20.
Those expectations are corrected without changing resource rules. Scoped strict
types pass; ESLint v2 passes after removing a redundant narrowed test guard.
RED, initial GREEN and lint failures remain in the packet.

Authority67 independently enumerates2,141 production inputs; exactly
`combat.ts` and `projectile-impacts.test.ts` differ from66. All106 campaign inputs
and authored game data are unchanged. The collector's exact task cache is absent.
No commit is created under the user's current restrictions.
