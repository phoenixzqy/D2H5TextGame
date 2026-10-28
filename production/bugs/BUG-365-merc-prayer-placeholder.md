# BUG-365 — Apply the native Prayer mercenary’s party regeneration

Status: Open — implementation checkpoint retained; required full validation failed; browser/earned acceptance pending.
Severity: High — a recruitable mercenary’s signature support effect does nothing.
Build: 79d58fae1e876b271c18e580449a8e62d40d6403.
Environment: Node 24.21.0 / npm 11.19.0, Vitest UI/jsdom; seed 7, constructed bounded combat snapshot.
Browser/viewport: not applicable to native reproduction. Locales: en and zh-CN.
Owners: engine-dev / content-designer / writer; root implements, producer reviews.

## Reproduction

1. Construct `mercs/act2-prayer` through `loadMercPool`, `createMercFromDef` and `mercToCombatUnit`.
2. Record fixed-seed surviving parties, with an injured projected hero and stunned participants.
3. Check actual healing at 1000ms intervals, passive registration, fresh native qualification and both locale surfaces.

Expected: `docs/design/gacha-spec.md:129` specifies flat 5 party HP/s.
The injured hero receives 5 actual HP at 1000ms, 2000ms and 3000ms, with no
entry heal or aura cast. This is separate from selected Paladin Prayer.
Actual: the default registry supplies an inert self-buff, with no healing
potency or native source projection. Recruitment incorrectly advertises 5% per turn.

Primary regression: `src/stores/merc-prayer.test.ts`. All three cases fail before production edits; native RED exits 1 with unchanged
inputs (8.56s). Raw `red.log`/`red.json` and input maps retain the failure.
Root-owned raw evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-prayer-9d0e935j`.

## Bounded repair contract

Closed exact-identity JSON authors amount5 and interval1000ms. Fresh canonical
factory qualification supplies transient source authority. One independent
wave-local timer starts after a full interval; live eligibility is rechecked
after periodic deaths and selected ambient pulses. One or more sources supply
one flat contribution to current living player-party members, including source,
other mercenaries and late summons. Shared healing caps actual HP, emits ordinary
playback and never resurrects or banks restoration. Source death/removal withdraws
presence; fresh waves reset the first deadline. Selected Paladin timing/scaling/
recipients, periodic settlement and stop rules remain independent.

No action/payment/RNG draw, persisted marker, save version or base-stat mutation.
Removing the obsolete cast intentionally allows Jab sooner. Plan review is ready,
security-pass, findings empty, readers released; receipt SHA256
`cb018177cf0791ded53c511bc9e4df04ab4d0043bb0a344589203dcc8f27f4a3`.
No app/browser, new acquisition/lineage experiment, protected fixture or closed
policy is involved; umbrella and browser/earned acceptance remain pending.

## Unaccepted source checkpoint — 2026-10-28

Source `af71980f69561a472fdf033088ceb7f0209bb465` implements the bounded contract. The unchanged
real-factory primary fails three cases before the repair and passes three after it.
Final focused246 /12files, engine10,959 /409files, typecheck, zero-warning
lint/purity and external production build pass with all2,045 inputs unchanged.
The unfiltered full suite exits1:21,525passed,3failed,2existing skips /1,007files.
Two existing module-entry cases time out (BUG-180); a separate material-source
control times out (BUG-366). Their phases/causes remain unknown.

One reviewed13-case UI CPU reduction passes without changing assertions or
5,000ms deadlines. Its sampled compilation cost justifies no specific production
optimization and clears neither original full failure. Independent review agrees.
No automatic retry, compiler/configuration change or next Fire implementation
follows this checkpoint. See [retained evidence](../../docs/plans/evidence/merc-prayer.md).
BUG-365 remains Open; no bounded-fixed/source-acceptance or full-v1 closure is claimed.
