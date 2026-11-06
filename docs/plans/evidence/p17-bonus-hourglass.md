# P17 — Font-independent offline bonus hourglass

Verified locally 2026-11-04 at HEAD
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained source.
BUG681 is fixed locally. Both banner and HUD use a private decorative inline SVG
with the current text color; labels, translations, rewards and save state are
unchanged. The focused spec is included in the production PWA runner.

The browser creates and saves a character through the UI, waits for service
worker activation, closes the page and reopens eight hours later offline. All
four locale/device cases pass (en/zh-CN, 1280×800 desktop/360×640 mobile), with
visible SVGs on both surfaces, expected labels, no overflow/page errors and no
production debug bridge. All eight captures were visually inspected in the
implementation turn. This evidence exercises no combat or imported save fixture.

Existing offline unit tests pass 12/12. Scoped strict types and explicit lint of
the component, spec and PWA config pass. The isolated production build has 766
files/ten JS chunks; the forbidden-bridge scan and actual Workbox/PNG checks pass.
All 766 production hashes and eight capture hashes reverified before cleanup.

The first four browser attempts timed out on the test's default five-second
service worker poll, before icon assertions. The existing offline tests allow
60 seconds; using that allowance and a 90-second case timeout fixes the harness.
The final four pass in 52.3 seconds, without retries. Initial logs/traces remain.

Security check: pass. Scope is static inline SVG plus local production testing;
no network, dependency, privilege or save-format change. Local source/test review
found no material issue; no independent approval is claimed.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-bonus-hourglass-v1`.
It retains original failures/traces, final JSON report, eight PNG captures, logs,
source/build/capture hashes and `closure.json`. The original source manifest is
retained separately; the final manifest includes the corrected spec/PWA config.
Disposable production output, temporary runner/types configs and empty success
output directory were removed and verified absent. Port 4401 is closed and no
packet-owned server/browser process remains. Root retains the evidence through
umbrella review and owns eventual cleanup. Broader private-v1 scope is open.
