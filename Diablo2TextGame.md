# Diablo 2 H5 — Game Design Document

> **暗黑2 H5 — 游戏设计文档**
>
> Bilingual document. Each section opens with an **English summary**, followed by Chinese detail (中文详细内容). The shipped game is primarily Chinese (zh-CN) with English as a secondary locale.
>
> 双语文档：每节先以英文摘要开头，随后是中文详细说明。游戏本体以中文（zh-CN）为主，英文为副。

---

## 0. Document Status / 文档状态

| Field | Value |
|---|---|
| **Version** | 0.1 (formalized from notes) |
| **Owner** | `producer` agent (see `AGENTS.md`) |
| **Source of truth** | This file |
| **Original notes** | [`Diablo2TextGame.original.md`](./Diablo2TextGame.original.md) |
| **Status legend** | ✅ DECIDED · 🟡 OPEN · ⏸️ DEFERRED (v2+) |

Decisions in this document are binding for v1 unless explicitly marked 🟡 OPEN. Changes require producer + Technical Director + Game Designer alignment.

> 本文档是 v1 设计的真理之源。决议条目除非标记 🟡 OPEN，否则视为已锁定。变更需 producer + 架构师 + 游戏策划三方共识。

---

## 1. Vision / 项目愿景

**Summary.** A Diablo 2-inspired, **text-based** ARPG with idle/incremental mechanics. It must be enjoyable in short bursts ("摸鱼") and deep enough to reward theory-crafting. Built primarily as a side project to sharpen technical skill while shipping something playable.

> 在磨炼技术的同时做一款游戏。钟爱暗黑2刷刷刷的玩法，希望做成一个可挂机/放置、随处可玩、上班摸鱼或手动刷本均可的文字 ARPG。
>
> 游戏定位强调：低操作门槛、文字呈现（隐蔽性强）、深度策略（搭配/combo/buff）。

---

## 2. Scope / 版本范围

**Summary (v1).** ✅ Web + installable PWA (desktop + mobile, single codebase). Local saves only. Single-player. Acts I–V.
**Deferred (v2+).** ⏸️ Cloud save, app-store packages (Capacitor / Tauri), arena, multiplayer, leaderboards, advertisements.

| Feature | v1 | v2+ |
|---|---|---|
| Web + PWA (installable, offline-capable) | ✅ | |
| Single-player Acts I–V (main story) | ✅ | |
| Local persistence (IndexedDB) | ✅ | |
| zh-CN + en localization | ✅ | |
| Cloud save (Gist / Drive) | | ⏸️ |
| Capacitor / Tauri shells | | ⏸️ |
| Arena / PvP / leaderboards | | ⏸️ |
| Multiplayer co-op | | ⏸️ |
| In-app advertisements | | ⏸️ |
| Buy-me-a-coffee link | ✅ (settings, low-key) | |

> v1 仅做 Web + PWA 单人版，本地存档。云存档、应用商店、竞技场、联机、广告等留待 v2+。

---

## 3. Design Pillars / 设计支柱

**Summary.** (1) Loot-and-grind core loop. (2) Build diversity via skill *combos* and itemization. (3) Idle-friendly: meaningful while you're away, but more rewarding while you play. (4) Lightweight presentation — text first, mobile-first.

> 1. **刷刷刷的核心循环**：打怪 → 掉装 → 变强 → 打更难的怪。
> 2. **多元构筑**：技能 combo + 装备 + 符文之语 + 雇佣兵让 build 有差异化。
> 3. **挂机友好但鼓励在线**：离线提供"下次上线倍率"而非直接产出，避免设备空转的浪费感，同时给玩家在线参与的理由。
> 4. **轻量呈现**：文字优先，移动优先。低带宽，低机能要求，UI 隐蔽。

---

## 4. Presentation / 表现层

**Summary.** Text-first UI directly reusing D2/D2R visual language — official panel artwork, item icons, fonts, rarity colors, and (optional) sound. Combat is a virtualized scrolling log. **Asset policy:** as a private, non-commercial project, official Blizzard / D2 / D2R assets may be used freely (see §11.1). Mobile-first responsive layout. The "stealth/摸鱼" theme remains an explicit toggle so players can hide imagery on demand.

