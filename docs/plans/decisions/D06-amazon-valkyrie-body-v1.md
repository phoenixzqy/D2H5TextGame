# D06 — Amazon Valkyrie body data

Author contract, 2026-10-26; independent design/QA and earned balance remain open.

The native paid Valkyrie already creates a body. This change moves its unchanged base stats out of skills/summons.ts into complete strict schema-validated src/data/summons/amazon.json. The shared body lookup must feed both buildSummon and skill previews. No TS numeric fallback or duplicate stat table remains for Valkyrie.

Preserve literal rank 1/6/20 life 200/270/466, Attack 40/55/97 and Defense 20/30/58. All ranks retain 0 MP, AS70, crit .05/1.5, dodges .05, zero finds and all six elemental/physical resistances zero. MagicResist continues to come from the shared mitigation definition. Existing skill-authored growth +14life/+3Attack/+2Defense, 25 MP cost, 2s CD, actual level30 unlock, Decoy/Evade prerequisites and cap20 stay. The stale minLevel18 metadata does not supersede requiredLevel30. No gameplay retune, save migration or independent balance approval is implied.

Validate complete fields, finite bounded numbers, exact owner/template IDs, no unknown properties, all six resistances and positive life. Copy/deep-freeze resolved definitions without freezing the caller; return fresh mutable runtime stat/resistance copies. Unknown summon IDs remain with their current owner. Preserve source/target authority, paid-body lifecycle, replay/RNG and native save behavior.

Before extraction: three independent literal rank/body/preview compatibility cases pass (valkyrie-before-extraction receipt) at ae60f9cd. Existing support diagnostic retains actual paid native rank1/20 Valkyrie body controls. Required next proof: complete schema/resolver rejection/copy tests, unchanged literal bodies/previews, actual buildSummon equality, affected/native checks, engine/static and public summon proof before inventory credit. No new credit from moving data alone.

Root owns the active d2h5-amazon-support-ssrbktv_ task through all support/evidence consumers. No campaign, genuine replay, remote action, dependency or CI change. Security check: pass; first-party local JSON extraction and tests only. No delegation or independent self-approval.

Implementation: fcf8503c. Native/public a75e1036 and lifecycle d90c002f pass. [Bounded evidence](../evidence/d06-amazon-valkyrie.md) records complete schema/copy/body oracles and production/browser/save limits. Combined support unit gate and retention remain pending; independent design/QA and earned balance remain open.
