# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fresh-native.spec.ts >> joined fresh native mobile Sorceress through Andariel quest and Continue
- Location: ../../zai-temp/d2h5-native-early-boundary/fresh-native.spec.ts:175:1

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
      - button "Earned Act I · Level 12. Open character sheet." [ref=e42] [cursor=pointer]:
        - generic [ref=e44]: "12"
        - generic [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]: Earned Act I
            - generic [ref=e48]: Level 12
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
  34  |     const open = indexedDB.open('D2H5TextGame');
  35  |     open.onerror = () => { reject(new Error('Could not open saved character')); };
  36  |     open.onsuccess = () => {
  37  |       const db = open.result;
  38  |       const get = db.transaction('saves', 'readonly').objectStore('saves').get('current');
  39  |       get.onerror = () => { db.close(); reject(new Error('Could not read saved character')); };
  40  |       get.onsuccess = () => {
  41  |         const record = get.result as { data: SaveCurrent } | undefined;
  42  |         db.close();
  43  |         if (!record) reject(new Error('No committed character'));
  44  |         else resolve(record.data);
  45  |       };
  46  |     };
  47  |   }));
  48  | }
  49  | async function production(page: Page) {
  50  |   expect(await page.evaluate(() => '__GAME__' in window)).toBe(false);
  51  |   expect(await page.evaluate(() => navigator.serviceWorker.controller?.state)).toBe('activated');
  52  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  53  | }
  54  | async function tree(page: Page, skill: string) {
  55  |   await navTo(page, 'skills');
  56  |   await page.locator('[role="tab"][aria-controls="tabpanel-tree"]').click();
  57  |   await page.getByTestId(`skill-node-${skill}`).click();
  58  |   return page.getByTestId('skill-detail-panel');
  59  | }
  60  | async function slots(page: Page, english: boolean, selected: readonly string[]) {
  61  |   await navTo(page, 'skills');
  62  |   await page.locator('[role="tab"][aria-controls="tabpanel-active"]').click();
  63  |   for (let slot = 1; slot <= 9; slot += 1) {
  64  |     const select = page.getByRole('combobox', { name: `${english ? 'Slot' : '槽位'} ${String(slot)}`, exact: true });
  65  |     await select.selectOption(selected[slot - 1] ?? '');
  66  |     await expect(select).toHaveValue(selected[slot - 1] ?? '');
  67  |   }
  68  |   await production(page);
  69  | }
  70  | async function countMonsters(cards: Locator) {
  71  |   let count = 0;
  72  |   for (const card of await cards.all()) {
  73  |     const badge = card.locator(':scope > div:first-of-type > div').filter({ hasText: /^\+\d+$/ });
  74  |     expect(await badge.count()).toBeLessThanOrEqual(1);
  75  |     count += 1 + (await badge.count() ? Number((await badge.innerText()).slice(1)) : 0);
  76  |   }
  77  |   return count;
  78  | }
  79  | async function enter(page: Page, english: boolean, area = 'a1-blood-moor') {
  80  |   await navTo(page, 'map');
  81  |   const actOne = page.getByRole('button', { name: /^Act 1 ·/ });
  82  |   if (await actOne.getAttribute('aria-expanded') !== 'true') await actOne.click();
  83  |   await page.getByTestId(`sub-area-row-${area}`)
  84  |     .getByRole('button', { name: english ? 'Enter' : '进入', exact: true }).click();
  85  |   await expect(page.getByTestId('combat-screen')).toBeVisible();
  86  |   expect(await wave(page)).toBe(1);
  87  | }
  88  | async function wave(page: Page) {
  89  |   const value = /^\D*(\d+)/.exec(await page.getByTestId('wave-counter').innerText())?.[1];
  90  |   if (!value) throw new Error('Missing numeric wave');
  91  |   return Number(value);
  92  | }
  93  | async function pause(page: Page, english: boolean) {
  94  |   await page.getByRole('button', { name: english ? 'Pause' : '暂停', exact: true }).click({ timeout: 500 });
  95  |   await expect(page.getByRole('button', { name: english ? 'Resume' : '继续', exact: true }))
  96  |     .toHaveAttribute('aria-pressed', 'true');
  97  | }
  98  | async function flee(page: Page, english: boolean) {
  99  |   await page.getByRole('button', { name: english ? 'Flee' : '逃跑', exact: true }).click();
  100 |   await expect(page.getByTestId('map-screen')).toBeVisible();
  101 | }
  102 | async function attach(info: TestInfo, label: string, value: unknown) {
  103 |   await writeFile(`${raw}/${label}.json.gz`, gzipSync(JSON.stringify(value)));
  104 |   await appendFile(`${raw}/progress.jsonl`, JSON.stringify({ label, at: new Date().toISOString(), player: value?.player ? { level:value.player.level, experience:value.player.experience, skillPoints:value.player.skillPoints, statPoints:value.player.statPoints } : undefined }) + '\n');
  105 | }
  106 | /** One readonly DOM observation before native inter-wave navigation can replace it. */
  107 | async function terminalDOM(page: Page) {
  108 |   return page.evaluate(() => {
  109 |     const hero = document.querySelector('[data-testid="unit-card-player-1792497600000"]');
  110 |     const log = Array.from(document.querySelectorAll('[data-testid="combat-log"] > div > span:last-child'), node => node.textContent);
  111 |     return {
  112 |       waveText: document.querySelector('[data-testid="wave-counter"]')?.textContent,
  113 |       waveKind: document.querySelector('[data-testid="wave-kind-label"]')?.textContent,
  114 |       heroPresent: hero !== null,
  115 |       heroDead: hero?.getAttribute('data-dead') ?? null,
  116 |       liveEnemies: document.querySelectorAll('[data-testid="enemies-grid"] [data-testid^="unit-card-"]:not([data-dead="true"])').length,
  117 |       defeatPanels: document.querySelectorAll('[data-testid="defeat-panel"]').length,
  118 |       deadMerc: document.querySelectorAll('[data-testid="allies-grid"] [data-kind="merc"][data-dead="true"]').length,
  119 |       skipDisabled: document.querySelector<HTMLButtonElement>('[data-testid="skip-button"]')?.disabled,
  120 |       log,
  121 |       mp: document.querySelector('[role="group"][aria-label="MP"] [role="progressbar"]')?.getAttribute('aria-valuenow'),
  122 |       cards: Array.from(document.querySelectorAll('[data-testid^="unit-card-"]'), card => ({
  123 |         id: card.getAttribute('data-testid'), kind: card.getAttribute('data-kind'),
  124 |         dead: card.getAttribute('data-dead'), hp: card.querySelector('.bg-red-600')?.getAttribute('style'), text: card.textContent
  125 |       })),
  126 |       allies: document.querySelector('[data-testid="allies-grid"]')?.textContent,
  127 |       enemies: document.querySelector('[data-testid="enemies-grid"]')?.textContent
  128 |     };
  129 |   });
  130 | }
  131 | function expectTerminal(result: Awaited<ReturnType<typeof terminalDOM>>, expectedWave: number) {
  132 |   expect(Number(/^\D*(\d+)/.exec(result.waveText ?? '')?.[1])).toBe(expectedWave);
  133 |   expect(result.skipDisabled).toBe(true);
> 134 |   expect(result.log.at(-1)).toBe('Victory! All enemies are defeated.');
      |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  135 |   expect(result.defeatPanels).toBe(0);
  136 |   expect(result.liveEnemies).toBe(0);
  137 |   expect(result.heroPresent).toBe(true);
  138 |   expect(result.heroDead).not.toBe('true');
  139 | }
  140 | function expectPlayer(actual: SaveCurrent, configured: SaveCurrent, totalXP: number, fireRank: number, spent: number, questPoints = 0) {
  141 |   const level = totalXP >= 11013 ? 6 : totalXP >= 5423 ? 5 : totalXP >= 2223 ? 4 : totalXP >= 665 ? 3 : totalXP >= 100 ? 2 : 1;
  142 |   expect(actual.player).toEqual({ ...configured.player, level, experience: totalXP - (reachXP[level] ?? -1),
  143 |     experienceToNextLevel: nextXP[level], statPoints: (level - 1) * 5,
  144 |     skillPoints: level - 1 - spent + questPoints,
  145 |     skillLevels: { ...ranks, 'sorceress.fire_bolt': fireRank },
  146 |     derivedStats: { ...configured.player.derivedStats, lifeMax: 120 + 8 * (level - 1),
  147 |       manaMax: 102 + 4 * (level - 1), attack: 22 + 2 * (level - 1), defense: 20 + 3 * (level - 1) } });
  148 | }
  149 | function expectMerc(actual: SaveCurrent, hired: SaveCurrent, earnedXP: number, equipment = hired.mercs.mercEquipment) {
  150 |   const initial = hired.mercs.ownedMercs[0];
  151 |   if (!initial) throw new Error('Missing normally hired mercenary');
  152 |   let level = 3;
  153 |   let xp = earnedXP;
  154 |   const threshold = (rank: number) => Math.floor(60 * rank * 1.3 ** (rank - 1));
  155 |   while (xp >= threshold(level)) { xp -= threshold(level); level += 1; }
  156 |   const gains = level - 3;
  157 |   expect(actual.mercs).toEqual({ ...hired.mercs, mercEquipment: equipment, ownedMercs: [{ ...initial, level,
  158 |     coreStats: { ...initial.coreStats, strength: initial.coreStats.strength + gains,
  159 |       dexterity: initial.coreStats.dexterity + 3 * gains, energy: initial.coreStats.energy + gains },
  160 |     derivedStats: { ...initial.derivedStats, life: initial.derivedStats.life + 8 * gains,
  161 |       lifeMax: initial.derivedStats.lifeMax + 8 * gains } }],
  162 |     mercProgress: { [merc]: { experience: xp, experienceToNextLevel: threshold(level) } } });
  163 | }
  164 | // Independently frozen literals from accepted merc-gear-earned.spec.ts; no item injection.
  165 | const mercGlove: Item = { id: 'it-8jv2k-1', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 4 }, affixes: [], generatedName: {}, identified: true, equipped: false };
  166 | const heroGlove: Item = { id: 'it-96fga-3', baseId: 'items/base/glove-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 5 }, affixes: [], generatedName: {}, identified: true, equipped: false };
  167 | const heroBoots: Item = { id: 'it-5iwwr-4', baseId: 'items/base/boot-leather', rarity: 'normal', level: 2, ilvl: 2, baseRolls: { defense: 3 }, affixes: [], generatedName: {}, identified: true, equipped: false };
  168 | 
  169 | const heroCap: Item = {"id":"it-71emu-12","baseId":"items/base/helm-cap","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":8},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  170 | const heroBow: Item = {"id":"it-8n9ca-1b","baseId":"items/base/weapon-bow-training","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"attack":17},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  171 | const mercCap: Item = {"id":"it-71emu-1a","baseId":"items/base/helm-cap","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":8},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  172 | const mercBetterGlove: Item = {"id":"it-96fga-8","baseId":"items/base/glove-leather","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":5},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  173 | const mercBoots: Item = {"id":"it-5iwwr-9","baseId":"items/base/boot-leather","rarity":"normal","level":2,"ilvl":2,"baseRolls":{"defense":3},"affixes":[],"generatedName":{},"identified":true,"equipped":false};
  174 | 
  175 | test('joined fresh native mobile Sorceress through Andariel quest and Continue', async ({ page, context }, info) => {
  176 |   const english = true;
  177 |   const errors: string[] = [];
  178 |   const watch = (watched: Page) => {
  179 |     watched.on('pageerror', error => errors.push(error.message));
  180 |     watched.on('console', message => { if (['warning', 'error'].includes(message.type())) errors.push(message.text()); });
  181 |   };
  182 |   watch(page);
  183 |   let active = page;
  184 |   let diagnosticFailure: Error | undefined;
  185 |   const helper = await createGearHelper();
  186 |   try {
  187 |     await page.clock.setFixedTime(fixedTime); // Date only; timers remain native.
  188 |     await page.goto('/');
  189 |     await createCharacter(page, { class: 'sorceress', name });
  190 |     await navTo(page, 'settings');
  191 |     await page.getByRole('button', { name: 'English', exact: true }).click();
  192 |     await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state), { timeout: 60_000 }).toBe('activated');
  193 |     const fresh = await backup(page);
  194 |     await attach(info, 'fresh', fresh);
  195 |     expect(fresh.player).toMatchObject({ level: 1, experience: 0, statPoints: 0, skillPoints: 1, skillLevels: ranks });
  196 |     expect(fresh.inventory.backpack).toEqual([]);
  197 |     expect(fresh.inventory.equipped).toEqual({});
  198 |     const locked = await tree(page, frost);
  199 |     await expect(locked.getByRole('button', { name: 'Requires Lv. 6', exact: true })).toBeDisabled();
  200 |     expect(await backup(page)).toEqual({ ...fresh, player: { ...fresh.player, comboOrder: [ice] } });
  201 |     await navTo(page, 'mercs');
  202 |     await page.getByTestId(`hire-merc-${merc}`).getByRole('button', { name: 'Hire', exact: true }).click();
  203 |     const hired = await backup(page);
  204 |     await attach(info, 'hired', hired);
  205 |     expect(hired.inventory).toEqual(fresh.inventory);
  206 |     expect(hired.mercs.fieldedMercId).toBe(merc);
  207 |     expect(hired.mercs.ownedMercs).toHaveLength(1);
  208 |     expect(hired.mercs.ownedMercs[0]?.level).toBe(3);
  209 |     expect(hired.mercs.mercProgress).toEqual({ [merc]: { experience: 0, experienceToNextLevel: 304 } });
  210 |     await tree(page, fire);
  211 |     await page.getByTestId('skill-detail-panel').getByRole('button', { name: 'Allocate', exact: true }).click();
  212 |     const learned = await backup(page);
  213 |     expect(learned).toEqual({ ...hired, player: { ...hired.player, skillPoints: 0,
  214 |       skillLevels: { ...ranks, 'sorceress.fire_bolt': 1 } } });
  215 |     await slots(page, english, [fire]);
  216 |     const configured = await backup(page);
  217 |     await attach(info, 'configured', configured);
  218 |     expect(configured).toEqual({ ...learned, player: { ...learned.player, comboOrder: [fire] } });
  219 |     let totalXP = 0;
  220 |     let items = 0;
  221 |     let shards = 0;
  222 |     let earned = configured;
  223 |     for (let ordinal = 0; ordinal < 40; ordinal += 1) {
  224 |       await test.step(`earned prep ordinal ${String(ordinal)}`, async () => {
  225 |         await enter(page, english);
  226 |         await attach(info, `prep-opening-${String(ordinal)}`, {
  227 |           ordinal, wave: await wave(page), waveKind: await page.getByTestId('wave-kind-label').innerText(),
  228 |           enemies: await page.getByTestId('enemies-grid').innerText(), allies: await page.getByTestId('allies-grid').innerText()
  229 |         });
  230 |         expect(await countMonsters(page.getByTestId('enemies-grid').locator('[data-testid^="unit-card-"]'))).toBe(8 + ordinal % 13);
  231 |         await expect(page.getByTestId('allies-grid').locator('[data-kind="merc"]')).toHaveCount(1);
  232 |         await page.getByTestId('skip-button').click();
  233 |         await expect(page.getByTestId('skip-button')).toBeDisabled();
  234 |         const result = await terminalDOM(page);
```