# D11 Malus physical recovery and rare-affix prerequisite

Status: locally verified; complete integrated suite and independent gate APPROVE. This increment
does not implement selected-item imbue, Present, entitlement Restore, or final
quest rewards. It does not accept earned progression, balance, or private v1.

The contract is [D11](../decisions/D11-act1-remaining-quests-v1.md). The base is
Countess checkpoint `345cd7082ed220567651c70e04a24a93d333dcee`, which is accepted by the expanded bounded integrated gate recorded below.

## Physical behavior

After the canonical `areas/act1-catacombs` clear, Map Recover creates the bound
`quest/horadric_malus` item at
`quests/act1-tools-of-the-trade#objective:obj-recover-malus`. Selected Charsi
Give consumes that source and completes the physical objective. A remembered
subarea is retained while in town. Neither action grants XP or a service charge.

Sparse completed or claimed legacy journals may explicitly earn these missing
physical steps while retaining their historical status and Claim bits. Current
version 23 validates the partial physical graph; the frozen version 22 domain
and version-only migration remain unchanged.

Fresh physical completion still refuses Claim with the localized
`unsupported-rewards` result and no writes. Claimed legacy Claim remains
disabled. The next dependent imbue slice must replace this deliberate refusal
with the complete source-bound entitlement and reward transaction.

The publication boundary holds the shared quest lease, captures deep scoped
preimages, checks source and context after publication, and restores participating
slices while preserving unrelated sources and journals. Restoration failures
are collected and reported explicitly.

## Rare-affix prerequisite

`prepareRareAffixes` preflights a feasible distinct set of 4–6 rare affixes,
including 1–3 prefixes and 1–3 suffixes, before accepting caller RNG. It reuses
the existing type, level, weight, tier, value, and selection rules. Ordinary
sparse drops and the separate two-affix caster helper retain their behavior.
This function alone does not grant or consume an imbue entitlement.

## Historical checks before the final combined checkpoint

- Original API baseline: 8 causal failures and 10 passing controls, 18 cases.
- Publication baseline: 12 reached causal failures and 11 passing controls,
  23 cases. The failures include deep observer mutations, revoked context,
  silent publication drops, and silent restoration failures.
- Physical helper/API/transaction/UI checks: 64 passes across 4 files. UI
  exercises English and Chinese. Fresh integrated reruns remain required.
- Helper baseline: 16 missing-API failures among 26 cases. Nine passing refusal
  assertions were vacuous against the missing function; the ordinary RNG/pair
  compatibility case was the independent baseline control.
- Initial integrated engine: 10,295 passes across 394 files, including all
  helper tests. Build passes. Typecheck and lint exposed test-fixture/style
  defects, documented in BUG-328 before correction. No assertions, timeout,
  discovery, worker settings, or skips were weakened.
- The next unchanged snapshot also passes all 10,295 engine tests, lint, build,
  and both production-browser matrices: 8 Malus and 8 Countess cases with
  32 exact save/close/Continue pairs. Typecheck identifies the readonly save
  interface as unsuitable for mutable fault setup; the final correction uses
  an explicitly mutable test-local row with the public status domain.
- Independent physical, helper, test-correction, and final shared-source reviews
  approve. Shared-source review verifies all 1,840 frozen inputs under manifest
  SHA256 `2a79c6784bfabb9b878e7c88a2df4853e04d63fab6b94b2d1102e79425eef385`.
  That snapshot is unchanged after all original check processes terminate.
  The final test-only type correction is isolated in the new 1,840-input
  `release-integrated-inputs.json`, SHA256
  `01b7d4c5bf9a526c9795f177a9f4b65aec2791e54d36baec69a9f72cad4ddac4`.

The completed `gate-integrated-inputs.json` snapshot
`fd0313bfa94275b5d4838ef9c78cece1c95b727b88a7ba4c81e6adc99bf54c0f`
passes1,531focused tests/35files,10,295engine tests/394files, types, build,
and16production browser cases with32exact persistence pairs. Native receipts
remain bound to that snapshot. Lint reports one test-only declaration-style
error, documented before the type-alias→interface correction.

