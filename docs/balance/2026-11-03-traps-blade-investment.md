# Intended Traps — earlier Blade investment

Historical policy note: the later
[BUG651 correction](2026-11-03-traps-late-blade-allocation.md) appends Blade20
after these original targets. References below to unchanged final ranks apply
to the earlier BUG636 change only; its earned evidence is preserved.

BUG636 is fixed/verified for one declared earned Act I route. Twelve of the
fourteen intended builds now have individual Act I clears; Javelin and Zeal
remain. Full private v1 and formal balance acceptance remain incomplete.

## Change and focused checks

Only the Traps target order in `tests/campaign/intended-growth-v1.json` changes:
move the existing Blade Sentinel 8 target before Charged Bolt Sentry 12, below
Lightning Sentry 20. Both level-12 rank-one foundations, all final ranks,
rotation, stats, owned gear, training, reset and retry limits remain intact.
No production runtime or authored-number change.

The retained baseline fails Catacombs130 W5 at level14 with Blade1/CBS5 and
minimum250Mana; an elite retains711Life. Authored rank growth is120 versus4.
Three focused RED cases reproduce delayed investment. The initial proposed
direct-XP expectation Blade3 was unverified; native baseline CBS4/Blade1 shows
the conserved level14 candidate must be Blade4/CBS1. That expectation was
corrected before the candidate. Seven affected checks then pass,126 unrelated
cases excluded. They cover sequential/batched native allocation, points,
idempotence, unchanged domains/final targets, paid repeated physical/lightning
field delivery and existing Traps identity/signature/registry checks.

Scoped strict types and explicit lint pass. The first external type config
cannot resolve `vite/client` from the external packet; its failure is retained.
The corrected config resolves native types from the worktree and includes the
repository Vite declarations. No application source or compiler strictness is
changed; no campaign is run until all checks pass.

## One native campaign and independent readback

External packet (root-owned through umbrella review):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Plan/source/checks use prefix `p15-traps-blade-investment-v1`.
The canonical `collectCampaignManifest` freezes all131 campaign/contract inputs
from the start. All2151 production inputs remain unchanged, production tree
`12ce40578164070e187a017daa00c91d15a209bacbd258f17817bfea94e1a88d`;
exactly the growth JSON and its regression test differ from this trial's baseline.

`p15-traps-blade-native-v1/assassin-traps-intended-v1.json` completes Act I at12:
107admissions,310waves,310wins,zero defeats. First Catacombs106 clears all six
waves. Final ranks: Blade3/CBS1/FireBlast5/Web6. No native skill/stat reset.
Logical combat2019980.3253545058ms (~33.7min), native driver22653.815652ms,
launcher37436.521379ms. Earned XP179306;3019added/2920removed items.
Blade casts37 and CBS24 are individually paid; actual physical/lightning
damage is observed. No retries, seed search or limit extension follows.

`p15-traps-blade-readback-v2.json` passes full journal/native-save/custody/
economy/clock/seeds/training/point-payment reconciliation without combat replay:
11stat and14skill allocation transitions. V1's preserved failure incorrectly
equates reaching12 with already having learned both fields. Native XP can cross
12 mid-admission, before the next allocation boundary. V2 checks exact paid
projection when learned and rejects authority/order when unlearned; other
accounting assertions remain intact. The original pre-run reader and plan are
preserved alongside `p15-traps-blade-readback-v1-failure.json`.

Separate terminal native export, next ordinal107:
`p15-traps-blade-native-v1/assassin-traps-intended-v1.native-export.json`,65676bytes,
SHA256 `8d2d2c1f41d79f0cc5649fb037793e52e8cdc502a4fb52a96dfdb6e6094729c9`.
The main Corpse/Bone75/NormalV19-of-19/next1658 successor is unchanged.

This establishes one earned route, not a population or balance result. Formal
0/210 (14builds×5acts×3encounter roles), later intended progression, pacing,
economy, recruitment, fairness/adaptation/manual-idle/defeat-retry, remaining
Hell/endgame, mobile performance and integrated review/soak/owner playtest remain.
Browser works; CI is excluded; no pending question or external blocker.
No agents/installations/commits/pushes/publication or unrelated checks.

## Cleanup and continuation

Closure: `p15-traps-blade-investment-v1-closure.json`. Remove only this task's
external scoped type config after validation; retain its exact contents in the
closure evidence. Verify native processes terminal, owned Vite cache absent
and all frozen inputs unchanged. Root retains the required packet and claimed
human2 worktree through umbrella review and owns eventual cleanup/release.
Next inspect retained Javelin/Zeal failures before a bounded correction; do not
rerun completed builds or acts.
