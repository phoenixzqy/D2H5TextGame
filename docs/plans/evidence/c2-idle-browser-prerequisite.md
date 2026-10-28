# C2 — Native browser prerequisite, without app execution

Verified 2026-10-27 at checkpoint
`b2ab4f84edb548cc9af27b9b69d60de8271d63a0`.
Outcome: **PREREQUISITE_FAILED_NO_APP**. The production build passes; actual
hidden-tab behavior remains unverified. No game defect is established.

## Native observations

After the [original missing-browser result](c2-idle-launch-prerequisite.md),
the separately reviewed prerequisite performed three checks. All original
terminal results were consumed; all receipts report unchanged runtime inputs.

1. The pinned Playwright 1.59.1 installer exits 1 before downloading:
   `Playwright does not support chromium on ubuntu26.04-x64`. The command uses
   `install chromium --no-shell` and `PLAYWRIGHT_SKIP_BROWSER_GC=1`; no platform
   override, dependency change or shared-cache cleanup occurs.
2. The production build exits 0 after 12.988 seconds in original session 52667.
   All 762 output files exactly match the previously audited build.
3. Original session 60062 exits 1 after the single reviewed blank-page
   prerequisite. Existing headed Chromium 1248 launches on DISPLAY `:0`,
   reporting version `156.0.8078.4`. Its explicit executable is
   `/home/felixzhao/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`,
   SHA-256 `377a9fc07b495c3b8d0ab8ec1fdfd153641759f9756fea34d8dfce4de82f5025`.
   The Playwright/browser version mismatch is recorded; general compatibility
   is unproven. After removing three background-throttling-disable defaults
   and disabling CDP focus emulation on both blank pages, the foreground-visible
   assertion succeeds. The cover-hidden assertion times out after 5000 ms at
   `browser-prerequisite.mjs:40`. Native elapsed time is 8.109 seconds.

The recorded `phases` array is empty. Reached visibility/events and native
target/window identity are missing, so the cause remains unresolved.
[BUG354](../../../production/bugs/BUG-354-retain-native-visibility-prerequisite-failure.md)
records this harness evidence gap before repair. No failed harness was edited
or retried. The game-harness drafts remain unapproved and unexecuted.

There were zero app contexts, navigations, source imports, gameplay admissions
or completed gameplay cases. Browser PID 564612 and its exact owned temporary
profile are absent; the shared executable remains unchanged. Preview port
39682 never started and is closed. No hidden-tab idle, persistence,
conservation, pacing, balance or full-C2 acceptance follows from this result.

## Binding, review and retention

All 1,848 runtime/test inputs remain equal to snapshot
`0c42e4f448b55e55db4a3493c825ef24a0d843343a0316c443ba798eb54a3a94`.
The protected genuine endgame save remains unchanged. Previous typecheck,
lint and full 20,656-pass unit validation remain applicable; game code did
not change.

Independent producer review APPROVES packet SHA-256
`9f5c0d14e68645f06d461ebd0df94d49f55f6236e6c0598005f380c7f04fc0c8`,
verifying 38 references, three native associations, frozen preflight, current
inputs, protected/source fixtures, build hashes, lifecycle closure and BUG354.
Security PASS; all readers released. This approves accurate failure evidence.

Original retention session 71712 exits 0 and its terminal result is consumed.
All 41 archive members pass readback/hash verification. Exact cleanup removes
803 files and 11 directories, including the disposable build and raw task root;
remaining `[]`, failures `[]`. The raw root is independently confirmed absent.

Root retains these exact deliverables through independent/full-v1 consumers,
then owns their removal:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-c2-idle-preflight-7jxcfc0i.evidence.tar.gz`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-c2-idle-preflight-7jxcfc0i.evidence.manifest.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-c2-idle-preflight-7jxcfc0i.evidence.retention.json`
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-c2-idle-preflight-7jxcfc0i.evidence.cleanup.json`

Archive SHA-256:
`9db888e6d9e9ac5d5637dfd79ce2f5688850bd9c370ecd0a0c63bee8615c4f61`.
Preserve the failed prerequisite. Any future diagnostic needs a separately
reviewed native tab/window and failure-capture contract. Full v1 and the
registered umbrella worktree claim remain active; no publication occurred.