> - **风格**：以文字为核心，UI 直接复用 D2 / D2R 官方面板、图标、字体与配色（白/蓝/黄/金/绿/橙物品稀有度）。
> - **2D 美术** 不再因版权问题被强行舍弃（本项目为私人非商用，详见 §11.1 资源政策）。v1 仍以文字优先，但允许使用 D2 官方插画 / 图标 / 头像 / 音效作为锦上添花的呈现层。
> - **战斗呈现**：详细文字日志（每次出手、命中、伤害、状态变化），虚拟化滚动，悬停 / 触摸暂停。
> - **响应式**：移动端 360×640 起步；桌面端使用侧栏 + 多列布局。
> - **"摸鱼模式"**：用户可在设置中一键切到极简文字主题（关闭图标 / 音效 / 大色块），便于上班隐蔽游玩。

---

## 5. Combat System / 战斗系统

### 5.1 Format / 战斗形式
**Summary.** Half-turn-based, **n vs m**. No movement or range stats. Order of action is determined solely by attack speed; ties broken by a deterministic seed.

> - 半回合制：单位之间没有移动概念，纯文字呈现。
> - 出手次序仅由 **攻速** 决定（同攻速时由确定性 RNG 决定先后，避免不可复现的战斗）。
> - 一次战斗规模 **n vs m**（玩家 1 + 雇佣兵/召唤物 vs 多个敌人）。

### 5.2 Skill Release — Player-Defined Combo / 技能释放：玩家定义 combo ✅
**Summary.** Players define an ordered priority list of up to 3–5 active skills per build. The engine releases skills in that order each turn, skipping any on cooldown / unable to fire (insufficient resource, no valid target, buff already active). Combos enable cross-element synergy (e.g. **Cold buff** → next **Lightning** skill gains amp).

> - 玩家在出战前为构筑配置 **3–5 个主动技能** 的释放顺序。
> - 每个出手回合，引擎按列表顺序尝试释放第一个可用技能：
>   - 不可用条件：CD 中、资源不足、无合法目标、buff 已生效、AOE 无目标聚集。
> - **Combo 协同**：在 combo 序列中，前一个技能可对下一个技能附加增益（例如冰 buff → 雷电增伤）。具体协同表由 `game-designer` 维护在 `docs/design/combo-matrix.md`。
> - 召唤系技能在战斗开始时一次性释放至上限，不占常规出手次数（但不会重复召唤）。
> - **若有可释放主动技能，则不释放普攻**。
> - 主动技能内置 ≥1s CD（或由施法速度换算得出的等价回合 CD）。
> - **Buff 类技能** 在 buff 生效期内不重复释放。
> - 怪物使用与玩家 **同一套** 技能释放规则。

### 5.3 Damage Types & Status Effects / 伤害类型与状态效果

| Type / 类型 | Signature Effect / 标志性状态 |
|---|---|
| Physical / 物理 | bleed (low-priority debuff) / 流血 |
| Cold / 冰 | slow; amplifies lightning damage / 减速；增强电伤 |
| Lightning / 电 | paralyze / mini-stun / attack-speed debuff / 麻痹、眩晕、减攻速 |
| Fire / 火 | burn DoT; armor-melt → physical amp / 灼烧 DoT；熔甲增伤 |
| Arcane / 奥术 | mana-burn; spell amp / 法力燃烧；法术增伤 |
| Poison / 毒 | low base, high stacks, high DPS; "plague" variants spread / 低初伤、高叠层、高秒伤；瘟疫可传播 |
| Thorns / 荆棘 | reflect; strong vs trash, weak vs bosses / 反伤；清杂强、打 boss 弱 |

> 设计偏好：偏爱毒系（低初伤高叠层），瘟疫毒可传播。荆棘类反伤系数被刻意设计为对 boss 收益偏低，以鼓励多元 build。

### 5.4 Resource Model — No Potions / 资源模型：无红蓝瓶 ✅
**Summary.** Each combat starts at full resources. Recovery is via skills, on-kill orbs (D3-style), passives, and gear. Health/mana cannot be bought.

