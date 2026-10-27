# BUG-287 — Observe the actual localized Physical log

- Severity: Medium — acceptance harness false negative, production hit observed.
- Status: Fixed locally in `4a80c03a`; public4/4PASS100.913s.
- Build: runtime/UI `dceffcf4`, uncommitted public acceptance spec.
- Environment: Linux Chromium Desktop Chrome,1280×800,en; no fixed engine seed.
- Owner: root (QA acceptance); no product runtime change required.
- Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-volley-l7m0tvg6/amazon-volley-public-browser.log`,
  `public-browser-report.json` and preserved failure trace/error-context/screenshot.

## Reproduction

1. Run `tests/pwa/amazon-volley-acceptance.config.ts` against the task-owned
   production build using its required DIST/OUTPUT/REPORT environment variables.
2. Import constructed level90 Amazon, allocate all three19→20 and prioritize
   Guided Arrow; enter Catacombs through the public UI.
3. Poll observer for selected cast and a positive enemy Physical hit.

## Expected

Recognize the localized damage after the selected cast, and reset attribution
when the hero begins a basic attack or another skill. Continue ordinary
Pause/Flee/save/online/offline acceptance.

## Actual and cause

First context fails at positive-hit polling; three contexts do not run. The
preserved DOM shows “Ama Volley Test casts Guided Arrow.” immediately followed
by “Ama Volley Test attacks Bone Warrior A for 103 physical damage.”
The draft checks uppercase `Physical`, while the existing English log uses
lowercase `physical`. It also guesses a basic-action line instead of the
actual “readies an attack.” / “准备出招。” translation. Fix those exact observer
comparisons; retain the strict selected-action/enemy/positive-damage requirement.
Do not change combat,damage,translations,assertion thresholds or timeouts.

The initial ignored-file lint invocation and missing ambient declarations in
the external focused type config are separate setup errors. Explicit
`--no-ignore` lint and correctly scoped ambient type compilation pass without
repository configuration changes. All failures and raw trace remain retained.

Security check: pass; first-party local acceptance/DOM observations only; no
credentials,dependency,CI,remote or genuine campaign/save action.

## Verified correction

After both original type/lint consumers terminated successfully,the draft
observer was corrected to lowercase `physical` and exact localized basic-action
lines. Any following action closes selected-skill attribution,so another skill,
basic attack or enemy-action reflection cannot supply the positive hit. No
assertion,timeout or combat source was weakened/changed. Explicit final public
lint8.448s/types7.981s and production4/4contextsPASS100.913s.

All twelve selected casts have positive hostile Physical hits:Guided103,
Multiple47,Strafe43 in both locales/device contexts. Eight seven-domain pairs,
four actual service-worker offline Continues and60geometry samples pass.
Original failure trace/log/screenshot/test source and both config-setup failures
remain retained at the task path until terminal integrated closeout and exact
owned retention/cleanup. Broader independent/earned acceptance remains open.
