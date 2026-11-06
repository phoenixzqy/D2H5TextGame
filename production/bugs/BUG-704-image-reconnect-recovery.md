# BUG-704 — Retry failed artwork when connectivity returns

Status: Resolved locally, uncommitted; independent acceptance pending
Severity: Medium
Owner: frontend-dev (root implementing locally)
Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes.
Environment: installed Playwright Chromium147.0.7727.15, zh-CN1280×800;
no engine RNG involved.

## Reproduction

1. Open `/character/new` in an isolated browser profile.
2. Fail the authored Paladin portrait request with `internetdisconnected`.
3. Wait for the card's silhouette fallback.
4. Remove the failed-request route and cycle actual browser connectivity
   offline→online, checking `navigator.onLine` at both transitions.

Expected: failed artwork retries its existing authored URL after reconnection.
Actual: the silhouette remains and no image element returns. Healthy art must
not reload simply because an online event occurs.
Workaround: reload the page or leave and revisit the screen.

## Evidence and cause

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-art-reconnect-zsjpf5q0`.
`reproduction.json` proves GameCard remains on its fallback after reconnection;
`before-card.png` captures the rendered state. Its subsequent NPC observer
failed after reloading an unsaved fresh character; that failure is preserved
and does not establish an NPC defect. A separate observer avoids that reload.
`npc-reproduction.json` then proves the same GameImage fallback persists after
reconnection, with exactly one failed authored request and no page errors;
`before-npc.png` captures it. No NPC interaction or combat was performed.

Both `src/ui/GameCard.tsx`'s CardArt and `src/ui/GameImage.tsx`'s ImageContent
remove their img after onError and retain errored=true until their source-keyed
component remounts. Neither listens for connectivity recovery.

Affected systems: shared card and image presentation (F19). No public prop,
art URL, provenance, item, combat, economy, save or dependency change intended.
Retry must be event-driven and bounded: one attempt per reconnection while
failed, normal fallback again on another failure, no timers or cache busting.

## Resolution and verification — 2026-11-04

Both components use a shared internal recovery hook. Only failed artwork listens
for online; that event clears its error state once, remounting the same URL.
Another load failure restores the fallback. The listener is removed on recovery,
source-key remount or unmount. Healthy images remain mounted.

Five new regressions fail before the source edit; all18 affected component
cases pass after it. Scoped strict types and five-file lint pass. Native source
browser verification covers both components at360×640/1280×800 in zh-CN/en:
two failed requests, then one real successful asset load, no autonomous loop,
no requests or element replacement for healthy images, no page errors/overflow.
The original English observer used a static html lang attribute as a locale
oracle; corrected cases assert rendered translations and retain that discrepancy
separately as BUG-705. No campaign or formal balance acceptance is claimed.
