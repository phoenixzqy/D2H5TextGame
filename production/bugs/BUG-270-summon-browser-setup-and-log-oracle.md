# BUG-270 — Slot the learned summon and match actual localized damage logs

- Severity: Medium; acceptance tooling fails, with ordinary post-allocation combo selection available.
- Status: Corrected externally: ordinary learned-slot/tab navigation and actual English log grammar verified.
- Owner: root, QA tooling; no delegation or independent acceptance.
- Environment: production Chromium, English, 360×640; synthetic L60 Necromancer and native socketCapacity0 survival cap. No earned campaign is used.

## Reproduction

1. Run retained basic-summons-browser.cjs, then its diagnostic variant.
2. Import an unlearned Skeleton combo slot and allocate0→1→2 through Skills.
3. Copy the exported allocation into rank1 combat without explicitly slotting the now-learned skill.
4. Enter Blood Moor and wait for an actual body and positive outgoing Physical log.

Expected: a prepared learned/slotted summon produces a paid body and real damage.
Actual: both runs exit1 after the30s predicate;53distinct diagnostic frames show zero bodies and only ordinary hero/enemy actions. No passing combat case exists.

## Localization and suspected cause

SkillsScreen.tsx sanitizes combo slots against learned configurable active skills. The driver sets the slot before learning and never restores it afterwards. Confirm the exported combo before changing the setup. The English log matcher incorrectly expects uppercase Physical; production uses lowercase physical. The initial overescaping suspicion was disproven below: both original digit classes are valid.

Original drivers, logs, JSON results, failure DOM and PNG are retained in this task directory. Diagnostic terminal log SHA256 e143bf3ea48f6c3a40c16b058f4e5fa88385225aaf3bde25ba5e048430e2712b. Preserve them and use fresh output paths. Correct only demonstrated test setup/matcher errors; preserve all positive-body/damage, save/offline, timeout and error assertions. Do not alter production eligibility/import/combat to make malformed setup pass.

## Confirmed setup diagnosis

The separate combo diagnostic exits1 in5.848s: exported learned rank2/zero points has comboOrder:[] instead of the expected authored Skeleton slot. Full allocated export retained. Diagnostic log SHA256 e3ebfddba7d2a4caa484d42d5445b82babb331864f84b4c7e9fce81adc9136e8. Select the newly learned skill through Slot1/槽位1 before export, assert the persisted authored slot, and preserve the full combat assertions.

## Driver-generation correction

The first correction generator aborted before writing a driver because its assertion expected a doubled regex backslash. Byte inspection proves the retained original has a valid single-backslash digit class in both locales; the summary's overescaping diagnosis was wrong. Correct only English Physical→physical and post-allocation slot selection. An accidentally attempted run of the absent driver exited1/MODULE_NOT_FOUND in0.042s; its receipt/log is preserved and is not browser evidence. No browser server started in that attempt.

## Ordinary control navigation

The first slotted driver timed out before combat because Slot1 is mounted only inside the Active Skills tab. Source inspection confirms Tabs renders the active panel separately from the tree. Preserve the35.309s timeout receipt/log; navigate the ordinary Active Skills/主动技能 tab before selecting the combobox. No production change or timeout extension.

## Final local validation

Native21cases/related186in3files pass35.734s; full types120.220s and focused typed lint8.784s pass. Eight completed Skeleton/Clay contexts from the original failed aggregate command plus separate Revive4/4PASS80.285s establish12completed locale/viewport cases. No12/12successful single command is claimed. All original failed sources/logs remain retained. See docs/plans/evidence/d06-basic-necromancer-summons.md and its checkpoint packet. No production runtime change, independent sign-off or earned-build balance acceptance.