> - 每场战斗开始即满状态。
> - 战斗中通过 技能、被动、装备词条、击杀掉落球（D3 风格） 恢复。
> - **不存在购买回血/回蓝消耗品**。

### 5.5 Defense — Dodge replaces Move/Range / 防御：闪避取代移速与射程 ✅
**Summary.** Movement-speed and range stats are removed. Their loss-of-survivability is compensated by physical and magical **dodge** stats. Ranged characters are designed with high dodge but low effective HP.

> - 不设移速 / 射程属性。
> - 增加 **物理闪避** 与 **法术闪避** 两条属性，模拟原版"风筝"与位移规避伤害。
> - 远程定位的角色：高闪避，低有效血量；近战相反。

---

## 6. Progression / 角色养成

### 6.1 Character Lifecycle ✅
**Summary.** Target ~2 weeks of active daily play to reach an "endgame-ready" build for an average player. Idle multipliers smooth out skipped days.

> 目标节奏：日均活跃玩家约 **2 周** 完成一个 build 的成型（毕业不毕业另说）。挂机/离线倍率用于平滑跳过几天的玩家。

### 6.2 Skills / 技能
**Summary.** Borrow D2 skill trees with simplifications. Skills are JSON-defined; numbers come from the design spec, content from `content-designer`.

> - 大量参考 D2 技能树。
> - 每个 build 最多上场 3–5 主动 + 任意数量被动。
> - 数据格式：JSON，由 `content-designer` 维护（参见 `.github/skills/game-data-schema/SKILL.md`）。
> - 技能可由装备赋予（融合 D3 思路）。

### 6.3 Items / 物品
**Summary.** Diablo 2-style rarity tiers, unique/set/runeword tiers all present. Items can grant skills (D3-flavor). No item-vendor-buying — items drop, are crafted, or are crafted via runewords.

> - 稀有度：白 → 蓝 → 黄 → 金（暗金 unique）→ 绿（套装）→ 橙（符文之语）。
> - 装备词条可携带技能（参考 D3）。
> - 卖出走通用接口（无独立商人 NPC，列表内一键卖出/分解）。
> - **物品栏上限**（v1 草案）：单角色背包 500 格，共享仓库 2000 格。🟡 OPEN — 视性能与 IndexedDB 体积调优。

### 6.4 Mercenaries / 雇佣兵
**Summary.** A character may **own many mercs but field only one at a time**. Original D2 mercs ship as base content; additional mercs are obtainable via gacha (currency-based), rated SSR / SR / R for collection appeal.

> - 一名玩家可同时拥有多名雇佣兵，但每场只能上场一名。
> - 雇佣兵分稀有度（SSR/SR/R 等），通过抽卡获取。
> - 雇佣兵作为特殊"物品"管理。
> - **抽卡内容**（v1）：仅雇佣兵。 🟡 OPEN — 是否加入符文/装备抽卡（设计上风险较高，可能破坏装备搭配的稀缺感）。

---

## 7. Content / 内容

### 7.1 Maps & Acts / 地图与章节
**Summary.** Story follows D2 Acts I–V. Each Act has a town/camp hub (only NPCs, dialogue, mercenary recruiter) and several sub-areas. Each sub-area follows a roguelike-ish structure — several waves of trash, optional elites, treasure events, optional shrine.

> - 主线照搬 Acts I–V。
> - 每个 Act 有营地：仅 NPC、对话、雇佣兵招募。
> - **小地图结构**（v1 默认）：rogue-like 段（几波小怪 → 精英 → 宝箱事件 → boss/出口）。
> - 圣坛：v1 不做（存在感弱，权衡后舍弃）。

### 7.2 Monsters / 怪物
**Summary.** Each monster has one **base stat config** plus per-level growth ranges. Difficulty differences come purely from monster *level* on a given map, not from separate datasets per difficulty. Skill IDs are referenced as strings; an engine factory wires concrete skill implementations at spawn time.

