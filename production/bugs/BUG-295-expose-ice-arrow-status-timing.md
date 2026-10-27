# BUG-295 — Expose Ice Arrow status timing in both languages

- Severity: Medium; the native skill works, but its generic detail description hides the actual ordered control rules.
- Status: Reproduced; UI correction pending.
- Build:03bf3c7a3643f3b0accbce605e04847775284177, unchanged source through9729cc9a.
- Environment: local Node/Vitest/jsdom, real SkillsScreen/Zustand/i18next, en/zh-CN; no browser viewport in this component reproduction.
- Seed: native control7; natural miss41. Preview itself has no RNG.
- Affected systems: frontend-dev/writer; skill description selection/locales. Existing engine damage/Freeze/Chill remains authoritative.

## Reproduction

1. Load a constructed level30 Amazon with Ice Arrow ranks0,1,18 or20.
2. Open the real Ice Arrow detail panel in en and zh-CN.
3. Read the description: generic Cold damage only. Status labels appear separately, but ordered application, Freeze/boss duration, Chill speed/duration and miss behavior are absent.

Expected: describe one single-target Cold attempt, Cold resistance/magic resist, landed Freeze1s (bosses0.5s) followed by Chill2s/50% attack-speed reduction, refresh without stacking, no statuses on miss, and actual rank-dependent damage/15MP/1sCD.

Actual: generic damage description wins over the authored sentence; neither gives the actual timing/ordered rules. Existing numerical cost/CD rows are correct.

Root cause: the specific description resolver handles other Amazon Cold attacks but has no Ice Arrow branch; the generic first-damage fallback returns first. Fix that selection using the existing shared damage display model, STATUS_DEFAULTS and CHILL_DEFINITION; keep engine, data tuning, eligibility and save format unchanged.

Evidence: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_/ice-arrow-ui-red-valid-config.json/log records8genuine bilingual rank failures; original test retained as SkillsScreen.amazon-ice-arrow-before-terminology.txt. A prior missing-workspace setup failure is not a behavior RED. ice-arrow-native-green-correct-units.json/log records11native PASS with actual allocation/payment/positive Cold HP loss,ordered statuses/exact boss expiry,ownership/resources/cooldown/miss/resistance/replay controls. The original resistance fixture used5000 instead of50 percentage units; source-backed correction preserves the strict21HP assertion,with original failure retained.

Existing mechanic contract: [D04 ordered Freeze/Chill](../../docs/plans/decisions/D04-freeze-chill-v1.md). Author plan challenge: select the exact Ice Arrow identity before generic damage,source all displayed values from existing models/definitions,preserve both locales/current-next-MAX and view immutability. Security check: first-party local copy/render/tests only; no credential,network,dependency,CI,permission or save change. No independent design/QA or earned-balance approval is claimed.
