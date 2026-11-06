# BUG-550 — Support invested traps through late Normal defenses

2026-11-01. Severity: High. Status: physical-trap five-act route verified; broader balance/elemental variants remain open.
Owner: root (content, balance and QA). Affects Assassin trap build, rank tuning and campaign progression.
HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce; inherited dirty human2 worktree.
Environment: Node24.21.0 production-store simulation; browser, viewport and locale not applicable to this engine reproduction. Browser launching works independently.

## Historical pre-correction reproduction

1. Restore earned `p15-traps-act3-native-v2.json` from packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`. Independent `p15-traps-act3-readback-v2.json` passes. Actual25/XP50171/next300;17areas/31canonical Act II–III actions. Lightning Sentry20/CBS7/Fire1/Shock1;2free skill points, stat3/skill1 resets. Keep original Rogue23 and every paid socket.
2. Retained native Durance admission299 has runSeed533373627. Five preceding waves win; Mephisto kills the hero9240ms into wave5, with32646/33600bossHP left. Hero entered121HP; mana remains327. Preserve this failure and its income.
3. Run existing forecast-v12/launcher-v26 against that exact source and `p15-traps-act3-durance-controls-v1.spec.json`. It discards all income. Current investment loses wave4; fully funded owned party wards improve physical survival but still lose wave4. The discarded actual-party level28 projection reaches Mephisto, loses52360ms with29017HP left, and retains354MP. No native preparation or training was committed.
4. Check the existing immutable Lightning20 payload531–566 against the observed Mephisto50 Lightning resistance/MR138: ordinary unmodified pulses are127–145. The unchanged historical Baal observation in `p15-martial-act5-route-native-v4.raw.jsonl.gz` has57600HP/75Lightning resistance/MR243 and no resistPenalty: ordinary current pulses hit the1-point floor. This is a shared-data boundary calculation, not Trap/Baal earned acceptance. Existing `damage.ts` applies resistance before flat MR. Crits/other damage can differ; this ordinary-pulse calculation does not claim their damage is always1.

## Expected and actual

Expected: the advertised trap build has a viable paid damage plan through remaining Normal acts, while keeping rank1/unlocks/costs, finite autonomous trap identity and ordinary mitigation. Character growth/preparation should support progression rather than an unexplained capped-damage wall.

Actual: BUG549's narrow+6→24 correction and legal free reset clear Act II, but do not establish later-act damage viability. Current capped Lightning remains too small against later defenses; funded wards or three projected party levels do not supply a winning Durance route. Later progression is incomplete. No accepted trap-build workaround yet; more acquisition has not been justified by a winning forecast.

Suspected root: provisional trap rank curves were inherited from scalar placeholders and the Summoner-only growth adjustment did not cover late Normal mitigation. Diagnose the existing paid physical/elemental trap choices and full remaining-act damage boundaries before selecting another value. Do not mask this with per-boss branches, defense bypasses, injected points/rewards or unearned native levels. Preserve the existing source and all failed controls; use affected tests and a fresh exact-source whole-area qualification before any retry.

Evidence: packet source/readback/native gzip journal and Durance controls above, plus `bug549-source-audit-v1.json`. Current source866128d11212fd87ace8a9bc2c0df0628f3cddc2a2b0cfdd40719d319e4d4f69, data822083c67397a6de80747e3decf8549c6203a0e985e4f48818e614aade60270d. Root retains these through umbrella acceptance. This internal implementation issue needs no owner answer and is not an external workflow hold.


Proposed correction: [Blade Sentinel growth](../../docs/balance/2026-11-01-blade-sentinel-growth.md). Actual25 legal Blade20/Lightning8 reset and funded wards fail under current growth in p15-traps-act3-blade-before-v1.json. Preserve those failures. The correction targets the existing physical trap curve5→120, keeps rank1/payment/timing/mitigation and all other growth unchanged, and must pass direct RED→GREEN plus fresh exact-source qualification before a native action. This does not certify every elemental trap variant or the full balance grid.


Implementation checkpoint: Blade Sentinel growth5→120 only;168affected tests/scoped types/lint pass after13expected RED failures. Current-source existing-gear/free-reset plan qualifies and natively defeats Mephisto28.28s. p15-traps-act3-native-v3.json/readback-v3 pass, all Act III areas/actions complete. Root keeps this defect in progress through later-act validation and does not claim that every elemental variant or full balance has passed.


Five-act checkpoint: p15-traps-act5-native-v1.json/readback-v1 pass at actual33/XP52911/next405, all29areas/64canonical actions; all five final Claims/native Baal receipt verified, Baal49.64s. Original Rogue27/stat3skill0/all38paid contents owned. ActIV paid alternatives and two bounded earned preparations are retained; ActV39/39waves pass without more acquisition/tuning. BUG551 is a separate QA headroom-consumer issue; its saved12insertions were independently audited, never replayed. [Final evidence](../../docs/plans/evidence/p15-traps-earned-act5-complete-v1.md). Keep full elemental identity/holdout/balance acceptance open.
