# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fresh-native.spec.ts >> fresh current-runtime native earned Sorceress through conditional Act II and Continue
- Location: ../../zai-temp/d2h5-fresh-act2-vtu72tc9/fresh-native.spec.ts:222:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "Victory! All enemies are defeated."
Received: "The battle ends in a draw."
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation "Main navigation" [ref=e4]:
    - list [ref=e5]:
      - listitem [ref=e6]:
        - link "Town" [ref=e7] [cursor=pointer]:
          - /url: /town
          - generic [ref=e8]: 🏰
          - generic [ref=e9]: Town
      - listitem [ref=e10]:
        - link "Map" [ref=e11] [cursor=pointer]:
          - /url: /map
          - generic [ref=e12]: 🗺️
          - generic [ref=e13]: Map
      - listitem [ref=e14]:
        - link "Combat" [ref=e15] [cursor=pointer]:
          - /url: /combat
          - generic [ref=e16]: ⚔️
          - generic [ref=e17]: Combat
      - listitem [ref=e18]:
        - link "Inventory" [ref=e19] [cursor=pointer]:
          - /url: /inventory
          - generic [ref=e20]: 🎒
          - generic [ref=e21]: Inventory
      - listitem [ref=e22]:
        - link "Skills" [ref=e23] [cursor=pointer]:
          - /url: /skills
          - generic [ref=e24]: ✨
          - generic [ref=e25]: Skills
      - listitem [ref=e26]:
        - link "Mercs" [ref=e27] [cursor=pointer]:
          - /url: /mercs
          - generic [ref=e28]: 🛡️
          - generic [ref=e29]: Mercs
      - listitem [ref=e30]:
        - link "Quests" [ref=e31] [cursor=pointer]:
          - /url: /quests
          - generic [ref=e32]: 📜
          - generic [ref=e33]: Quests
      - listitem [ref=e34]:
        - link "Settings" [ref=e35] [cursor=pointer]:
          - /url: /settings
          - generic [ref=e36]: ⚙️
          - generic [ref=e37]: Settings
  - generic [ref=e38]:
    - banner [ref=e39]:
      - generic [ref=e40]: Settings
      - button "Earned Act I · Level 13. Open character sheet." [ref=e42] [cursor=pointer]:
        - generic [ref=e44]: "13"
        - generic [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]: Earned Act I
            - generic [ref=e48]: Level 13
          - generic [ref=e49]:
            - generic [ref=e50]: HP
            - progressbar "HP" [ref=e51]
          - generic [ref=e53]:
            - generic [ref=e54]: MP
            - progressbar "MP" [ref=e55]
          - generic [ref=e57]:
            - generic [ref=e58]: XP
            - progressbar "XP" [ref=e59]
    - main [ref=e61]:
      - generic [ref=e62]:
        - generic [ref=e63]:
          - heading "Language" [level=2] [ref=e64]
          - generic [ref=e65]:
            - button "简体中文" [ref=e66] [cursor=pointer]
            - button "English" [pressed] [ref=e67] [cursor=pointer]
        - generic [ref=e68]:
          - generic [ref=e69] [cursor=pointer]:
            - generic [ref=e70]:
              - generic [ref=e71]: Stealth Mode
              - generic [ref=e72]: Hide icons and colors for workplace discretion
            - checkbox "Stealth Mode" [ref=e73]
          - generic [ref=e75] [cursor=pointer]:
            - generic [ref=e77]: Sound
            - checkbox "Sound" [checked] [ref=e78]
          - generic [ref=e80] [cursor=pointer]:
            - generic [ref=e82]: Music
            - checkbox "Music" [checked] [ref=e83]
        - generic [ref=e84]:
          - heading "Save Management" [level=2] [ref=e85]
          - generic [ref=e86]:
            - button "Save" [ref=e87] [cursor=pointer]
            - button "Export Save" [active] [ref=e88] [cursor=pointer]
            - button "Import Save" [ref=e89] [cursor=pointer]
            - button "Delete Save" [ref=e90] [cursor=pointer]
        - generic [ref=e91]:
          - link "☕ Buy me a coffee" [ref=e92] [cursor=pointer]:
            - /url: https://www.buymeacoffee.com/
          - generic [ref=e93]: "Version: 0.1.0"
      - status [ref=e94]: Save exported
