# P04a04b — Failed ordinary-earned Den discovery

Status: failed experiment, 2026-10-20. No Den browser acceptance and no
combat defect established. Root/producer/QA independently confirmed the loss.
Input/runtime head5f14aa7; no runtime/data/locale changes were made.

The approved discovery used ordinary production controls, fixed Date only
2026-10-20T12:00:00.000Z, native timers, English/Chromium desktop1280×800.
Fresh Sorceress, free fielded Inner Sight, Fire Bolt1, exactly13 first-wave
Blood Moor wins, then three earned skill points to Fire4. No stat spending,
equipment, storage writes, imported fixtures, runtime application imports,
seed/ordinal resets, extra victories or fallback route. Producer/QA approved
the frozen source and bounded single discovery before execution.

Frozen [candidate](fixtures/p04a04b-failed-discovery-spec.ts.txt) SHA256
4e7354a8a55a1c062f1a3df19398cca2560a5d5120ad89edcbdd1474974536a5;
[config](fixtures/p04a04b-failed-discovery-config.ts.txt) SHA256
0279cb224974980d6d54b0c9a2bd02af96b9abcbea7406146b728776db121f79.
These are non-discovered experimental evidence, explicitly failed. Their
assertions remain intact. After independent triage, only this task's candidate
and whitelist addition were removed from the active runner; accepted tests
and runtime are unchanged. This is abandonment of an unproven preparation
recipe, not a passed test, disabled regression or acceptance-criterion removal.
A future Den recipe requires new independent design review.

All13 prep payloads were independently audited:182kills/3640XP, L4XP1417,
15stat points,3spare skills before Fire4; mercL6XP1043/1336,113items/1694shards.
Prepared/tracked full payloads agree exactly with ordinary actions. DenW1
qualified victory grants240heroXP/180mercXP,4items/118inventory rune-shards;
totals117items/1812shards, no clear/return/claim progress. W1 log has181lines,
including21hero/15merc damage. W2 is a genuine native defeat: merc falls,
then hero falls, with seven enemies alive. Its rendered log is capped200lines;
do not infer whole-fight damage totals from that partial log.

The [outcome](fixtures/p04a04b-failed-discovery-outcome.json) preserves the exact
native W2 log/allies, fixed source hashes and decisive counts. Raw report SHA256
7b83e375928ff5005422985c61cc055148bdae2f0d788ddea1788f4ad5ac3e59;
log SHAdcc9eea733437e30f13cb77b29a44488dc525503fba912c1c8db68eebdb10408.
Exit1,0passed/1failed/0skipped/0retry/0flaky, case47.791s/runner60.260506s.
Browser warning/error/pageerror collection is empty. No dialogue completion,
claim, save or reopen was reached. No four-case matrix was run.

Native cards expose counts/names/HP, not levels/details (CombatScreen577–580,
698–745). Effective levels3/4/7/7 are source-derived, not observed DOM levels.
Den's three nonboss templates and finalEliteWaves2 force W2 champion
(sub-area-run245–263,388–394), sharing lightning affix497–509;
elite-config's lightning skill is appended through combatHelpers250.
Shaman fire resistance/defense and carried resources make the sole-Fire,
unequipped recipe a plausible poor matchup. No tuning, removed affix or
stronger retry follows from this experiment.

An independent progression gap was confirmed: CharacterScreen145–185 only
shows unspent attributes; production source has no caller of allocateStatPoint.
That store action also fails to recompute derived stats. Producer approved a
separate bounded stat-allocation design/RED, with authoritative equipment and
current HP/MP preservation. This does not promise Den survival.

Exact discovery command (RAW is the task-owned root below):

```sh
env FONTCONFIG_FILE="$RAW/fontconfig.xml" XDG_CACHE_HOME="$RAW/xdg-cache" \
  PLAYWRIGHT_BROWSERS_PATH=/home/felixzhao/.cache/ms-playwright PWA_PORT=4394 \
  PLAYWRIGHT_JSON_OUTPUT_NAME="$RAW/discovery-01-report.json" \
  npx playwright test --config tests/pwa/playwright.config.ts den-earned \
  --project pwa-desktop --grep ' en$' --output "$RAW/discovery-01-results" \
  --trace off --reporter=line,json
```

Each run builds via check:test-bridge-shake and owns its preview lifecycle.
Candidate TypeScript and explicit ignored-PWA lint04 pass. Build warnings remain:
Browserslist age, >500KB main chunk,2.57MB optional manifest outside precache;
Node NO_COLOR/FORCE_COLOR notices are runner output, not browser errors.
Task-local Noto Sans CJK SC SHA256
2c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b
matches prior accepted font setup; no shared installation changed.

Raw root /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-den-earned-tp99b4fa
was removed after producer, QA and design independently approved the archive
and released retention. Exact task outputs/font/cache and taskdist/.vite were
removed and absence verified; preview port4394 is closed. Versioned fixtures
remain as required diagnostic evidence. Original checkout remains clean.
Full P04/D11/campaign/C0–C4/G0–G7 remain unaccepted. No push or PR.