> 数据简化（与原版偏离）：
> - 每只怪物只有一组属性配置（基础值 + 成长范围）。
> - 不同难度差异仅由该地图上的怪物 **等级** 体现。
> - 数据格式（与 `Diablo2TextGame.original.md` §怪物 一致）：
>   ```json
>   {
>     "id": "monsters/act1.fallen",
>     "life": [1, 4],
>     "lifeGrowth": [2, 3],
>     "skills": ["weak-melee", "panic-flee"]
>   }
>   ```
>   含义：1 级时基础生命 1–4，每级生命成长 2–3。
> - 怪物技能在 JSON 中以 string ID 引用，由引擎工厂在生成时装配具体实现。

### 7.3 Quests & Story / 任务与剧情
**Summary.** Story copies the original D2 plot beats (resource constraint: limited writing bandwidth). NPCs live only in town/camp scenes. Quest system is light-touch — main-quest progression unlocks Acts and skill points; optional side quests reward unique drops or mercs.

> - 剧情基本照搬 D2，避免原创剧情压力。
> - NPC 仅在营地场景出现。
> - 任务分类：主线（解锁 Act / 技能点）、支线（unique 装备 / 雇佣兵）、悬赏（重复刷怪类）。
> - 🟡 OPEN — 任务系统的具体 UI 形态（任务板？对话树？两者结合？）由 `frontend-dev` 出 mock 后定。

---

## 8. Economy / 经济系统 ✅

