# BUG-219 — Concentrate grants none of its advertised defense

- Status: reproduced; numerical/lifetime contract and repair open.
- Severity: High — advertised defensive benefit is absent from actual combat.
- Owner: root; independent design/QA and earned balance remain open.
- Build: `f208b176` plus the frozen Frenzy/BUG217/BUG218 changes; Concentrate unchanged.
- Environment: Node24, native Barbarian L30; ranks1/2/20 ×seeds7/19/41/97.
- Locale/viewport: both en/zh-CN promise increased defense; native engine probe.
- Affected systems: JSON skill contract, paid personal defense, native authority,
  combat mitigation, transient playback/carry and truthful bilingual UI.

## Reproduction

1. Legally compose Bash1→Stun1→Concentrate1/2/20 and prioritize Concentrate.
2. Supply declared synthetic million-HP pools,100MP,100Defense/100Attack Speed;
   hold the hero after1701ms so exactly one actual paid cast resolves at1700ms.
3. A huge-HP enemy with200Attack/50Attack Speed attacks after the paid cast.
   Compare each landed incoming hit with the same hero using a basic first action.
4. Verify immutable input and exact same-seed replay; retain complete observations
   before the intentional terminal assertion. No simulated state becomes earned.

Expected: a defined paid defense benefit affects an eligible later incoming hit,
with finite scope/lifetime and removal prescribed before implementation. Existing
copy does not determine numerical potency or duration; author a contract first.

Actual: all12cases pay10MP once, grant no personal buff/status capability, and
each positive incoming hit deals100HP, matching the basic control's100HP per
landed hit. Initial/final Defense remains100. The actual registered effect is
only Physical70–100/+7rank damage. Full dodge schedules match in only3/12cases
because the actions consume different RNG patterns; they are not treated as
paired mitigation evidence. Landed damage and the missing capability establish
the defect. Terminal assertion fails after all observations are written.

Evidence: [native probe](../../docs/plans/evidence/d04-concentrate-repro.md),
retained in the Frenzy raw packet. No Concentrate fix or inventory
credit; genuine Ancients/Rite L33/next402/Baal uncleared unchanged. Local only.
