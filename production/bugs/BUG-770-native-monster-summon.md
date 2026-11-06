# BUG-770 — Load generic monster summoning from authored tuning

Status: Fixed in working tree (uncommitted). Severity: Medium. Owner: root (engine/content).

Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local v1 work.
Environment: Node/Vitest, pure engine; browser/viewport/locale not applicable.
Seed: no RNG needed for the authority reproduction; native controls use seed7.

1. In `monster-summon-authority.test.ts`, provide the actual monster catalog with
   only Summon Adds cooldown changed from5 to7.
2. Load the production skill registry and resolve either alias.
3. Observe cooldown5 instead of authored7.

Expected: validated JSON owns the action and fixed minion body tuning. Preserve
the adopted P15 startup/cap/replacement behavior (one startup birth, CD5, up to
two living minions,40HP/Attack10, no owner Attack inheritance or death refund).
Actual: builder and summon template hardcode action/body numbers outside JSON.
Workaround: change TypeScript; no player workaround required for current numbers.

Evidence: retained packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-monster-summon-h7pc3wc6`;
`red.json`/`red.log`, source preimages and scope/security plan. The one causal
test fails on cooldown5≠7 before production edits. Affects generic Summon Adds
consumers including Warped Shaman, Coldworm and Radament. No balance signoff.

Resolution: `monster-summon.ts` validates the existing action row and new
`summons/monster` definition, copies immutable native action/body tuning, and
feeds the existing registry/factory boundaries. Removed the final generic
monster builder and inline minion stats. The action row now explicitly authors
its free cost and template identity; a closed schema rejects unsupported paths.
Shared combat/status, Spirit of Barbs base stats and all monster loadouts stay
unchanged. No save-format change.

Verification: two causal failures (catalog cooldown and minion body authority)
become two passes;25definition cases and six selected existing native/body
controls pass (33distinct total). Scoped strict721files/zero diagnostics, lint,
strict50-row skill schema and the new body/action schema pass. Test-only readonly
mutation/dynamic-delete issues were corrected; only those two cases reran.
Initial missing-data config failure and schema-edit assertion remain in packet;
neither is counted as causal evidence. All handles terminal; cleanup verified.
See [evidence](../../docs/plans/evidence/p15-native-monster-summon.md).