**Summary.** **Gold is removed.** Primary currencies are runes, gems, and crafting materials, all of which double as build inputs. No gambling vendor; no repair (gear doesn't degrade in v1).

> - **移除金币**（D2 原版后期金币几无意义，前期亦弱）。
> - 核心货币：符文 · 宝石 · 制作材料。这些既是消耗物，也是构筑组件。
> - 无赌博 NPC（赌博系统其实就是低稀有度抽卡，由雇佣兵抽卡覆盖）。
> - v1 装备 **不损耗、不需修理**。
> - 抽卡货币：另设一种独立货币（暂名"祈愿石"）从特定掉落 / 任务获得，避免与符文打架。

---

## 9. Idle & Offline / 挂机与离线 ✅

**Summary.** Idle (online): farm a chosen map or boss; full rewards. Offline: **no direct rewards**; instead, time spent offline accrues a **multiplier window** that boosts the next online session's XP / Magic Find for a capped duration.

> - **在线挂机**：选定地图 / boss 自动刷，正常掉落 + 经验。
> - **离线**：不直接产出装备 / 经验 / 货币。
> - **离线奖励机制**：累积一个倍率池，玩家下次上线时启用，提升下一段 **几小时内** 的 XP / MF 倍率。
>   - 设计意图：避免设备空转浪费电；离线越久回归收益越好；保证玩家有"参与感"。
>   - 倍率上限与衰减由 `game-designer` 制定。

---

## 10. Endgame / 终局

**Summary.** After the main campaign, repeatable **high-difficulty dungeons** test build optimization. Achievements reward unique mercs / cosmetics / titles. No P2W.

> - 主线通关后开放 **高强度副本**（类似 D2 的密境 / 大秘境思路）。
> - 副本奖励：成就 → 特殊雇佣兵 / 特殊装备 / 称号。
> - 鼓励"研究构筑搭配"的乐趣。
> - 🟡 OPEN — 副本变体（地图 modifiers）的具体词缀池。

---

## 11. Technical / 技术

**Summary.** See `.github/copilot-instructions.md` for the locked tech stack. Highlights: TypeScript strict, React 18 + Vite, Tailwind, Zustand, Dexie (IndexedDB), `vite-plugin-pwa`, i18next, Vitest + Playwright, Ajv-validated JSON game data. Engine code is pure TS, runnable in Web Workers.

> - 技术栈见 `.github/copilot-instructions.md`（锁定）。
> - 数据：游戏数据为 JSON，启动时一次性 load（保持类似单机的体验，弱化"页游感"），由 Ajv 验证。
> - 存档：v1 IndexedDB（Dexie）。云存档延后到 v2+。
> - 引擎：纯 TS，无 React / DOM 依赖，可跑 Web Worker（用于离线倍率结算与战斗模拟）。

### 11.1 Asset & Reference Policy / 资源使用政策 ✅

**Summary.** This is a **personal, private, non-commercial** project. Agents (especially `game-designer`, `content-designer`, `frontend-dev`) **may and should** use any online resources, **including official Diablo 2 / D2R assets** — icons, portraits, panel art, fonts, sound effects, item / monster / skill names, lore text, formulas. No "license-clean lookalike" workaround is required.

Guardrails (mandatory):
- Project stays **private**: no public hosted deployment that monetizes assets, no public-marketplace publication.
- D2-derived binary assets live under `public/assets/d2/` with a `SOURCE.md` noting each file's origin URL.
- Cite sources in design specs and i18n string comments (e.g. `// source: Arreat Summit / patch 1.10`).
- Avoid committing huge raw rips — extract only what we use; keep total D2 asset payload under ~200 MB.
- Don't bundle commercial third-party paid packs the project doesn't own.
- Going public/commercial = release blocker: all D2-derived assets must be removed or replaced first.

> - **本项目为私人非商用**，可以、并鼓励直接使用 D2 / D2R 官方资源（图标、头像、面板、字体、音效、物品/怪物/技能名、剧情文本、公式）。无需另寻"风格相近的可商用素材"。
> - 守则：
>   - 仓库保持私有；不做有商业属性的公开部署；不公开发布到任何应用市场。
>   - D2 衍生二进制资源放在 `public/assets/d2/`，同目录下放 `SOURCE.md` 注明来源。
>   - 设计文档与 i18n 字符串中注明引用来源（如 `// source: Arreat Summit`）。
>   - 控制总量（建议 ≤200 MB），只抽取真正用到的资源。
>   - 不打包付费第三方商用素材包。
>   - 一旦计划公开 / 商业化，所有 D2 衍生资源必须先替换或移除（视为发布前阻塞项）。

---

## 12. Out of Scope (v1) / v1 不包含 ⏸️

- 2D 美术 / 动画 / 音效（除最小 UI 反馈）
- 云存档 / 多端账号同步
- 联机 / 协作 / 公会
- 竞技场 / PvP / 排行榜
- 应用商店打包（Capacitor / Tauri）
- 应用内广告
- 商城 / 真金购买（保留"buy me a coffee"链接，设置内默认折叠）

---

## 13. Open Questions / 待定问题 🟡

| # | Question | Owner | Notes |
|---|---|---|---|
| 1 | Inventory / stash exact caps | Technical Director + content-designer | 提案 500 / 2000；以性能为准 |
| 2 | Gacha pool composition beyond mercs | game-designer | 加入符文/装备的破坏性评估 |
| 3 | Quest UI shape (board vs dialogue tree vs hybrid) | frontend-dev | 等 mockup |
| 4 | Endgame dungeon modifier pool | game-designer | v1 末期再定 |
| 5 | Combo synergy matrix specifics (numbers) | game-designer | `docs/design/combo-matrix.md` |
| 6 | Save schema versioning policy + first migrations | Technical Director | 见 `stores/migrations.ts`（待建） |
| 7 | Map sub-area layout: pure roguelike vs linear vs mixed | game-designer | v1 默认 roguelike |

---

## 14. Glossary / 术语表

| Term | 中文 | Definition |
|---|---|---|
| Act | 章节 | 一段主线区域，含营地与多张子地图 |
| Build | 构筑 | 玩家选定的技能 + 装备 + 雇佣兵组合 |
| Combo | 连招 | 玩家定义的技能释放序列；可触发跨元素增益 |
| MF | 魔法寻物 | Magic Find，提升稀有掉落概率的属性 |
| Merc | 雇佣兵 | 跟随玩家出战的 NPC 单位 |
| Roguelike (here) | rogue 段 | 子地图的随机化波次结构 |
| Runeword | 符文之语 | 在特定基础装备上插入特定符文序列形成的橙装 |
| Shrine | 圣坛 | D2 中的临时增益建筑；v1 移除 |
| TTK | 击杀回合数 | Turns To Kill，平衡评估指标 |

---

## 15. Change Log / 变更日志

| Version | Date | Author | Notes |
|---|---|---|---|
| 0.0 | initial | (notes) | Original brainstorm — preserved as `Diablo2TextGame.original.md` |
| 0.1 | this commit | `producer` | Formalized into bilingual GDD; locked decisions on combat, currency, scope, lifecycle |
