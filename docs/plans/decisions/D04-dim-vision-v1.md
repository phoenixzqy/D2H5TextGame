# D04 — Dim Vision finite blindness

2026-10-26; BUG253; provisional root-author v1 adaptation. Independent design/review/QA and earned balance remain open. Root is sole writer/executor in the registered umbrella worktree. No genuine campaign/replay or remote publication.

## Overview and player fantasy

The native paid curse must impair enemy attacks. The game has no movement, range or visibility grid, so translate the sight promise into finite accuracy loss, using the existing shared hit-chance boundary. This adaptation provides a defensive accuracy choice without stopping actions or changing damage on successful hits. It does not add sight-based target immunity.

## Detailed rules and formulas

1. Keep real Necromancer ownership, level6 unlock, learned integral ranks1–20 and explicit combo selection. Preserve all current aliases and all-enemies targeting; only living current hostile targets receive a paid application.
2. Preserve JSON cost9−0.2×(rank−1)MP with existing rounding/clamp, cooldown3−0.05×(rank−1)seconds with existing one-decimal rounding and ordinary>=1s floor. Paid effective ranks retain existing Battle Command ownership; this constant potency does not grant unlearned authority.
3. Add JSON-owned duration3000ms and Physical-hit chance reduction50percentage points, constant per rank. These are explicit provisional author choices, not recovered D2 or earned-balance results. Keep one finite `dim-vision` status, with immutable copied paid potency and [onset,expiry) timing. A refresh replaces source/interval without stacking.
4. For direct Physical/Thorns hit resolution, subtract0.50 from the existing shared hit probability before its normal clamp. Raven blind and Dim Vision combine by their strongest penalty, not addition. Successful damage, crits, resistance/Defense/MR and dodge processing keep their existing rules. Other direct types, existing DoT and reflected HP loss receive no new accuracy roll or penalty.
5. All tiers use the same soft-accuracy duration; no hard-CC immunity or boss timer is invented. Existing Cleansing may shorten the finite interval. Expiry acts before an action due at that time. Caster death does not revoke a paid curse.
6. Bare/invalid/future/expired/nonfinite/overlong or wrong-potency markers confer no new accuracy power. Native/current copied status playback and wave rebasing must preserve valid finite potency. No new save field/version, RNG draw, action/timer or resource grant. Do not persist temporary allocation.

## Presentation and edge cases

Keep Dim Vision's own localized status identity. Explain three seconds and50percentage points of Physical/Thorns accuracy loss in zh-CN/en; successful-hit damage and spell accuracy remain unchanged. Current/next/MAX details must show actual duration, penalty, cost and cooldown. Verify keyboard detail/combo use, actual localized cast/status/combat and exact public save/close/Continue at360×640 and1280×800. Imported diagnostic pools are unearned scaffolding; screenshot inspection and offline/device/a11y limits must remain explicit.

## Acceptance and implementation order

1. Retain the real native rank1/20 RED (paid casts/statuses but identical700HP loss), original source and unavailable/poor-MP controls before production edits. File BUG253 first.
2. Add strict schema-owned metadata, complete validated immutable definition and definition tests in a <=5-path buildable increment. Use existing load-time Ajv patterns; no TypeScript tuning default. The package has no validate:data script, so record actual validation commands.
3. Connect canonical registration/payment/status copy/finite consumer to shared accuracy with focused boundary, refresh, duplicate, Raven overlap, all seven types, invalid payload, Cleansing, recorded/plain/A-A/A-B-A/input immutability and native causal controls. Keep each increment <=5paths and no unrelated refactor.
4. Complete truthful bilingual previews, native lifecycle/import and production browser proof. Run focused/engine/full/typecheck/lint/official production build/bridge/precache at the combined handoff. Retain every failed/corrected attempt and exact task-owned cleanup. Grant no full-skill or inventory credit from an isolated engine increment.

## Tuning and dependencies

Duration/penalty are authored feel/curve knobs, unlock and existing resource/rank rules are gates. Schema requires positive finite duration and penalty strictly between0 and100; malformed or incomplete canonical definitions fail before runtime. Data/schema/types -> immutable definition -> registration/paid status -> shared hit resolution -> preview/native/browser evidence. No new dependency, global tuning, blanket status alias, corpse system or campaign action.

## Author plan and security review

Plan review: ready for local implementation with the numeric adaptation explicitly provisional. Shared hit resolution fixes the missing consumer once; retaining its own paid finite identity avoids aliasing away Cleansing/status feedback. Validate successful-hit damage and Raven nonstack controls, rather than counting markers as proof. Security check: pass for first-party local source/data/tests; no credential, network, dependency, CI, permission, decoder relaxation or persisted authority changes. Author review cannot substitute for independent acceptance. Remaining skills, earned builds/pacing, C2–C4/G0–G7 and complete private v1 remain open.

## Local outcome and remaining acceptance

Combined implementation `7b27fb04` satisfies the bounded local contract:89focused regressions,engine8,986/337,full17,874/819/two existing opt-in skips,final types/lint/official build/bridge/precache and production4/4pass. Eight exact seven-domain online/offline save pairs and all eight individually inspected PNGs retain explicit geometry/device/capture limits. [Final evidence](../evidence/d04-dim-vision.md) records originals,all25terminal receipts,source/build hashes,lossless retention and exact cleanup. Exactly one bounded skill credit;independent design/review/QA and earned balance are still open. This provisional adaptation does not establish full-v1 acceptance.
