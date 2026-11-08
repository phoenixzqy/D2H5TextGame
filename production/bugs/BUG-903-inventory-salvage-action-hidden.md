# BUG-903 — Expose salvage from equipment details

- Status: Fixed in 02b800d5
- Severity: Medium
- Reproduction: `b5df22de`, Chrome at 360×640, zh-CN or en; open Inventory, select unequipped gear in Backpack or Stash, inspect its detail actions.
- Expected: The item can be previewed and salvaged for scrap from its detail view.
- Actual: Only Equip/Transfer and Discard are offered. Salvage exists in the separate Crafting tab but is not exposed here.
- Evidence: `src/features/inventory/ItemDetailPanel.tsx` actions and `src/features/inventory/CraftingPanel.tsx` salvage action.
- Affected systems: frontend-dev, engine-dev (existing material action service).
- Seed: Not applicable; item selection and salvage preview are deterministic.
- Regression: `src/features/inventory/InventoryScreen.focus.test.tsx`.
