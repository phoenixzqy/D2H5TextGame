# F19/F15 — Artwork reconnection and document language

Date: 2026-11-04. Implementer/source-browser evidence; independent acceptance
and production/PWA-wide acceptance remain open. Worktree human2, branch
`feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus inherited local changes. No commit, install, new agent or publication.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-art-reconnect-zsjpf5q0`.
Root retains it and human2 through umbrella review, then owns exact cleanup
and worktree release. The prior goal turn was status-only/no progress.

## Artwork recovery — BUG-704

Both GameCard/CardArt and GameImage/ImageContent removed failed images and
retained their error state until their source-keyed component remounted. The
native class card and Akara tile each stayed on fallback after restoring a
failed authored request and cycling actual browser offline→online state.
`reproduction.json`/`npc-reproduction.json` and before screenshots establish it.
The first NPC observer reloaded an unsaved fresh character and lost its route;
its failure is preserved. The separate observer avoids that reload.

The two components now use `src/ui/useRecoverableImage.ts`. Only errored
artwork subscribes to online; reconnection remounts its img at the same exact
authored URL once. Another failure restores fallback; listeners are cleaned
up on recovery/source-key replacement/unmount. Healthy images stay mounted.
There is no polling, cache busting, asset generation, prop or save change.

Five regressions fail before the edit, all18 affected existing/new cases pass
after it. Explicit five-file lint and scoped strict types pass. The initial
external type config could not resolve package types from the packet; the
corrected config uses absolute declarations and repository typeRoots, with
no source or assertion workaround.

Native installed Chromium147.0.7727.15 checks both components in zh-CN/en at
360×640 and1280×800. Each target makes exactly three requests: two deliberately
aborted disconnected requests, then one real successful asset load. Waiting
while still failed adds no attempt; another connectivity cycle after success
adds no attempt or remount. A healthy neighboring image retains its original
element and request count. All eight component observations have no page error
or horizontal overflow. Actual navigator.onLine=false/true is checked each cycle.

Accepted reports: the first case (zh-CN360) in `browser-verification.json`,
and the three cases in `browser-verification-v2.json`. The first English case
stopped at an unsupported locale oracle: the static html lang was still zh-CN.
Corrected remaining cases use native Settings selection, SPA navigation and
actual translated labels; completed Chinese mobile checks were not repeated.
The language discrepancy itself is separately fixed as BUG-705 below.

Local visual inspection includes Chinese mobile recovered card/NPC captures
and the English mobile localized capture. Browser paths use isolated fresh
profiles, native settings/creation and passive town viewing; no NPC talk,
combat, farming, recruitment, crafting, campaign admission or imported save.

## Document language — BUG-705

The corrected English artwork observers prove Paladin/Akara labels rendered
in English while documentLanguage remained zh-CN at both viewport sizes.
`index.html` supplied the Chinese declaration, but i18n did not update it.

`src/i18n/index.ts` now registers a languageChanged handler before init and
sets html lang to the resolved resource language. Non-DOM imports are guarded;
HMR disposal removes the handler. Translation resources and saved preferences
are unchanged.

All three language regressions fail before the edit, then pass: initial Chinese,
changes both directions, and en-US using English resources. One selected existing
Settings locale-button case also passes. Four cases actually execute; ten
unrelated Settings cases are excluded by the explicit name filter. The raw
Vitest JSON aggregate incorrectly says14 passed; assertionResults contains
four passed/ten skipped, and only four receive credit. Two-file lint/scoped
strict types pass. No broad suite or typecheck was run.

`locale/browser-verification.json` verifies ten native observations: initial
Chinese, English Settings/character creation and Chinese Settings/creation at
360×640 and1280×800. Each declaration matches visible text; page errors are
empty. No new character is created in these locale checks.

## Closure and limits

`scope-checks.json`, `locale/checks.json`, source snapshots/hashes, raw red/green
reports, scripts and screenshots retain exact scope and observer failures.
`cleanup.json` and `retained-manifest.json` record final source hashes, process/
port checks, exact disposable removal and retained evidence integrity.
Server3697792/session99274 exits0; port5173 is closed, no exact task processes
remain, and all nine browser profiles, Vite/browser temporary directories and
three temporary type configs are removed. Remaining disposables[]/failures[].

These are local fixes to F19 recovery and F15 document language. They do not
establish artwork provenance/budget completion, production service-worker
recovery, whole-app accessibility/performance, gameplay balance or pacing.
Counts remain14/14 intended ActI,7/14 five-act Normal, formal0/210 accepted.
Full privatev1 stays active/incomplete. Remaining build viability, acquisition/
crafting coverage, economy/pacing, higher difficulties/endgame integration,
broader app/PWA and final independent acceptance remain. Closed training and
diagnostic allowances stay closed; human extended playtesting stays with user.
