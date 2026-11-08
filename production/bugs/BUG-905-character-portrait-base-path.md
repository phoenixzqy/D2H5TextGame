# BUG-905 — Load character portrait under the deployment base path

- Status: Fixed in 02b800d5
- Severity: Medium
- Reproduction: `b5df22de`, Edge/Chrome at desktop viewport, zh-CN; deploy under a non-root Vite base path, open Character with a Necromancer.
- Expected: The class portrait loads or a graceful fallback appears.
- Actual: Broken image icon in the portrait frame.
- Evidence: User screenshot of the broken Character portrait; `CharacterScreen.tsx` uses an absolute asset path while `vite.config.ts` supports `VITE_BASE_PATH`.
- Affected systems: frontend-dev.
- Seed: Not applicable.
- Regression: `src/features/character/CharacterStatDraft.test.tsx`.
