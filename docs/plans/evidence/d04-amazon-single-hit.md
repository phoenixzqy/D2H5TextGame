# D04 — Four Amazon single-target attacks

Source correction `6ac13aa2`; public tests `121fd691`. Root author evidence,
not independent approval. Contract:
[D04](../decisions/D04-amazon-single-hit-v1.md); defect:
[BUG283](../../../production/bugs/BUG-283-explain-amazon-single-hit-skills.md).

Magic Arrow, Lightning Bolt, Fire Arrow and Cold Arrow already produced their
authored native effects. Generic description selection discarded their targeting,
payment, weapon and status explanations. The correction selects truthful en/zh-CN
copy using existing values. No engine tuning, new affliction/equipment gate,
save migration or campaign action was needed.

## Focused evidence

Original final RED:40 preview failures/39 passing native controls,17.228s.
Final GREEN:52 UI tests/two files,13.000s (40new plus12Plague controls);
39 native tests,10.146s. Focused strict types10.880s/source lint14.124s and
final native lint9.053s pass. Native cases cover canonical bow equip,
class/level/prerequisites, exact mana, rank1/20 HP, miss/payment/cooldown refusal,
typed resistance/mitigation, dead/lethal targets, deterministic replay and
runBattle parity. Fire refresh/cap retains source/rate; Cold checks actual
scheduled actions and expiry, preserving raw attackSpeed100.

Literal seed7 rank1/20 damage: Magic35/111, Lightning51/146,
Fire36/112 (periodic9/33), Cold36/112. An initial external draft expected
Magic36/112 incorrectly; seed7's0.06195825757458806 roll gives35/111.
Initial external JSX setup, readonly-snapshot type errors and the stale Chinese
Burn oracle were corrected in tests/setup. Original failures remain retained;
no runtime assertion was weakened or skipped.

## Public production evidence

`amazon-browser`:4/4 pass,0skips/retries/flakes,160.115s runner/158.866s
Playwright. English/Chinese × Chromium desktop/Pixel5. Constructed level90
Amazon uses ordinary create/import/equip,19→20/MAX, priority selection, actual
Catacombs casts and positive typed enemy hits. Fire shows Ignite/点燃 plus
positive enemy DoT; Cold shows Chill/冰冷. Observed damage in each context:
Magic106Arcane,Lightning134Lightning,Fire57Fire+4DoT,Cold117Cold.

Public Pause/Flee/Save/close/new-page/Continue verifies eight exact seven-domain
save pairs and four actual service-worker offline Continues. Twenty geometry
samples/context cover360×640,412×915,640×360,1280×800,1920×1080 with44px
allocation targets and no document overflow. No production `__GAME__` and zero
console/page errors. Public types12.286s, explicit `--no-ignore` PWA lint10.158s,
production build16.411s, six-JS-chunk bridge scan and actual756-URL precache pass.
Existing large-chunk/2.57MB manifest-precache warnings remain; no performance
signoff is implied.

Twelve original mobile screenshots were individually inspected: eight previews,
two Fire combat and two Cold combat. Preview text is readable; living Bone
Warrior A shows the localized Fire/Cold chips. Lower panel/grid edges are partly
cropped, so these are not full-screen/all-content visual proof. Actual positive
hits/DoT are asserted in preserved DOM JSON. Existing navigation clipping and
the shared Chinese damage-log “普攻” wording remain outside this correction.

## Integrated checkpoint and retention

Full checkpoint against `121fd691` is terminal: types113.204s,lint259.846s,
unit18607passed/860files812.782s; two existing opt-in campaign economy/continuation
skips. All1677explicit inputs read back exact after terminal checks before the
following guaranteed-hit source increment. The earlier18528 result covers the
preceding Plague snapshot. No result validates later source changes implicitly.

All370raw archive members were read back and SHA256-verified;1897exact task files
and39directories were removed. Both task-owned production builds and caches are
absent; remaining[]/failures[]. Root retains the archive and two sidecars through
full-v1 evidence consumers and independent review:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s-retained.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s-retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s-cleanup.json`

Archive SHA256: `3403426cd88314c54d3dff91a6c179dc26ef496b57fb570c6ed287be3e3b303e`.
The archive supersedes earlier raw-task paths. Exactly five combined credits
(Plague plus these four attacks) yield179bounded/32unverified/one engine-only/
one review-needed. All208other raw CSV rows/header/order/IDs remain exact.
[Packet](fixtures/amazon-single-hit/packet.json) records receipts and reconciliation.

Genuine protected save remainsL33,Ancients/Rite claimed,Baal uncleared,next402;
compressed SHA `3bbae6c0499844e7423574124326c65c616f8f3912a760aa913ea9eab410022c`,
raw SHA `c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
Inventory is179bounded/32unverified/one engine-only/one review-needed.
Constructed fixtures do not establish earned builds,balance,independent QA,
full mobile/a11y/performance acceptance or completed privatev1.
