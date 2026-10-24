# BUG-175 — Activate global summon passives

Severity: High. Status: reproduced, implementation in progress.
Owner: engine-dev/frontend-dev (root sole writer).

Reproduction: baseline 5b6d549, Vitest native store/production wave adapter,
seed7. Browser/viewport/locale: not applicable to engine reproduction.
1. Construct a level30 Necromancer with Clay Golem1, Golem Mastery1,
   Summon Mastery1 and Summon Resist1.
2. Start a native Blood Moor run; inspect the actual fresh Clay summon event.
3. Alternatively learn both global passives through ordinary allocation and
   advance to the next wave.
Expected: fresh life244.2 (220×(1+.06+.05)), attack24.48,
physical resistance12 and five other resistances2. Hero pools and existing
recording stay unchanged by learning.
Actual: life233.2, attack24, physical10 and others0; same failure next wave.
Evidence: src/stores/summon-passives-native.test.ts, two causal failures;
raw red-native.log retained for the implementation evidence.
Root cause: authored global passive metadata has no wave projection or consumer
at fresh summon creation. Existing local Skeleton/Golem Mastery works.
Workaround: none for the missing effects.
