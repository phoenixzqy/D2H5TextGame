# BUG-108 — Prepare the constructed Act V browser fixture explicitly

- Status: Fixed for the bounded constructed Siege/Rescue browser slice.
- Severity: Low (functional test setup; no gameplay defect established).
- Owner: root / QA.
- Build: `69828f682684ce5fd737bdff801619a57bdadb29`; production Chromium,
  360×640 mobile, en and zh-CN, zero retries.
- Input: actual Act IV browser export, itself based on constructed Act III
  power; SHA256 `08d2531df6df82f1c305b02136515b5bd8e97d368af14f9cd6e8b962f076eb79`.
  This is not a fresh earned campaign fixture.

## Reproduction

1. Import the untouched v16 Act IV export through Settings; exact migration
   agrees with the production Node-side decoder in both locales.
2. Start the five Act V main quests and enter Bloody Foothills.
3. Use ordinary Skip for each wave. The input has an empty active combo and
   an explicitly constructed Attack/Defense/Life cap.
4. Observe wave five: twelve Warped Shamans summon many minions; the hero's
   single-target basic attacks do not clear them within the battle limit.

Expected: the declared constructed functional fixture is sufficient to reach
the actual quest/service controls without changing gameplay or claiming earned
reachability. Terminal failures are reported promptly with their actual kind.

Actual: both cases draw at the 300-second simulation limit before Shenk. The
hero remains alive. The initial helper calls every nonvictory terminal
`defeat` and polls for the remaining timeout; that word does not establish a
death. No Shenk proof, quest Claim, service use or Act V acceptance follows.

## Evidence and repair boundary

Root retains report, screenshots, traces and exact initial test/config under
`/tmp/d2h5-a5-integration-650ka_is/browser-prefix/` and
`/tmp/d2h5-a5-integration-650ka_is/browser-prefix-inputs/`.
These are required diagnostic evidence until Act V review finishes; root owns
their eventual disposal after compact evidence is retained.

Preserve the failed run unchanged. Review an explicitly attested constructed
preparation and ordinary selection of the already-learned area skill; preserve
quest proof, rewards, currencies, earned item identities, ranks and points.
Do not tune runtime/data, inject quest completion, retry the earned campaign,
or turn this functional test into campaign/balance acceptance.

## Bounded result

The untouched export is still imported first and compared with the actual
production decoder. Only afterward, a separately hashed functional variant
adds Crit Chance0.95, Crit Damage10000 and Mana100000 to the existing synthetic
cap, recomposes the equipment mirror/derived stats through production code,
and selects the already-learned Frost Nova using the ordinary Skills control.
Current Life/Mana, all earned item identities, points, ranks, currencies,
quest state and source proofs are preserved by preparation. The original
draw report remains unchanged.

At runtime `69828f6`, revised mobile production-browser evidence passes2/2 in
en and zh-CN, zero retries, skips, unexpected results, flaky cases or global
errors. Both actual Shenk and Frigid victories, explicit Siege/Rescue claims,
exact XP/point/resistance rewards and Save→close→new-page Continue are proved.
The terminal helper now reports the actual nonwin heading immediately.
Independent QA rates this bounded evidence ADEQUATE. Full Act V, services,
earned reachability, campaign pacing and C2 remain open.

See [the bounded evidence report](../../docs/plans/evidence/act5-siege-rescue.md)
for source/report hashes, commands, preparation provenance and ownership.
