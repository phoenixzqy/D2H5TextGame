# D08 — Champion and rare-leader live equipment

BUG685 reproduces six real-pool failures. Implement drop-tables §2/§3/§4.6–4.8
at the live award boundary. The more specific drop contract governs over the
older monster-spec summary. Current champion means champion; rare-elite means
unique leader. Leave legacy elite/rare-minion and special boss/goblin contexts
unchanged in this slice.

For configured ordinary trash/champion/unique tables in each actual act,
champions attempt two equipment-only trash-source picks with minimum+2. Rare
leaders attempt three with minimum+3, then one independent jewelry-source pick.
Ordinary noDrop is champion.20/.12/.06 and leader.10/.05/0 for Normal/Nightmare/
Hell; jewelry is noDrop0. Apply rarity multipliers1.5/2/3 and2/3/6, keeping
existing rare-elite MF bonus and post-curve offline MF. Item level remains the
actual enemy level. Fixed special rarity rows stay fixed.

Only terminal equipment bands extend to finite per-act caps59/72/87/101/122,
covering the observed current native/replay levels. Do not revive expired early
bases or shift item level to bypass the minimum. Valid low-level champions may
have no eligible ordinary equipment (observed level2); attempted picks then
produce none, as the source filter requires. Guaranteed jewelry must be eligible
and materializable; missing/invalid configured sources refuse before reward
publication. Prepare all sources before drawing. Keep raw TC JSON and explicit
quest caches unchanged. Recognized source/act mismatches refuse; unconfigured
tables retain baseline source selection, pick counts and noDrop; corrected tier
rarity weights apply globally, including unconfigured live sources. Explicit
quest caches use their existing chapter-boss rarity context. No persistence or
earned-save change.

Add a closed schema before authored JSON and integrate its validator with the
existing browser precompilation catalog. Reuse rollDrops/materialization and
whole-wave settlement. Verify original repro, exact noDrop/qlvl boundaries,
source selection/weights, jewelry, MF, finite cap, low-level emptiness, actual
spawn coverage, deterministic next RNG, cache/special-source isolation, schema
refusal and native publication/refusal/restoration. Affected checks only; no
campaign reruns, full suite, installs, new agents, commits or publication.

Plan review: ready after including difficulty noDrop, low-level empty pools,
finite eligibility, browser schema precompilation and native shared-wave binding.
This changes future reward entropy; historical earned evidence stays historical.
Security check: pass; bounded local authored rewards and existing settlement,
without network/credential/dependency/CI/permission changes. Formal economy,
pacing, miniboss/trash reward requirements and balance acceptance stay open.
