# D04 — Plague Javelin functional checkpoint

2026-10-26. Root-authored local evidence, not independent/earned acceptance.
Inventory remains unverified until the integrated checkpoint and cleanup close.

`d18e689c` repairs the discarded Plague payload and mixed Poison/Plague spread.
`72213405` validates authored tuning; `13a6d098` implements paid-cast Epidemic.
`176c6ad6` explains actual targeting, finite damage, payment and spread;
`011c22e8` supplies both status labels; `af0c020d` adds native causal/wave/save
checks; `36a8fdba` adds ordinary production browser acceptance.
Contract: [D04](../decisions/D04-plague-epidemic-v1.md).

## What is established

- Paid rank1/20 casts preserve one direct hit per selected line-3 target,
  three damaging Poison stacks and ordinary rate-less Plague. Payment is25MP,
  cooldown2s. Mixed records use Poison for both spread count and captured rate.
- Pre-cast active Poison10 permits100% spread once per actual paid cast;
  nine raised to ten by the same cast retains50%. Multi-target/repeated hits
  share one allowance. Independent casts, later periodic death and caster death
  work; misses, failed payment, inactive Poison, replaced/expired markers and
  fresh battles cannot inherit authority. Lethal final intervals retain the
  ordinary frozen-source ordering. No saved field or extra RNG roll was added.
- Native projection gates class/level/allocation. Actual allocation preserves
  a recorded wave; the next wave captures the new rank and carries actual
  resources. Validated save import restores allocation/priority and clears combat
  teams/events; it cannot serialize captured Poison or private Epidemic authority.
- Actual bilingual skill panels show rank0/1/19/20 damage and legal19→20 MAX,
  Poison/Plague rules,50% versus100%, pre-cast maximum and once-per-cast limit.
  Both applied-status labels are localized.

## Current validation boundaries

The original BUG281 RED has six failures/four controls. BUG282's external
diagnostic has one failure/eleven passes; the repository's initial four cases
have three failures/one control. These original failures remain retained.

Engine checkpoint after the runtime correction passes9490tests/359files,
163.189s. Its explicit1668input manifest, including tests/sim and all new files,
was read back with zero differences before later UI/test edits. Focused engine
checks pass204tests/sixfiles; final native/UI checks pass22tests/threefiles,
9.883s. Final focused native strict types10.499s/lint11.949s pass.

The production build passes13.242s. Six JS chunks contain none of the repository
guard's forbidden test-bridge identifiers. The actual precache check reports
756unique URLs with every required application asset present. Existing large
chunk and2.57MB generated-manifest warnings remain; this is not a performance
or whole-offline-content signoff.

The original browser matrix passes4/4: en/zh-CN × Chromium desktop/Pixel5,
71.400s runner,69.933s Playwright,zero skips/retries/flakes. It uses ordinary
character creation, a labeled constructed save, public import/equip/allocation/
priority selection, actual Catacombs entry, cast/Poison/Plague/positive enemy DoT
observations, public flee, explicit Save and page close/newpage/Continue. Both
online and warmed offline restores preserve all seven saved domains; offline
navigation comes from the service worker. It does not claim a campaign victory.

Five CSS sizes are sampled for each case:360×640,412×915,640×360,1280×800,
1920×1080; allocation targets are≥44×44 and document overflow is absent.
The first viewport images crop the long description and show the allied part of
combat. Therefore the strengthened mobile run adds real visible affected-enemy
and log captures after public Pause; both locales pass2/2,37.112s runner/
36.089s Playwright. Four original mobile viewport images and four strengthened
enemy/log images were individually inspected: readable bilingual text and actual
Poison×3/Plague chips are present. Log images show a partial current viewport,
not necessarily the earlier cast/DoT line; original DOM observations retain those
exact lines. Existing decorative glyph boxes remain outside this skill fix.

Two equivalent browser-test lint corrections precede that strengthened run;
the original matrix sources/hashes remain separate. Final focused public types
11.679s and explicit `--no-ignore` PWA lint8.956s pass. Initial configuration/
oracle errors, ignored-lint warnings and corrected checks are retained, not
reported as product defects or hidden by skipped repository tests.

## Outstanding gates and retained ownership

The fresh full lint session12885/`plague-full-lint` is terminal: exit0,
223.626s, inputsUnchanged:true. Original full unit37999 and types78777 returned
tool exit143 without terminal runner receipts. Their recorded npm PIDs are
absent; the retained process audit found no surviving Vitest/tsc process with
this worktree CWD. Termination cause is unestablished; neither is a test failure
or a pass. Original partial logs and both interruption audits remain retained.

The sequential retries are now terminal: full types97325 passes110.404s;
full unit10940 passes18528tests/858files,826.893s, with the two existing opt-in
campaign economy/continuation skips. Both report inputsUnchanged:true. All1673
source/test/script/config inputs in `plague-functional-inputs.json` were read
back exact after the interruptions, before retry and after all full checks,
before the following Amazon source edits. `plague-full-final-input-audit.json`
retains that terminal audit and all three passing receipts. These results belong
to the Plague snapshot, not the subsequent Amazon description/test changes.
The older18461full pass belongs to Mage. No inventory credit before cleanup.

The browser fixture does not force an Epidemic trigger; its exact death effect
is covered by real-engine and native projection cases. Earned allocation/build
viability, independent design/QA, campaign/balance/economy/endgame, real-device
and whole-app a11y/performance/PWA acceptance, C2–C4/fullG0–G7 remain open.
Protected genuine progress staysL33,Ancients/Rite claimed,Baal uncleared,next402;
compressed/raw save hashes remain unchanged. No campaign/replay/remote action.

Root retains the continuing task and its disposable production build at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-plague-payload-3qlrqw3s`
through the completed full checkpoint and following class integration. It contains
original sources/failures, terminal receipts, both browser revisions/reports,
exact images/save pairs, and frozen inputs. Root owns retention/read-back and
exact cleanup after all consumers finish. No cleanup is claimed; shared caches,
dependencies, original checkout and registered worktree claim remain preserved.
