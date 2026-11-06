# Cobra Strike — implemented mechanics and remaining acceptance

Reconciled 2026-10-29. Combined independent review accepts Cobra for bounded
local functionality. BUG-304 is resolved locally for that functionality; the
213-player-skill inventory is now **213 bounded / zero unverified**. Independent
feature acceptance, earned builds, balance and campaign pacing remain open.

## Settled behavior and existing evidence

The user's cheaper-solution choice is implemented: monsters remain mana-free.
An authorized Cobra release restores the surviving actual caster's HP and MP
from actual hostile HP removed, with existing paid stacks, coefficients and
fresh missing-capacity caps. No victim MP pool or debit is needed.
The [D05 amendment](../decisions/D05-assassin-martial-charges-v1.md#cobra-recovery-amendment--2026-10-27)
controls this policy; no preference question is pending.

[Native recovery evidence](cobra-mana-recovery.md) records intended causal
RED/GREEN, recovery boundaries and prior command results.
[Public-store lifecycle evidence](cobra-public-lifecycle.md) establishes learned
ranks 1/20, zero-enemy-MP recovery before terminal snapping, actual paid-stack
consumption, playback and complete persistent-domain equality through
export/flush/load/Continue/import. Only Dexie constructor/table I/O is mocked.
Live battle HP/MP, charges and runtime authority are transient; restored battles
earn new paid Cobra recovery. This proves neither saving midbattle resources
nor actual browser IndexedDB durability.

## Completed browser gates and outstanding earned acceptance

| Gate | Current evidence | Limit |
| --- | --- | --- |
| Production/offline and public skill controls | [Production v4](cobra-production-offline.md): activated offline service worker, public allocation/priority and bilingual current/next/MAX previews, 8/8 cases | Tested integration path; whole-app PWA acceptance remains open |
| Resource geometry and captures | All 24 production resource captures inspected; scrolling exposes hero HP, global MP and enemy HP without horizontal overflow; priority targets at least 44px high | No simultaneous mobile visibility, full device/a11y or physical-touch acceptance |
| Earned sustain and balance | Still required: earned character/gear, sustain, economy and pacing evidence | Synthetic high-capacity fixture does not calibrate earned gameplay |

[Real-browser lifecycle evidence](cobra-browser-lifecycle.md) now passes 8/8
rank1/20 × en/zh × desktop/mobile cases and 24 initial/Continue/import recovery
witnesses. It verifies zero-enemy-MP paid recovery and rendered resource values,
actual IndexedDB, browser-close/reopen durability and full persistent-domain
equality with fresh runtime state. Independent combined review accepts the
native/DEV/production evidence for bounded-functional inventory credit, with no
remaining Cobra-specific prerequisite for that credit. Full D05 remains separate.

The original H3 attempt remains terminal `H3_PREREQUISITE_FAILED_NO_APP`.
The owner subsequently authorized a fresh WSL browser investigation;
[current browser evidence](wsl-browser-launch.md) verifies headed/headless launch
and a general public Save/close/reopen/Continue flow. Browser launch no longer
blocks further verification. The subsequent Cobra checkpoint above supplies
recovery/playback/import assertions within its stated DEV scope. Preserve protected earned saves and original
one-shot results; an old experiment's attempt limit does not impose a blanket
ban on new, separately recorded tests or grant them historical acceptance credit.

No additional runtime defect or recovery redesign is justified by these evidence
gaps. [BUG-304](../../../production/bugs/BUG-304-cobra-mana-free-monster-contract.md)
is resolved locally for bounded recovery functionality. Broader campaign,
14-build viability, devices/locales/a11y/performance/PWA, human/soak
and full-v1 acceptance remain unresolved. CI is not required for this work for
now, and the owner will playtest after implementation. The 30–50 active-hour campaign target
is not an instruction to run repeated real-time 30–50-hour tests.
