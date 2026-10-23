# Book of Skill inventory flow and Atma

2026-10-23. Builds on transaction commit `31b5e88` and the accepted D11 contract.
The ordinary inventory now shows bound quest items separately from equipment,
including an unread Book of Skill and its consumed receipt. Every Read invokes
the exact source transaction. The native button retains focus after consumption;
its Already read state announces a refusal without granting another point.
Claim previews the localized book beside5000XP, without promising an immediate
quest skill point. Loading and grant failures allow retry; restoration failures
give distinct copy without claiming that earlier state was restored.

Atma is authored in Act II through the existing dialogue loader, with no invented
service, quest prerequisite or return objective. English and Chinese dialogue,
quest descriptions and objectives identify the burial chamber beneath the Far
Oasis, preserving the29-map layout. No power or economy tuning is included.

Tests first demonstrated eight missing UI cases and two Atma failures with eight
passing controls. Combined UI/town/data validation passes367tests/6files. The
first full suite has8861passes/one failure: a historical test expected no Act II
NPC. That test now requires exact Atma identity while preserving unauthored-act
negatives; final focused33/3pass. An attempted full rerun ended with SIGTERM143
and no complete verdict; no Vitest process remained. The reason is unknown.
The final complete four-worker run passes8862tests/288files in206.96s, exit0;
no tests or assertions were removed.
Typecheck, lint and production build pass; all four JS chunks pass the five
test-bridge patterns. Existing test-time and bundle budgets remain open.

Production Chromium passes both en/zh-CN cases in94.66s, with zero retries,
skips, flaky results or page errors. The unchanged input is the earlier
**constructed** Radament-completion save, not an earned C2 fixture. Ordinary
Import performs the exact v11→v12 empty-ledger migration. Claim adds5000XP and
an unread book with unchanged skill points for this level12 input. Read adds
one point and no XP; the complete resulting save changes only that point and
receipt. Unread and consumed Save→close→new-page Continue preserve the complete
export and IndexedDB state. Repeated consumed imports and subsequent Read
attempts grant nothing. The Read control passes44px dimensions and zero document
overflow at11viewports per locale, including320×640,360×640,412×915,640×360,
768×1024,1280×800 and1920×1080. This is keyboard activation/layout evidence,
not touch-device testing or a full accessibility audit.

The [English consumed view](fixtures/d11-book-consumed-en.png),
[Chinese unread view](fixtures/d11-book-unread-zh-CN.png) and
[executed browser script](fixtures/d11-book-ui.spec.ts.txt) accompany the proof.
Independent source/test and browser-evidence reviews APPROVE/security PASS;
all readers released. Source777/build760 hashes have no drift. The only later
source correction is the documented Act II test expectation; runtime bytes stay
unchanged. Final full/type/lint/build gates pass; final-gate.json records them.

Required raw logs, reports, saves, scripts and manifests remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-book-ui-4ie0ae7w`
through D11/C2/full-v1 consumers; root removes them after those consumers finish.
The preview process is terminal and port34443 is closed. The exact task-owned
`dist` and `browser-output` directories were removed after the approved
[earned Radament attempt](d11-earned-radament.md); cleanup remaining[]/failures[]. No earned Act II,
C2–C4, full G0–G7, pacing or full-v1 acceptance follows. Local work only.
