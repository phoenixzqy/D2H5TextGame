# D08 — Late Act II loot and earned Tomb continuation

Root implementation, execution and self-audit; independent acceptance pending.
The [contract](../decisions/D08-act2-ordinary-equipment-band-v1.md) and BUG151
record the four-field data correction. Base runtime `a9dc030`; changed loot
data SHA256 `680f0c530083d9cf9c1886f1d36ca0d9a194607478e669d6437e91ec700305db`.
That hash is checked by the actual attempt260 browser before entry. No monster,
boss, damage formula, reward weight, rarity, noDrop or pick policy changes.

## Diagnosis and original failure

The unchanged prepared258 save and native seed3286157777 reproduce the exact
wave3 enemy IDs and loss in isolated production service playback. Normalized
and mixed skill aliases produce identical outcomes. The earlier seed1 projection
wins; the historical diagnostic priority produces the same results as the real
priority for both seeds. The 16-seed sample therefore missed a real failure;
there is no observed alias or browser/engine divergence. Greater Mummy armor126
and fire resistance50 reduce rank20 ordinary Fire Ball hits to1; critical hits
still penetrate. Static Field genuinely casts and damages.

An exploratory next259 screen uses33 fixed seeds for each legal31-point build:
retained fire30wins, nova/fire29, nova/cold29, frost/fire23, fire/cold31.
All failed rows remain. No projected save is promoted or favorable real seed
chosen. The retained build is kept; no additional reset or allocation occurs.

Actual259 wins three waves. The original script stops after the third settled
victory because its positive-gear assertion fails. All table gear maxima are
at most28, while the pack has nine level29 elites. This is an empty equipment
pool, distinct from a random noDrop. The unmodified failed browser report,
terminal victory and actual stopped export are retained. This is not a passing
rerun or a gameplay defeat. No later wave/boss outcome is claimed.

[Attempt259 final](fixtures/earned-duriel-attempt259/retained-final.json.gz)
preserves L24/XP128582,6274 unique gear and every6259 ancestral full payload;
+10170XP/+15gear, nextNormal260. Precombat Save/Continue passes; the interrupted
post-stop export's next exact import/Save/Continue is established by attempt260.

## Correction and validation

Exactly four `loot/trash-act2` item maxima change28→31, retaining minimum22:
war hat, chain mail, long sword and aegis. A parsed comparison proves every
other authored field/table unchanged. All original outcomes remain immutable.

- Corrected causal suite: seven failures/one schema control precede data edits;
  all eight checks then pass. Real manual/idle plans cover six ActII areas and
  sampled count ordinals, observing maximum ordinary level31. Boundary and
  native seeded materialization assertions remain unchanged.
- The first test setup used a draft7 Ajv constructor against draft2020 and an
  incorrect eight-versus-nine enemy count. Both are corrected before the causal
  RED. The first npm-exec command misparsed flags and ran too broadly; only its
  owned session is stopped. All original logs remain.
- Engine5606/171files PASS,69.03s. Typecheck, production build and final full
  lint PASS. An initial lint failure in the test's numeric diagnostic template
  is corrected with explicit String conversion; production data is unchanged.
- All four emitted production JS chunks pass the forbidden-bridge-token scan.
- Full unit suite:437 files,11438 passed/2 existing skips, exit0,406.14s.

These checks do not establish all-act/Nightmare/period loot eligibility,
guaranteed drops, equipment usability at the hero's current level or full P12.

## Actual corrected-runtime attempt260

One ordinary Enter consumes260→261 from the retained259 stopped export.
The same legal fire/Static build, all core points, remaining resets, equipment
and mercenary configuration remain. Historical Date/native timers, no seed,
Skip, speed override or gameplay replay. Production Chromium en360×640.

Waves1–5 genuinely win:2160/2430/2900/3300/3720XP and4/6/18/55/25gear.
In particular, the actual level29 wave now awards18 materialized owned items.
Duriel is reached and defeats the party. The failed boss wave grants no income,
clear, quest completion, Claim or act unlock. Neither boss stats nor the
original zero-gear259 reward is changed to produce this result.

[Attempt260 final](fixtures/earned-duriel-attempt260/retained-final.json.gz)
is authoritative: L24/XP143092,6382 unique gear, all6274 original full payloads
unchanged, nextNormal261/Nightmare0. Twelve native save exports and two exact
Save→close→new-page Continue pairs pass root audit. Final nonwin export exactly
equals the settled five-win prefix. All allocation/core/reset/quest/clears and
endgame controls pass. Browser reports zero page/console errors and no retries.
Resume this final; never replay259/260 or return to their earlier parents.

The next candidate is a legal owned-equipment adaptation: Duriel's normal
physical hits deal35 against current185armor, while many new chain-mail/shield
items require25 and cannot yet be equipped by L24. Evaluate actual eligibility
and full compositions; do not assume new gear can be used or change levels.

Owned browser/preview sessions are terminal. Exact dist259/dist260 are removed
and verified absent. Raw diagnostics remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`
through campaign/full-v1 consumers; root removes them when those consumers finish.
C0/C1 retain their original acceptance; Duriel/ActsIII–V/C2, C3/C4 and all full
G0–G7 gates remain open. Local only.
