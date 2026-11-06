# P12b — Earned gem fusion and Lore integration

Verified 2026-11-04 on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited local changes. This completes an earned integration slice; no production defect was found and no production code changed. Full P12b, economy, acquisition-family coverage and independent acceptance remain open.

The genuine completed Fire Sorceress [Acts IV–V export](p15-fire-act4-and-act5-completion.md) was imported unchanged through Settings. Source SHA256: `7966c07f744fcd1b4e04bf11eb217c47365adce92aa26909aaa99fc1097811fe`. This is a version33, level53 save, with all five Normal acts complete and next Normal ordinal921. No state injection, combat, farming, leveling, recruitment, respec or campaign admission occurs in this slice.

## Native actions and conserved state

Installed JavaScript Playwright drove Chromium against the native Vite source application with `NODE_ENV=production`; the observer rejects an exposed test bridge. This is native source-browser verification, not a production bundle or PWA check.

1. Equip the earned plain one-socket Armet `it-3buzk-zn7` for a baseline, then restore the original helmet.
2. Preview and cancel diamond fusion: gameplay remains identical.
3. Fuse three flawless diamonds and one gem shard into one perfect diamond; socket it into that same Armet and equip it.
4. Establish a plain baseline for the earned two-socket Armet `it-1bbus-znh`, restore the original helmet, then insert Ort followed by Sol. The item becomes `runewords/lore`; equip it.
5. Save, close the page, open a new page and Continue. All gameplay domains match the final equipped state exactly.

Both Armet bases require level45 and are legal at level53. A proposed zircon caster amulet required level60 and was rejected before gameplay action; no eligibility bypass or extra preparation was used. Equip swaps preserve the inherited accessible overflow of185 backpack and318 stash items.

| Check | Result |
| --- | --- |
| Four economic confirmations | Public UI double-clicks each commit once; exact action receipts896–899, starting ordinal895 |
| Final material costs | Flawless diamond79→76, Ort81→80, Sol43→42; gem shard3→2 |
| Perfect diamond | Absent initially and finally: created once, consumed once |
| Conservation | All other materials/currencies, item identities/counts and unselected gameplay preserved; map ordinals stay Normal921/Nightmare0/Hell0 |
| Independent retained-output audit | Exact imported gameplay,13 intermediate transitions, ordered equipment swaps, receipts, final balances and final reload reconcile |
| Browser observations |14 exported stages, zero errors/warnings; English360×640 and Chinese1280×800 crafting geometry have no measured document/panel horizontal overflow; measured controls meet44px minimum |

Export timestamps, actual online/idle clocks and explicit locale changes are metadata exceptions. These observations do not establish whole-app accessibility or pacing acceptance. The mobile element screenshot has framing occlusion; measured geometry, rather than that capture, supports the bounded layout result.

## Actual combat-module composition

An explicitly off-browser diagnostic loads the unmodified UI exports through production `playerToCombatUnit` and `resolveDamage`. It neither injects browser state nor admits a campaign battle.

| Same-base comparison | Observed effect |
| --- | --- |
| Diamond helmet | Magic Resist50→60; all other derived stats unchanged |
| Deterministic1000-base Arcane hit, seed1, dodge/crit disabled | Final damage220→210 |
| Lore helmet | Maximum mana680→694; recovery39.728→41.704/sec |
| Continued save | Combat unit exactly equals the pre-close Lore unit |

Lore Energy191→201 crosses the200 soft cap, accounting for the14 maximum-mana gain. Raw lightning resistance87→147 and physical resistance75→82 are also observed; resistance caps can limit practical damage reduction. No full-battle, build-viability, active-hour or balance-matrix credit is claimed.

## Evidence and cleanup

Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-earned-crafting-vlpcc4z5`. It retains the reviewed plan/security result, executable browser observer, previews,14 stage exports, separate audit, production-module projection,20 source hashes, screenshots and cleanup receipt. Final `continued.native-export.json` SHA256: `02cf24871b400ce8aaef8fe7176e0797e478c69a70baea8187dd1583d94ebdd5`.

The first launch inherited development mode; bridge detection stopped the preflight before creation/import/economic action. That failed preflight remains retained. Its owned server was stopped, and the native-source server was restarted with the explicit production environment. An initial expected Lore mana delta was corrected before economic execution. These were setup corrections, not gameplay retries.

Owned server sessions12255/44122 exit0; browser95392 exits1 before gameplay, successful browser99774 and projection87705 exit0. Both recorded server PIDs3662782/3664243 and task-profile Chromium are absent, port5173 closed. Exact task browser-profile/vite-cache/projection-cache directories were removed and verified absent. `cleanup.json` reports remaining disposables[] and cleanup failures[]. Root retains this required packet and the existing claimed human2 worktree through umbrella review, then owns removal/release.

Counts remain14/14 intended ActI,7/14 five-act Normal and formal balance0/210. Full private-v1 remains active/incomplete. No broad suite/build, earlier-act replay, new agent, installation, CI, commit, push or publication. Human extended playtest remains reserved for the user.
