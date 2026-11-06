# Runeword recipe reference

Quick design, Addition, 2026-11-04. Requirements: work-plan P12b/P16,
playable-target G4/G5 and D10-material-economy-v1, Slice B/all35 words.
The controlling matching and economy rules are unchanged.

The socket-insertion screen explains that exact base, capacity and rune order
matter, but previously exposed no recipes before a completed insertion preview.
Players should be able to plan a runeword without consulting source files or
spending materials to discover its sequence. This supports informed build
choices and the existing crafting loop.

## Rules

1. A collapsed, keyboard-operable “Runeword recipes” disclosure appears only
   for socket insertion. Its native select includes every word in the validated
   production `socketRunewords` catalog, currently35, with localized names.
2. The selected recipe shows normal/white rarity, exact total socket capacity,
   applicable base alternatives, equip level (other base requirements still
   apply), ordered runes and full-recipe required/owned quantities. Repeated
   runes count separately: Last Wish needs three Jah, not one.
3. Weapon subclasses constrain only weapon alternatives. Spirit shows sword
   OR shield, Fortitude any weapon OR body armor; Dream helm OR shield. The
   guide reads authored predicates and never introduces a second matcher or
   declares the currently selected item eligible/ready.
4. Ownership updates from the live material balance. Browsing never changes
   economic state, prepares/commits a transaction, chooses an insertion target
   or material, grants a recipe, or charges currency. Players still preview and
   confirm each normal insertion through the existing transaction service.
5. Both locales use the same presentation and data. Controls have visible
   labels, keyboard focus and44px targets; text/tables wrap at360px. The ordered
   list and ingredient-table headers convey sequence and totals without color.
6. Before spending, show the selected word's authored bonus stats and reviewed
   equipped grants, including active rank, Mana and cooldown. Reuse item-tooltip
   formatting for percentages, self-only effects and healing conditions. Explain
   that base stats and ordinary rune effects also apply and that the insertion
   preview shows the full item. Browsing effects confers no equipment or skills.

## Acceptance

- Bilingual public-panel regressions prove all35 names, Leaf requirements/order,
  Spirit/Fortitude/Dream alternatives, repeated-rune totals, live balances and
  unchanged target/material/store state.
- Existing affected insertion and target-work checks continue to pass. Scoped
  strict types/lint and native source-browser checks cover the changed surface.
- Effect checks cover flat and ratio units, active payment, conditional healing,
  selection changes and unchanged gameplay, plus existing tooltip regressions.
- This addition does not establish acquisition, combat utility, economy/pacing,
  all-family crafting, production/PWA or independent umbrella acceptance.

No systems-index addition, schema, save migration, tuning or new art is needed.
Owner authorization covers implementation/docs without a separate routine
approval. External prospective plan records security pass and plan-review ready.
