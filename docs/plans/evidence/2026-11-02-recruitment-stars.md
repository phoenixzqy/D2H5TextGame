# Recruitment stars and reveal — implementation evidence

Status: live mechanics and focused browser verification complete; F07/P13
acquisition/funding and independent acceptance remain open. This continues
[save33 recruitment](2026-11-02-recruitment-v33.md) under
[D10](../decisions/D10-recruitment-v1.md). Full private v1 stays active.

## Delivered behavior

The public owned-merc action spends100 canonical shards for one star, capped
at five, while retaining excess shards. It requires actual instance ownership
and refuses combat, active admissions, hydration, save replacement and competing
material transactions. Publication is limited to merc recruitment progress;
observer failures roll it back, with persistence blocked if restoration fails.
Reentrant spending cannot debit twice. No wallet or natural actor is rewritten.

Fresh projections add8% natural core/derived stats per star, preserve absolute
current HP/MP, and apply canonical equipment afterwards. Level growth and gear
eligibility use the same natural projection without compounding saved actors.
All three production combat-input paths supply the canonical earned stars.
The signature receives one rank per star and12% primary potency per earned rank,
giving1.60× base potency at five stars. Actual native attacks, healing, finite
control/Defense, auras and Pilfer consume it. Secondary skills, costs, cooldowns,
target counts and fixed Chill limits remain authored. Custom same-ID registry
replacements do not inherit native signature authority.

Finite Rogue Inner Sight now captures its paid Defense reduction in the status
payload; source death does not erase it. Legacy bare markers keep the25% fallback.
Battle Command retains D06's explicit rule that fixed merc abilities gain no
invented rank tuning; its temporary generic rank is separate from earned stars.
No transient signature authority is serialized.

Both locales show stars, shards, explicit upgrade, signature rank and current
potency. Screenshot review found unlabeled base ability values (BUG595); the
shared card now labels them and distinguishes signature potency from secondary
skills/fixed limits. Ten-pull results reveal one immediately, then one per250ms.
Skip reveals already-paid results without a new roll/debit. Reduced-motion
preference reveals all immediately; unmount clears the pending timer.

## Evidence and limits

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

- 512 distinct passing cases across22 affected files, deduplicated from
  `bug594-stars-green-v1`, `bug594-stars-ui-green-v1`,
  `bug594-reveal-green-v1`, `bug594-stars-affected-v1`,
  `bug594-signatures-final-v1`, and `bug595-copy-green-v1` JSON reports.
  The affected run has459pass/3stale exact Inner Sight expectations; all three
  are updated for the captured payload and pass in the final76-case rerun.
  The other459 are not replayed. BUG595 has2 actual RED then2 GREEN UI cases;
  its final10-case run also covers the strict signature fixture repair.
- `bug594-browser-stars-reveal-v2.json`: Chromium147, desktop1280×800/en and
  mobile360×640/zh-CN. Public Settings import/export of an authentic earned
  recruitment copy, public upgrade, exact100-shard/+1-star mutation, projected
  core stats, Save/reload/export identity, sequential reveal and Skip, exactly
  one90-wish payment, exact history/shard outcomes, then durable paid reload.
  Original actors/map/items are preserved. No console/page errors or overflow.
- `bug595-browser-star-copy-v1.json`: only changed presentation and keyboard
  upgrade are rechecked in both locales. It also checks1920×1080,412×915 and
  640×360. Upgrade controls are48px high and Skip is52px; all measured widths
  exceed44px. Screenshots are visually inspected. This is not a full WCAG audit.
- `bug594-stars-lint-v1.log`:26 changed TS/TSX files pass ESLint with zero
  warnings. `bug595-copy-lint-v1.log` covers its four subsequently changed TS
  files. Engine purity passes. Final global incremental typecheck
  `bug594-stars-types-v4.log` exits0 after the fixture fix; its live handle is
  read through termination, not inferred from an empty log.

Native preparation uses580 ordinary paid pulls from a disposable earned save
to obtain100 actual duplicate shards, charging5220 existing wishstones. Its
bounded1000-pull search grants nothing and does not upgrade. This is a functional
test preparation, not a representative acquisition sample or campaign successor.
No combat/campaign or unaffected test suite is replayed.

Source authority36 records the runtime mechanics and browser transaction proof.
Authority37 records exactly six later presentation/test files, unchanged game
data and2129 total inputs. Tree hash
`2f193c887659633efb6ef4d0033f6df8fa352c94ce74135851c9f89eb7b299ef`;
data hash `f52d5e4ff3995f9b5b23ac13f168e744ad22ca0c7be0d50985adc204ecc862dd`.
The canonical earned70/Hell961 source remains byte-identical, SHA256
`92bb1d9c21175dd4ca9120048a43444b59e4cc9ec060ac7d6a56bcdc96326e44`.
The later presentation edit warrants no repeated campaign/reveal payment proof.

Retained failures: an initial external Vitest invocation omitted the workspace
and made zero assertions; actual star/signature/reveal REDs are retained too.
Signature test assumptions about existing rounding, finite War Cry clocks and
RNG thresholds were corrected without changing production math. Browser v1
expected nonexistent punctuation in a localized label; v2 corrects the driver.
Global types exposed an optional-property fixture error, fixed by requiring
the actual native signature rather than casting or suppressing it. Browser
server emits the existing stale Browserslist database notice; no install occurs.

## Remaining full scope

Next measure acquisition/funding distributions under the now-live recruitment
rules and representative Hell income variance. Inventory/storage/startup
performance (BUG592), chronological14-build funding/fairness and independent
holdouts, defeat/retry/manual-idle, calibrated30–50 active hours, integrated
G0–G7, two-hour soak, independent review and later ownerplaytest all remain.
Accepted balance cells remain0. Browser works; CI excluded; no pending question
or external blocker. Required worktree/packet stay with root through umbrella
review; final disposable-cache cleanup is recorded in the accompanying JSON.

Security check: pass; first-party local engine/data/save/store/presentation.
No network export, dependencies, grants, commits, pushes or publication.

Successor diagnostic: [acquisition distributions](../../balance/2026-11-02-recruitment-acquisition.md)
complete128 fixed-horizon native streams/1,536,000 draws in18.443 seconds.
First-star median5220 wishes makes earned funding, not assumed star power,
the next campaign requirement. This conditional study does not accept broader
acquisition/funding or change any recruitment/economy tuning.
