# Intended Fire Sorceress Act II checkpoint — 2026-11-03

Fire continues from its verified Act I save at level 13 / next Normal ordinal
124 and reaches level 31 / next ordinal 443. Five of six Act II areas clear on
their first attempts. All 20 quest actions before the final Claim succeed.
The 240-second driver budget stops Tomb preparation; Duriel is never attempted.
This is a verified partial continuation, not a campaign or balance acceptance.

## Native result

- 319 new admissions: 17 generic preparation, 297 area training, five routes.
- 1,583 settled victories; no defeat or draw in this segment. The eight Act I
  defeats remain in predecessor costs.
- Rocky Waste, Dry Hills, Far Oasis, Lost City and Arcane Sanctuary clear at
  ordinals 204, 240, 277, 352 and 399 respectively.
- 4,279,601 XP, 15,816 added items, 15,694 salvaged items, 58 socket insertions.
- Combat elapsed: 11,991,274.601025008 ms, about 3.331 logical hours.
- Driver execution: 240,825.974705 ms; complete launcher: 246,204.0304329712 ms.
  The limit is checked between settled waves; capture/audit overhead is retained.
- Four quest Claims complete. Cube custody and consumed staff components/Book
  reconcile. The Seven Tombs final Claim remains pending.

At ordinal 442, the last training admission stops after a settled victory with
one subsequent wave staged but unplayed. Earned rewards and its admission/time
costs remain; the exported save does not preserve an active combat session.
No income or victory is claimed for the unplayed wave.

## Preparation and verification

Pre-run inspection caught an omitted setup step: the existing Act II controller
requires level 14 while the predecessor is level 13. Restore the existing
`prepareCampaignStage` call before freezing the driver/reader. Seventeen native
Den admissions earn 14; the ordinary Prayer hire follows. The unchanged area
controller then earns its authored 18/20/22/26/28/32 targets. This correction
changes only external transport/accounting files, before any gameplay outcome.

Scoped strict TypeScript, targeted external-driver ESLint and no-gameplay
preflight pass. The initial lint command could not resolve an absolute parser
directory; the installed package name resolves correctly, with both receipts
retained. No unrelated unit suite, build, browser or completed campaign reruns.

The frozen V1 Python reader passes without post-outcome correction. It verifies
the complete export, ordered backpack/stash/hero/merc item custody, currency,
materials, XP, stat/skill points, preparation intervals, companion transition,
quest prefix, clocks, seeds and ordinals. All 2,151 production and 131 campaign
inputs authenticate unchanged. No gameplay source or intended profile changes.

## Evidence and continuation

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Prefix `p15-fire-earned-act2-v1` retains the plan, frozen inputs, corrected and
original external drivers/readers, report, compressed journal, exact successor,
readback, check/exit receipts, archived config and closure.

Successor: `p15-fire-earned-act2-v1.native-export.json`, 209,389 bytes,
timestamp 1793486788367, SHA256
`348990a70e660834b405410669fa5c0824e249c8c9f4d65a3b22746ddd57ecc4`.
Production source tree:
`b7783834bf865c8521c1d95a19b9d31d7f5bdb665dc4eff96765c10b90981eb9`.

Resume only remaining Tomb preparation and the final route/Claim from this
checkpoint, carrying the audited prior training and 20-action quest prefix.
All 297 area-training admissions, including 43 for Tomb preparation and the
interrupted final admission, stay spent against the original shared/per-area
limits. Do not replay cleared routes or renew closed bounds. Cumulative costs:
443 admissions, 17,188,237.061178852 combat ms, 270,328.837322 driver ms and
288,695.60189405456 measured launcher ms. Native/launcher/readback processes
are terminal; exact task cache/config are absent. Root retains required
evidence and claimed human2 through umbrella review and owns cleanup/release.

The previous goal turn was status-only, without progress. This continuation
produces the verified checkpoint. All 14 Act I clears, main Corpse/Bone Normal
completion, Cold Act V partial and Javelin Act IV partial remain unchanged.
Formal balance acceptance stays 0/210; populations, independent combat/loot-law
checks, fairness, decision-adjusted pacing and full private-v1 gates remain
open. Browser works, CI stays excluded, no user answer or external blocker.
