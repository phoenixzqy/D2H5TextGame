import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = path.join(root, 'src', 'data', 'skills');
const monsterDir = path.join(root, 'src', 'data', 'monsters');
const localeDir = path.join(root, 'src', 'i18n', 'locales');
const langs = ['zh-CN', 'en'];
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function leafMonsterKey(id) { return id.split('.').at(-1).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()); }
function skillKeyFromId(id) { let m = /^skills-([a-z]+)-(.+)$/.exec(id); if (m) return { group: m[1], skill: m[2] }; m = /^monster-(.+)$/.exec(id); if (m) return { group: 'monster', skill: m[1] }; m = /^(?:mskill|aura|passive)-(.+)$/.exec(id); if (m) return { group: 'mercenary', skill: m[1] }; throw new Error(`Unexpected skill id: ${id}`); }
function get(obj, parts) { return parts.reduce((cur, part) => (cur && typeof cur === 'object' ? cur[part] : undefined), obj); }
function auditSkills() { const skills = []; for (const file of fs.readdirSync(skillDir).filter((name) => name.endsWith('.json'))) for (const skill of readJson(path.join(skillDir, file))) { const { group, skill: skillName } = skillKeyFromId(skill.id); skills.push({ group, skill: skillName }); } const result = {}; for (const lang of langs) { const locale = readJson(path.join(localeDir, lang, 'skills.json')); const missing = []; for (const skill of skills) for (const prop of ['name', 'desc']) { const value = get(locale, [skill.group, skill.skill, prop]); if (typeof value !== 'string' || value.length === 0) missing.push(`${skill.group}.${skill.skill}.${prop}`); } result[lang] = { expected: skills.length * 2, missingCount: missing.length, missing }; } return result; }
function auditMonsters() { const monsters = []; for (const file of fs.readdirSync(monsterDir).filter((name) => /^act\d+\.json$/.test(name))) for (const monster of readJson(path.join(monsterDir, file))) monsters.push({ id: monster.id, key: leafMonsterKey(monster.id) }); const result = {}; for (const lang of langs) { const locale = readJson(path.join(localeDir, lang, 'monsters.json')); const missing = monsters.filter((monster) => typeof locale[monster.key] !== 'string' || locale[monster.key].length === 0).map((monster) => `${monster.id} -> ${monster.key}`); result[lang] = { expected: monsters.length, missingCount: missing.length, missing }; } return result; }
const report = { skills: auditSkills(), monsters: auditMonsters() };
console.log(JSON.stringify(report, null, 2));
process.exitCode = Object.values(report.skills).some((r) => r.missingCount > 0) || Object.values(report.monsters).some((r) => r.missingCount > 0) ? 1 : 0;
