# P03b05b — guarded manual mercenary unequip

Status: accepted bounded slice; root/QA/producer final review APPROVE,
evidence ADEQUATE in evidence/p03b05b-merc-equipment-capacity.md.
Input09fe00f, P03b05a45d44c3.
QA independent read-only investigation supplies boundary and browser oracles.
Root owns source/UI/tests/control/BUG030/evidence/ledger; design worker owns
only separate P08a02 read-only investigation. No fullP03b/P13 acceptance.

## Contract

Manual unequip is preflightable and must not grow a full/overflow backpack.
After existing merc_not_owned and not_found checks, refuse backpack_full when
current backpack length >= shared BACKPACK_CAPACITY100. Preflight before either
store publication; retain complete state/references with zero publications.
At99, return once to100 with normalized flags/Map payload and clear the slot.
Existing equip removes one source and returns at most one displaced item; allow
its current nongrowing behavior at99/100/101/500, including overflow reduction.
No redundant impossible capacity branch, new handedness, requirements or class
restriction. Preserve authoritative first source/owner/base checks and precedence.

This explicitly replaces the temporary P03b02 expectation of manual unequip
500→501. Retain that exact legacy fixture and assert refusal/retained gear/items
and localized feedback instead. Durable earned/already-returned addItem ingress
remains unbounded; legacy saved overflow stays visible. Do not silently discard,
repair IDs, change save schema or lower ingress limits.

UI retains failure reason and renders a persistent polite status outside the
picker condition, so ordinary Unequip can announce inventory:toast.backpackFull.
Existing equip refusal retains localized item-name feedback/picker. Store reason
and translate on render, retaining current locale changes. Refusal preserves
gear/picker; clear on slot change or successful equip/unequip. Reuse existing
copy, no locale/schema/shared-constant edits. Existing synchronous publications
retain P03b05a's settled-state boundary, not atomic cross-store snapshots.

## Verification and ownership

Six source/test files: mercStore.ts; new stores/merc-equipment-capacity.test.ts;
MercsScreen.tsx; new MercsScreen.equipment-capacity.test.tsx;
specific obsolete manual-return expectation in inventory-awards.test.tsx;
new tests/e2e/merc-equipment-capacity.spec.ts. Root additionally owns this control,
required BUG030 and compact evidence/ledger. No source edit before reviewed
contract, genuine100/101 actual-store RED and mounted missing-feedback RED/report.

Store/RTL boundary99/100/101/500, missing-owner/gear precedence, repeated refusal,
complete payloads/Maps, normalized flags, no-op identity/publications, unrelated
player/currencies/stash/merc progress and owned state; exact once-per-domain
success. Retain P03b05a stale-source regressions and all durable ingress tests.
Both locales, render-time retranslation, same gear/picker, room/retry and clear.

Browser en/zh×1280×800/360×640, retries0, ordinary creation/free hire then explicit
imported overflow-recovery fixture (not earned loot): backpack[S helm,B boots,
F1…F99]101; merc headOld/boots empty. Refuse head unequip101, swapS101, equipB100,
refuse head unequip100, swapOld100, explicitly discardF1, unequipOld100, equipS99,
unequipS100, refuse boots unequip100, discardF2, unequipB100. Literal final
backpack[F3…F99,returnedOld,S,B], head/boots null, onlyF1/F2 disappear. Independent
complete expected saves after operations, Map-bearing items/unrelated sentinels,
ordinary Save/reload/export, no bridge injection/forced clicks/pageerrors/overflow.
Use slot-label clicks; occupied center may hit nested Details. Delete downloads.

Focused/related then fullU/T/L/build and forced browser lint/diffcheck. No engine
edit; timing misses stay explicit. Independent source/evidence review, selective
commit, cleanup exact task-owned dist/.vite and /tmp/d2h5-p03b05b-* resolved paths
after processes/reviewers, verify Playwright-owned port stopped. Never wildcard
delete; leave shared tools/caches/history/worktrees untouched.
