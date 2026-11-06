# P15 — Native generic monster melee

BUG-768 is fixed locally, uncommitted: Weak/Strong Melee now use validated authored JSON through the existing native direct-action resolver. Hardcoded defaults are removed. Damage 10–15/30–50, cooldown 1, free cost, immediate melee delivery and both aliases are preserved. No current authored monster loadout uses these actions.

Root retains `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-native-monster-melee-9cf7cadm` through full-v1 acceptance and owns eventual cleanup. The packet holds scope/security, baseline preimages, two causal RED failures, 28 new GREEN cases, 12 selected existing controls, strict scoped types (715 files, zero diagnostics), lint, strict 50-row schema validation and source review. Unsupported melee semantics are rejected. Constructed native consumers prove deterministic hits and free cost; they earn no campaign/balance credit.

One closed schema rule and two explicit zero-mana costs are the only data/schema changes. Shared combat/status/registry remain byte-identical. An initial insertion assertion stopped before schema/data writes and is recorded honestly. All handles are terminal; no disposable build/server/browser artifacts were created. Historical 14/14 Normal completions, 210 checkpoint sources and formal balance acceptance 0/210 are unchanged. Full private v1 remains unfinished.
