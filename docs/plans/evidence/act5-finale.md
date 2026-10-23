# Act V finale: Rite, Throne, Baal, title and Nightmare

2026-10-23. Production browser tests pass en/zh-CN at360×640,412×915,
640×360,1280×800 and1920×1080. The input is
the exact actual [Prison/services export](act5-prison-services.md), retaining
its explicitly constructed-power ancestry. This proves bounded functional
behavior, not earned campaign progression, build viability, pacing or C2.

## Proven flow

The ordinary Ancients challenge defeats all three guardians. A separate Rite
Claim grants15000heroXP and one skill point; Save→close→new-page Continue
preserves the result. The test keeps the existing act-wide Enter policy.

Two real interrupted Throne runs distinguish transient sequence progress from
durable quest proof. After four victories, wave5 is installed, playback is
paused and the player flees: no Throne/Baal receipt survives Continue. A new
run begins atwave1. After five victories, wave6 is installed, paused and fled:
the Throne receipt persists, but Baal remains false and no title/Nightmare
entitlement exists. The test checks the exact counter, paused state and
enabled Skip before Flee, failing if another wave has already advanced.

A new eligible canonical Baal victory supplies its separate receipt and
completes Eve. It grants no quest cache/title/Nightmare until explicit Claim.
Claim alone grants40000hero/30000mercXP and the actual deterministic
`loot/baal-q`,ilvl82,five-pick cache. The production Node oracle and browser
agree on payloads/currencies; only newly allocated item IDs are ignored in
payload comparison, while noncollision and uniqueness remain required.
Both observed caches contain three new unique items and two rune shards.
Repeat eligible Claim is unavailable and changes no persisted domain.

The title entitlement does not automatically select a title. Ordinary Town
selection changes only `selectedTitle`, updates the nameplate and survives
Continue. Ordinary Nightmare selection changes only difficulty. A real
Nightmare Bloody Foothills victory shows authored area level+20, advances
only the Nightmare ordinal/clear book, preserves Normal quest history and
earns positive XP. Returning to Normal changes only difficulty; Continue
preserves all prior state. This does not calibrate exact Nightmare XP/loot
or certify every replay scaling rule.

Every persisted barrier compares player, inventory, map, mercenaries and
formation exactly. Independent QA decoded all eight staged save attachments
per case (80 total) and confirmed all956 input-owned literal items, prior quest
items/services/receipts and formation remain represented in the final saves.
No checked control is undersized, horizontal overflow or browser error is
observed in these ten cases. Screenshots are retained but were not manually
inspected by the independent reviewer; manual screen-reader acceptance remains open.

## Validation and artifacts

- Browser:mobile2/2PASS,107.171s, plus remaining-sizes8/8PASS,464.786s;
  combined10/10, retry/skipped/unexpected/flaky0, global errors[].
- Report SHA256:`ad046186467b8aaf3b13ff513aee19b166284720337c5fb89a944feca9e79168`.
- Remaining-size report SHA256:
  `f8411651d3fa2740a7f6877f7e444a7405442865cf5d1dd7dd796e9e1b10c266`.
- Typecheck and explicit scoped PWA lint pass. Runtime/build remain unchanged
  from the accepted Close correction, with741source/760build/3harness hashes
  independently verified. The previous full10070unit run is documented in
  the Prison evidence; this test-only addition is not a new full-suite run.
- Independent QA:ADEQUATE for all ten bounded cases. The Rite
  delta is covered by reviewed passing assertions; only its postclaim save
  is attached, so the artifact alone does not supply an independent XP pair.

The [summary](fixtures/act5-finale-summary.json) retains staged hashes and
quest/profile states. Exact final native saves are losslessly compressed
withmtime0: [English](fixtures/act5-finale-en.json.gz) and
[Chinese](fixtures/act5-finale-zh-CN.json.gz). Neither grants earned ancestry.

The original unchanged-text `fill()` run timed out in both locales before
Import. Its report/traces remain failed. [BUG-111](../../../production/bugs/BUG-111-save-import-browser-paste.md)
records the causal reduction: native clipboard paste preserves the exact raw
text and allows normal Import/decoder/all-domain checks. Product Settings
was not changed; neither minification nor a debug/store bridge is used.

Root owns raw reports, failed traces, frozen manifests, diagnostic report and
logs at`/tmp/d2h5-a5-integration-650ka_is` through their consumers. Task-local
oracle caches were cleaned in each test's finally. After all runners and readers
finished, `dist-close/` was removed and its absence verified. Exact cleanup is
recorded in `dist-close-cleanup.json` at that root.
Old superseded`dist/` was removed with verified exact-path cleanup; the
historical Siege evidence's earlier retention statement remains historical.
C0/C1 accepted; C2 underway; C3/C4/full G0–G7 open. Local only.
