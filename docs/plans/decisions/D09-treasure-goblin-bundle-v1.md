# D09 — Treasure goblin equipment and independent materials

2026-11-04. BUG684 reproduces15real-pool failures against drop-tables §4.9.
Implement five equipment-only picks, the existing additional rare+,1–4runes
and5–10gems. Rune identity uses min(5,actualAct+1); gems use actual act. Current
D10 difficulty/tier/quality caps and weights still apply. The obsolete gold
and mixed wishstone rows do not consume equipment slots or add a second income
source; the current §9-gated secondary wishes and rune-shard formula remain.

Keep raw treasure classes byte-equivalent. Project only the configured live
goblin table to equipment, retaining source weights, minima, fixed set/unique
rows and MF behavior. Extend only the terminal99band to a finite122cap, matching
the highest supported current chapter/replay level. Share that projection with
the existing rare+ guarantee so it cannot refuse valid high-level goblins.
Other tables and explicit quest caches retain their old interpretation.

Native inspection/reproduction adds two requirements: authored goblins are elite
combatants, and challenge fitting clones a single goblin into an ordinary pack.
The live goblin table therefore supplies boss-tier loot context irrespective of
combat tier. Keep the actual combat unit/level unchanged. For authored treasure
waves only, use the authored roster size as the fitting target (maps-spec §6's
one goblin), preserving existing elite promotions/affix draws and ordinary-wave
count rules. This prevents multiplying the entire bundle11–20times. Existing
historical earned evidence remains historical; no replay/reward regeneration.

Add the bounded goblin policy to the existing closed material-economy schema
before authored JSON. Reuse complete currency/material generation, adding an
optional gem maximum without changing fixed chapter-boss draws. Count every
material identity, aggregate repeated stacks, preserve actual ilvl and refuse
incomplete equipment/material bags before native XP or inventory effects.
No persistence version, installed dependency or earned save changes.

Verify original15failures, quantity/identity endpoints, caps, MF, fixed entries,
finite eligibility, schema/semantic refusal, exact non-goblin/cache isolation,
determinism and native inventory publication/refusal. Run affected loot checks,
scoped types/lint and isolated production build/precache/bridge scans only.
No campaign replay or earned/economy/pacing/balance acceptance.

Plan review: ready. Root cause is the mixed-source projection; quantities are
bounded, cache semantics and fixed boss material entropy stay isolated, and the
finite cap covers the identified late-level refusal without infinity.
Security check: pass. Local authored rewards and existing settlement authority;
no network, credentials, permissions, CI, dependency or publication changes.