```

# Test source

```ts
  46  |         db.close();
  47  |         if (!record) reject(new Error('No committed character'));
  48  |         else resolve(record.data);
  49  |       };
  50  |     };
  51  |   }));
  52  | }
  53  | async function production(page: Page) {
  54  |   expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  55  |   expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  56  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  57  | }
  58  | async function tree(page: Page, skill: string) {
  59  |   await navTo(page, 'skills');
  60  |   await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  61  |   await page.getByTestId(`skill-node-${skill}`).click();
  62  |   return page.getByTestId('skill-detail-panel');
  63  | }
  64  | async function slots(page: Page, english: boolean, selected: readonly string[]) {
  65  |   await navTo(page, 'skills');
  66  |   await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  67  |   for (let slot = 1; slot <= 9; slot += 1) {
  68  |     const select = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true });
  69  |     await select.selectOption(selected[slot - 1] ?? '');
  70  |     await expect(select).toHaveValue(selected[slot - 1] ?? '');
  71  |   }
  72  |   await production(page);
  73  | }
  74  | async function countMonsters(cards: Locator) {
  75  |   let count = 0;
  76  |   for (const card of await cards.all()) {
  77  |     const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
  78  |     expect(await badge.count()).toBeLessThanOrEqual(1);
  79  |     count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  80  |   }
  81  |   return count;
  82  | }
  83  | async function enter(page: Page, english: boolean, area = 'a1-blood-moor') {
  84  |   await navTo(page, 'map');
  85  |   budget();
  86  |   expect(launchCount).toBeLessThan(149);
  87  |   const act = /^a([12])-/.exec(area)?.[1];
  88  |   expect(act).toBeDefined();
  89  |   const heading = page.getByRole('button', { name: new RegExp(`^Act ${act} ·`) });
  90  |   if (await heading.getAttribute('aria-expanded') !== 'true') await heading.click();
  91  |   await page.getByTestId(`sub-area-row-${area}`)
  92  |     .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  93  |   launchCount += 1;
  94  |   await expect(page.getByTestId('combat-screen')).toBeVisible();
  95  |   expect(await wave(page)).toBe(1);
  96  | }
  97  | async function wave(page: Page) {
  98  |   const value = /^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1];
  99  |   if (!value) throw new Error('Missing numeric wave');
  100 |   return Number(value);
  101 | }
  102 | async function pause(page: Page, english: boolean) {
  103 |   await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  104 |   await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }))
  105 |     .toHaveAttribute('aria-pressed', 'true');
  106 | }
  107 | async function flee(page: Page, english: boolean) {
  108 |   await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
  109 |   await expect(page.getByTestId('map-screen')).toBeVisible();
  110 | }
  111 | const evidenceOccurrences=new Map<string,number>();
  112 | async function attach(info: TestInfo, label: string, value: unknown) {
  113 |   const occurrence=evidenceOccurrences.get(label)??0;evidenceOccurrences.set(label,occurrence+1);
  114 |   const artifact=`${label}${occurrence?`-${occurrence}`:''}.json.gz`;
  115 |   await writeFile(`${raw}/${artifact}`, gzipSync(JSON.stringify(value)),{flag:'wx'});
  116 |   await appendFile(`${raw}/progress.jsonl`, JSON.stringify({ label, artifact, at: new Date().toISOString(), player: value?.player ? { level:value.player.level, experience:value.player.experience, skillPoints:value.player.skillPoints, statPoints:value.player.statPoints } : undefined }) + '\n');
  117 | }
  118 | /** One readonly DOM observation before native inter-wave navigation can replace it. */
  119 | async function terminalDOM(page: Page) {
  120 |   return page.evaluate(() => {
  121 |     const hero = document.querySelector('[data-testid="unit-card-player-1792497600000"]');
  122 |     const log = Array.from(document.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent);
  123 |     return {
  124 |       waveText: document.querySelector('[data-testid="wave-counter"]')?.textContent,
  125 |       waveKind: document.querySelector('[data-testid="wave-kind-label"]')?.textContent,
  126 |       heroPresent: hero !== null,
  127 |       heroDead: hero?.getAttribute('data-dead') ?? null,
  128 |       liveEnemies: document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]:not([data-dead="true"])').length,
  129 |       defeatPanels: document.querySelectorAll('[data-testid="defeat-panel"]').length,
  130 |       deadMerc: document.querySelectorAll('[data-testid="allies-grid"] [data-kind="merc"][data-dead="true"]').length,
  131 |       skipDisabled: document.querySelector<HTMLButtonElement>('[data-testid="skip-button"]')?.disabled,
  132 |       log,
  133 |       mp: document.querySelector('[role="group"][aria-label="MP"] [role="progressbar"]')?.getAttribute('aria-valuenow'),
  134 |       cards: Array.from(document.querySelectorAll('[data-testid^="unit-card-"]'), card => ({
  135 |         id: card.getAttribute('data-testid'), kind: card.getAttribute('data-kind'),
  136 |         dead: card.getAttribute('data-dead'), hp: card.querySelector('.bg-red-600')?.getAttribute('style'), text: card.textContent
  137 |       })),
  138 |       allies: document.querySelector('[data-testid="allies-grid"]')?.textContent,
  139 |       enemies: document.querySelector('[data-testid="enemies-grid"]')?.textContent
  140 |     };
  141 |   });
  142 | }
  143 | function expectTerminal(result: Awaited<ReturnType<typeof terminalDOM>>, expectedWave: number) {
  144 |   expect(Number(/^\D*(\d+)/.exec(result.waveText ?? '')?.[1])).toBe(expectedWave);
  145 |   expect(result.skipDisabled).toBe(true);
> 146 |   expect(result.log.at(-1)).toBe('Victory! All enemies are defeated.');
      |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  147 |   expect(result.defeatPanels).toBe(0);
  148 |   expect(result.liveEnemies).toBe(0);
  149 |   expect(result.heroPresent).toBe(true);
  150 |   expect(result.heroDead).not.toBe('true');
  151 | }
  152 | /** Failed-wave diagnostics only. Preserve the first terminal assertion even if export/comparison fails. */
  153 | async function expectTerminalOrStop(page,result,expectedWave,lastEarned,area,label,info) {
  154 |   try { expectTerminal(result,expectedWave); }
  155 |   catch(nonwin) {
  156 |     const diagnostic={primaryError:String(nonwin),area,wave:expectedWave,terminal:result,
  157 |       exportCaptured:false,zeroFailedWaveAwards:false,comparisonError:null,diagnosticErrors:[]};
  158 |     // Terminal DOM was captured synchronously before this function; screenshot also precedes navigation.
  159 |     try {await attach(info,`${label}-nonwin-terminal`,result);} catch(error) {diagnostic.diagnosticErrors.push(String(error));}
  160 |     try {await info.attach(`${label}-nonwin-screen`,{body:await page.screenshot(),contentType:'image/png'});} catch(error) {diagnostic.diagnosticErrors.push(String(error));}
  161 |     try {
  162 |       const expected=structuredClone(lastEarned);
  163 |       expected.map.currentAct=Number(/^a([12])-/.exec(area)?.[1]);
  164 |       expected.map.currentSubAreaId=area; // Ordinary Enter uses the short alias; no other expected mutation.
  165 |       const failed=await backup(page);diagnostic.exportCaptured=true;
  166 |       await attach(info,`${label}-nonwin-export`,failed);
  167 |       await attach(info,`${label}-nonwin-last-earned-expectation`,expected);
  168 |       const equal=isDeepStrictEqual;
  169 |       diagnostic.awards={
  170 |         heroXP:heroXP(failed)-heroXP(lastEarned),mercXP:mercXP(failed)-mercXP(lastEarned),
  171 |         skillPoints:failed.player.skillPoints-lastEarned.player.skillPoints,
  172 |         statPoints:failed.player.statPoints-lastEarned.player.statPoints,
  173 |         itemsUnchanged:equal(failed.inventory.backpack,lastEarned.inventory.backpack)&&equal(failed.inventory.stash,lastEarned.inventory.stash)&&equal(failed.inventory.equipped,lastEarned.inventory.equipped)&&equal(failed.mercs.mercEquipment,lastEarned.mercs.mercEquipment),
  174 |         currenciesUnchanged:equal(failed.inventory.currencies,lastEarned.inventory.currencies),
  175 |         questItemsUnchanged:equal(failed.inventory.questItems,lastEarned.inventory.questItems),
  176 |         questsUnchanged:equal(failed.map.questProgress,lastEarned.map.questProgress),
  177 |         clearsUnchanged:equal(failed.map.clearedSubAreas,lastEarned.map.clearedSubAreas),
  178 |         wholeSaveUnchangedExceptEnteredLocation:equal(failed,expected)
  179 |       };
  180 |       diagnostic.zeroFailedWaveAwards=diagnostic.awards.heroXP===0&&diagnostic.awards.mercXP===0&&
  181 |         diagnostic.awards.skillPoints===0&&diagnostic.awards.statPoints===0&&
  182 |         diagnostic.awards.itemsUnchanged&&diagnostic.awards.currenciesUnchanged&&diagnostic.awards.questItemsUnchanged&&
  183 |         diagnostic.awards.questsUnchanged&&diagnostic.awards.clearsUnchanged&&diagnostic.awards.wholeSaveUnchangedExceptEnteredLocation;
  184 |       try {expect(failed).toEqual(expected);} catch(error) {diagnostic.comparisonError=String(error);}
  185 |     } catch(error) {diagnostic.diagnosticErrors.push(String(error));}
  186 |     try {await attach(info,`${label}-nonwin-zero-awards-classification`,diagnostic);} catch(error) {diagnostic.diagnosticErrors.push(String(error));}
  187 |     throw nonwin; // Never proceed, including when diagnostic export/equality itself fails.
  188 |   }
  189 | }
  190 | function expectPlayer(actual: SaveCurrent, configured: SaveCurrent, totalXP: number, fireRank: number, spent: number, questPoints = 0) {
  191 |   const level = totalXP >= 11013 ? 6 : totalXP >= 5423 ? 5 : totalXP >= 2223 ? 4 : totalXP >= 665 ? 3 : totalXP >= 100 ? 2 : 1;
  192 |   expect(actual.player).toEqual({ ...configured.player, level, experience: totalXP - (reachXP[level] ?? -1),
  193 |     experienceToNextLevel: nextXP[level], statPoints: (level - 1) * 5,
  194 |     skillPoints: level - 1 - spent + questPoints,
  195 |     skillLevels: { ...ranks, 'sorceress.fire_bolt': fireRank },
  196 |     derivedStats: { ...configured.player.derivedStats, lifeMax: 120 + 8 * (level - 1),
  197 |       manaMax: 102 + 4 * (level - 1), attack: 22 + 2 * (level - 1), defense: 20 + 3 * (level - 1) } });
  198 | }
  199 | function expectMerc(actual: SaveCurrent, hired: SaveCurrent, earnedXP: number, equipment = hired.mercs.mercEquipment) {
  200 |   const initial = hired.mercs.ownedMercs[0];
  201 |   if (!initial) throw new Error('Missing normally hired mercenary');
  202 |   let level = 3;
  203 |   let xp = earnedXP;
  204 |   const threshold = (rank: number) => Math.floor(60 * rank * 1.3 ** (rank - 1));
  205 |   while (xp >= threshold(level)) { xp -= threshold(level); level += 1; }
  206 |   const gains = level - 3;
  207 |   expect(actual.mercs).toEqual({ ...hired.mercs, mercEquipment: equipment,
  208 |     ownedMercs: [expectedRogueGrowth(initial, gains)],
  209 |     mercProgress: { [merc]: { experience: xp, experienceToNextLevel: threshold(level) } } });
  210 | }
  211 | // Independently frozen literals from accepted merc-gear-earned.spec.ts; no item injection.
  212 | const mercGlove: Item = { id: 'it-8jv2k-1', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 4 }, affixes: [], generatedName: {}, identified: true, equipped: false };
  213 | const heroGlove: Item = { id: 'it-96fga-3', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 5 }, affixes: [], generatedName: {}, identified: true, equipped: false };
  214 | const heroBoots: Item = { id: 'it-5iwwr-4', baseId: 'items/base/boot-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 3 }, affixes: [], generatedName: {}, identified: true, equipped: false };
  215 | 
  216 | const heroCap: Item = {"id":"it-71emu-12","baseId":"items/base/helm-cap","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":8},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  217 | const heroBow: Item = {"id":"it-8n9ca-1b","baseId":"items/base/weapon-bow-training","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"attack":17},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  218 | const mercCap: Item = {"id":"it-71emu-1a","baseId":"items/base/helm-cap","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":8},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  219 | const mercBetterGlove: Item = {"id":"it-96fga-8","baseId":"items/base/glove-leather","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":5},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  220 | const mercBoots: Item = {"id":"it-5iwwr-9","baseId":"items/base/boot-leather","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":3},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  221 | 
  222 | test('fresh current-runtime native earned Sorceress through conditional Act II and Continue', async ({ page, context }, info) => {
  223 |   for(const previous of ['outcome.json','progress.jsonl','wave-awards.jsonl']) {
  224 |     let exists=true;try {await access(`${raw}/${previous}`);} catch(error) {if(error.code==='ENOENT') exists=false;else throw error;}
  225 |     expect(exists,`Fresh invocation refuses pre-existing ${previous}`).toBe(false);
  226 |   }
  227 |   wallStarted = Date.now(); launchCount = 0;
  228 |   const english = true;
  229 |   const errors: string[] = [];
  230 |   const watch = (watched: Page) => {
  231 |     watched.on('pageerror', error => errors.push(error.message));
  232 |     watched.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
  233 |   };
  234 |   watch(page);
  235 |   let active = page;
  236 |   let diagnosticFailure: Error | undefined;
  237 |   const helper = await createGearHelper();
  238 |   try {
  239 |     await page.clock.setFixedTime(fixedTime); // Date only; timers remain native.
  240 |     await page.goto('/');
  241 |     await createCharacter(page, { class: 'sorceress', name });
  242 |     await navTo(page, 'settings');
  243 |     await page.getByRole('button', { name: 'English', exact: true }).click();
  244 |     await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
  245 |     const fresh = await backup(page);
  246 |     await attach(info, 'fresh', fresh);
```