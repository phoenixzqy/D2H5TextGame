# P03b05a — authoritative mercenary equipment transfers

Date:2026-10-20. Runtime base23d8047; bounded control
`../p03b05a-merc-equipment-integrity.md`. Root developer/source/test review:
APPROVE/ADEQUATE. Producer independent source/final evidence review APPROVE,
evidence ADEQUATE (read-only, no reruns).
No full P03b/P13, net-capacity, equipment-combat or economy acceptance.

## Reproduction and delivered behavior

BUG028 retains genuine pre-runtime direct-store RED:4fail/1file1.80s at07:12:05UTC,
expanded8fail/1file1.77s at07:12:52. Mounted actual-store UI RED3fail/1file3.95s
at07:14:20 proves same-ID stash deletion and stale helm selection consuming a
current sword. These failed on literal contents before feedback assertions.

Existing equipOnMerc/unequipFromMerc now own the complete synchronous transfer.
They preflight owned merc/current first backpack ID/stored slot before publishing,
preserve stored complete payloads and Maps, remove only the source index and
normalize returned equipment metadata. Discriminated refusal preserves both
store references/contents with no publication; success publishes each domain
once. UI delegates, preserves the picker on refusal and uses existing localized
polite feedback. Existing ring and unbounded return policies remain. No schema,
migration, currency, rewards, requirements or handedness change. Paired synchronous
publications do not promise atomic cross-store subscriber snapshots or recovery
from arbitrary throwing/reentrant external subscribers.

Tests check forged caller fields in both compatibility directions, missing owner
and source precedence, orphan preservation, repeat refusal, ring slots, complete
duplicate payload conservation, normalized swap/unequip, input immutability,
unrelated player/currencies/progress/stash and domain publication counts. Mounted
native capture-phase current-source change uses real store actions, with en/zh
refusal and corrected retry. Existing inventory-awards tests remain unchanged.
Security check PASS: trusted local transfers/tests, no new remote operations,
permissions, credentials, dependencies or agent policy.

## Browser acceptance and limits

`E2E_PORT=4334 npx playwright test tests/e2e/merc-equipment-integrity.spec.ts --project=chromium-desktop --project=mobile-portrait --workers=2 --reporter=line --output=/tmp/d2h5-p03b05a-browser-final`

Final4/4pass15.0s, retries0, en/zh-CN at1280×800/360×640. Ordinary fresh Sorceress
creation, locale and free InnerSight hire precede a clearly labeled imported
integrity fixture; this is not earned loot. Backpack has a Map-bearing helm and
same-ID distinct sword; stash has same-ID distinct helm; merc has another
Map-bearing helm. Real pointer equip/swap-back/unequip each match an independently
constructed complete wire-safe save, including every unrelated field. Ordinary
Save/reload/export retains complete final state/locale; no horizontal overflow or
pageerrors. Downloads deleted. Existing development server/config, no bridge
injection; no production/PWA/earned-currency/balance claim.

Initial matrix at `/tmp/d2h5-p03b05a-browser-1`:4failed on30s timeout waiting for
Equip. The occupied slot's center hit nested Details, opening the item modal;
DOM error contexts established the target error. Corrected only the two picker
opening clicks to the ordinary localized Head label; no runtime/oracle/timeout
change, forced click, retries or removed assertion.

## Checks

- Focused four UI/store files:58pass/4files4.03s at07:17:12UTC.
- `npm test -- --reporter=dot --silent`:1307pass/115files/no skips31.46s,
  started07:17:22. Functional pass;15s full-unit budget unmet.
- `npm run typecheck`, `npm run lint`, `npm run build`:pass. Build10.05s;
  existing chunk/Browserslist/optional manifest warnings persist.
- Initial typecheck rejected new RTL `exact:true` options. Removed only those
  unsupported options (string accessible-name matching is already exact), then
  typecheck and mounted3pass/1file3.82s passed. No runtime edit after full unit.
- Final forced ESLint of browser spec and `git diff --check`:pass.
- No engine edit in this child. Ubuntu26.04 unsupported-host caveat,
  Node24.21.0/npm11.19.0, Playwright1.59.1/shared Chromium147.

## Artifacts and review

After all processes/reviewers finished, root verified4334 stopped and removed
only task-owned worktree2 `dist`, `node_modules/.vite`, and exact browser outputs
`/tmp/d2h5-p03b05a-browser-1`, `/tmp/d2h5-p03b05a-browser-final`. All four paths
verified absent. Downloads deleted by the spec. No task process/disposable
artifact or cleanup failure remains. Source/history/shared tools/caches and
the claimed worktree remain intact.