Final1840-input `full-integrated-inputs.json` is
`486e7db0a9285de0554182c6aa12256836b6e355973fbf9ab6a210dad13f8323`.
Its sole delta is that declaration; exact prior-source reconstruction and
identical emitted JavaScript are verified. Production inputs are unchanged.
Independent source/equivalence and browser-artifact reviews APPROVE, explicitly
preserving the native earlier check snapshot. Final focused1,531/35and
typecheck pass. Final lint was interrupted143 without a native receipt; its
tracked detached native retry passes in199.045s with no input differences. Earlier release lint/browser143
interruptions and the stale exact loader-ID expectation failure remain retained.
No fixed interruption cause is established. The expanded complete `npm test` suite is now running exclusively, after
all other task-owned check PIDs stopped. Fresh discovery, all1,840input hashes
and the protected genuine fixture/summary are exact before launch. Its native
terminal result and post-run audit are pending; combined acceptance remains open.

The current16case artifact review recomputes all32exact persistence pairs,
bounded2502–4502ms offline gaps and exact fresh Countess3000hero/2250mercXP
plus one allowed rune versus no repeated legacy Claim. Native previews stopped
and their port closed. BUG347 records a raw `combat:levelUp:2` desktop log row
for later repair; it is an explicit cosmetic caveat. Browser fixtures are
constructed imports and establish functionality only.

Root retains original logs, receipts, manifests, staged drafts, and browser
artifacts at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-malus-h9_rzp5t`.
Root owns verified archive/readback and exact task-owned cleanup after all
checks and reviewers release. Evidence cleanup is pending. Four superseded task-owned builds were removed
by exact verified manifests:3,048files total, no remaining paths or failures.
All original failure logs/process records, native receipts, snapshots and browser
artifacts remain retained. Source/browser readers released before the latest
production build cleanup; build receipts and all762file hashes remain retained.

## Final combined checkpoint — 2026-10-27

The expanded Countess/Malus physical/rare-affix checkpoint passes the original
complete `npm test`: **20,514 tests across 972 files**, with two existing opt-in
skips, native exit0 in1088.005s. The final1840-input snapshot is
`486e7db0a9285de0554182c6aa12256836b6e355973fbf9ab6a210dad13f8323`.
Native process/log hashes and post-run fresh discovery match; all recorded PIDs
are absent and the protected genuine save/summary are unchanged. Final focused
1531/35, typecheck and lint pass on this snapshot. Earlier engine10295/394,
build and16browsercases/32exact persistence pairs retain their actual
`fd0313bf` snapshot, with independently verified declaration-only equivalence.

Independent source, browser-artifact and final combined gate reviews APPROVE.
This accepts bounded constructed functionality only. Full selected imbue,
earned progression, balance and full-v1 acceptance remain open. BUG180 remains
unresolved despite this pass; Countess whole-log rollback and BUG347's raw
level-up text remain disclosed limitations. Both earlier full failures and
interrupted checks are retained as failures/incomplete attempts.

Both task roots were archived, every retained member read back and hashed,
then only their exact verified files/directories removed. Malus:818retained
members,820raw files/31directories removed. Countess:643retained members,
2192raw files/38directories removed. Both cleanup receipts report no remaining
paths or failures. Four reviewed future drafts were also copied and verified
in the owned next-task root before cleanup.

Root retains these archives and their manifest/retention/cleanup sidecars
through independent/full-v1 consumers and removes them afterward:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-malus-h9_rzp5t.evidence.tar.gz`
  SHA256 `571ca94509fb3870689f07cf633da49ffde8859b53eac4d6788d34f85949de87`.
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-countess-qdb39bvo.evidence.tar.gz`
  SHA256 `1607c8cd665895cc1831682c43bb1d3a1ff1d7c8fe4b7bf43d6c253d7acd992f`.

The Countess archive contains the self-contained `combined-final-gate.json`,
linked native checks, manifests, final review and original browser artifacts.
No genuine gameplay, replay, remote publication, merge or deployment occurred.
