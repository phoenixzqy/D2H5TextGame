# BUG-187 — Apply real Druid form effects

Severity: High. Status: reproduced; implementation in progress.

Reproduction: `cc4fd0988356f362e689dd65b3d739d04c9837a2`, Node/Vitest native
store-to-engine path, seed7. No browser required for the causal reproduction;
both locales inherit the same engine defect. Constructed level30 Druid, controlled
1000 maximum/700 current HP,100 attack speed/defense, valid allocated form and
Lycanthropy at rank1 or20. Configure the form in the ordinary combo and run
`src/stores/druid-shapeshifting-causal.test.ts`.

Expected: paid Werewolf changes cadence/dodge; Lycanthropy changes life/cadence
only in wolf form. Werebear changes life/defense. Forms do not stack or repeatedly
charge for an already active transformation.

Actual: a cast only adds a marker. Wolf actions remain1700ms apart, life capacity
stays1000 for both forms, bear mitigation is unchanged. Configuring both casts
both without implementing either transformation. Four negative controls pass.

Evidence: task-owned `causal-red.log` and `.result.json` under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-druid-forms-97wnsuki`;
original9cases:5fail/4pass. The original mitigation fixture used100 incoming
against100 flat defense, saturating the existing minimum1damage; corrected to
300 before production changes, with the original test/log retained.

Root cause: JSON-to-registry conversion emits a generic self buff; its consumer
records IDs but has no form state/stat projection. Lycanthropy is an unused
passive marker. Owners: root acting as engine/frontend/content implementer;
independent design/QA acceptance remains open. No workaround grants the effects.

Related presentation defect found during final screenshot review: Chinese paid-form
status chips were translated, but the transient buff-event badge fell back to
English Werewolf/Werebear because effect.buff lacked those two keys. The actual
component regression reproduces this separately; both representations must use
the existing localized skill name.
