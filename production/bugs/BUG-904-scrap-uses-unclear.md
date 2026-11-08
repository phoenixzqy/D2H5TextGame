# BUG-904 — Explain where salvaged scrap can be spent

- Status: Fixed in 02b800d5
- Severity: Medium
- Reproduction: `b5df22de`, Chrome at 360×640, zh-CN or en; open Inventory → Materials → Crafting materials after acquiring scrap.
- Expected: The material view names an actionable use, its cost, and where to perform it.
- Actual: It says only “Equipment crafting”; the actual caster amulet recipe and Anya trade are elsewhere.
- Evidence: `src/features/inventory/MaterialsPanel.tsx`, `src/data/items/material-recipes.json`, `src/data/vendors/anya-uniques-v1.json`.
- Affected systems: frontend-dev, writer.
- Seed: Not applicable.
- Regression: `src/features/inventory/MaterialsPanel.test.tsx`.
