Bugs: 1. 战斗页面在完成一次战斗，无论失败还是成功，都无法在开启一场新的战斗，在地图选择新的挑战也不行。
2. 战斗时，如果有佣兵或者其他单位上场，那友军单位应该帮忙分享仇恨，而不是让怪物一直攻击角色本身。
3. NEC依旧无法召唤骷髅兵。战斗时NEC应该可以召唤骷髅兵，单位生成在友军单位栏，帮忙分担仇恨和攻击怪物。骷髅兵死后再出发技能重新召唤。
4. 战斗日志hover暂停的提示，换到header右上方展示。
5. 地图页面，应该区分显示通过的地图和未通过的地图。而且点击在此挂机之后，需要UI提示具体实在那个地图挂机。
6. 挂机功能基本上是坏的，挂机经验只能增加一次，后续只有UI提示，没有实质经验提升。掉落物品也无法出现在背包。
7. 佣兵页面需要添加删除键
8. 佣兵需要增加装备栏，可以装备全部位置。
9. 所有的任务都无法领取奖励。
10. 所有页面都应该是固定 100vh高度，然后内部容器overflow auto且支持scroll。目前所有页面都会超出100vh高度，且左侧sidebar只有100vh高，在页面滑动时会显示错误UI。而且很多页面的footer都会被推到页面下面，无法快速查看。
11. 技能页面，技能应该是用技能树的形式渲染，因为技能有前置依赖关系。主动技能顺序栏目前占用全部的右侧区域，过于占用空间，需要从新设计，可以设置成不同的tab
12. 佣兵应该也可以升级，拥有固定的每级属性提升
13. 角色属性页面，从上到下从左到右依次应该是， 
角色卡片和经验值，派生属性
属性，抗性
装备

Affix-rolls deferred follow-ups:
1. Author full unique/set fixed-affix data beyond MVP starter coverage.
2. Expand random affix pool toward the 60-prefix/60-suffix endgame target in docs/design/items-spec.md.
3. Add dedicated visual polish for rarity-tier affix colors beyond base rarity coloring.

Inventory UX overhaul follow-ups:
1. Inventory "discard" is permanent destruction (the game has no currency yet).
   Replace with a salvage → materials flow once crafting ships
   (TODO marker in src/features/inventory/InventoryScreen.tsx and
   src/stores/inventoryStore.ts).

