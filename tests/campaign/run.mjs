import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const phase = process.env.CAMPAIGN_PHASE;
const recovery = process.env.CAMPAIGN_RECOVERY ?? 'none';
if (!['none', 'act1-training-v1'].includes(recovery)) throw new Error('Unknown campaign recovery mode');
const act5Route = process.env.CAMPAIGN_ACT5_ROUTE ?? 'minimum';
const execution = process.env.CAMPAIGN_EXECUTION ?? 'screen';
const inventoryPolicy = process.env.CAMPAIGN_INVENTORY ?? 'salvage-overflow-normals-v1';
const timestampText = process.env.CAMPAIGN_TIMESTAMP;
if (timestampText !== undefined && (!/^(0|[1-9]\d*)$/.test(timestampText) || !Number.isSafeInteger(Number(timestampText))))
  throw new Error('Invalid campaign timestamp');
const creationTimestamp = timestampText === undefined ? 1793304000000 : Number(timestampText);
if (!['salvage-overflow-normals-v1', 'retain-earned-overflow-v1'].includes(inventoryPolicy))
  throw new Error('Invalid campaign inventory policy');
if (!['screen', 'level-training-v1', 'nova-act2-prepared-v1', 'javelin-earned-v1', 'area-prepared-act2-v1',
  'area-prepared-retry-act2-v1', 'challenge-prepared-act2-v1', 'route-first-act2-v1',
  'route-first-campaign-v1'].includes(execution)) throw new Error('Invalid campaign execution');
if (!['minimum', 'main-quests'].includes(act5Route)) throw new Error('Invalid Act V route');
if (phase !== 'act5' && act5Route !== 'minimum') throw new Error('Full Act V route requires the Act V campaign phase');
/** @type {unknown} */
const profileRegistry = JSON.parse(readFileSync(new URL('./profile-registry.json', import.meta.url), 'utf8'));
if (typeof profileRegistry !== 'object' || profileRegistry === null || Array.isArray(profileRegistry))
  throw new Error('Invalid campaign profile registry');
const profiles = (process.env.CAMPAIGN_PROFILES ?? 'sorceress-cold,sorceress-fire').split(',');
if (!['intro', 'act1', 'act2', 'act3', 'act4', 'act5'].includes(phase)) throw new Error('Specify CAMPAIGN_PHASE=intro|act1|act2|act3|act4|act5');
if (new Set(profiles).size !== profiles.length || profiles.some(id => !Object.hasOwn(profileRegistry, id)))
  throw new Error('Specify distinct implemented CAMPAIGN_PROFILES');
if (execution === 'challenge-prepared-act2-v1' && phase !== 'act2')
  throw new Error('Challenge level preparation requires Act II phase');
if (execution === 'route-first-act2-v1' && phase !== 'act2')
  throw new Error('Route-first execution requires Act II phase');
if (execution === 'route-first-campaign-v1' && (!['act2', 'act3', 'act4', 'act5'].includes(phase) ||
  phase === 'act5' && act5Route !== 'main-quests'))
  throw new Error('Route-first campaign requires Act II–V phase and main-quest Act V route');
if (execution === 'area-prepared-act2-v1' && !['act2', 'act3', 'act4', 'act5'].includes(phase))
  throw new Error('Area preparation requires Act II–V phase');
if (execution === 'area-prepared-retry-act2-v1' &&
  (phase !== 'act2' || profiles.some(id => !['amazon-bow-survival-owned-v1', 'amazon-bow-survival-managed-v1'].includes(id))))
  throw new Error('Prepared retries require the owned Bow diagnostic profile and Act II phase');
if (execution === 'nova-act2-prepared-v1' &&
  (!['act2', 'act3', 'act4', 'act5'].includes(phase) || profiles.some(id => id !== 'sorceress-cold-nova-focus')))
  throw new Error('Nova Act II preparation requires the Nova diagnostic profile and Act II–V phase');
if (execution === 'javelin-earned-v1' && (profiles.some(id => id !== 'amazon-javelin-poison2-impale1') ||
  phase === 'act5' && act5Route !== 'main-quests'))
  throw new Error('Javelin execution requires the Javelin diagnostic profile and main-quest Act V route');
const requested = process.env.CAMPAIGN_OUTPUT;
if (!requested || !path.isAbsolute(requested)) throw new Error('Specify new absolute external CAMPAIGN_OUTPUT');
const parent = realpathSync(path.dirname(requested));
const output = path.join(parent, path.basename(requested));
const relative = path.relative(realpathSync(root), output);
if (!relative || (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)))
  throw new Error('Campaign output must be outside repository');
mkdirSync(output, { mode: 0o700 }); // Exclusive: never overwrite or replay a case directory.
const results = [];
for (const id of profiles) {
  const report = path.join(output, `${id}.json`), log = path.join(output, `${id}.log`);
  const fd = openSync(log, 'wx', 0o600);
  try {
    const child = spawn(process.execPath, [path.join(root, 'node_modules/vitest/vitest.mjs'), 'run',
      '--workspace', 'vitest.campaign.workspace.ts', '--project', 'campaign', '--cache=false'], {
      cwd: root, env: { ...process.env, CAMPAIGN_PHASE: phase, CAMPAIGN_PROFILE: id, CAMPAIGN_REPORT: report },
      stdio: ['ignore', fd, fd], shell: false
    });
    writeFileSync(path.join(output, `${id}.process.json`), JSON.stringify({
      owner: process.pid, pid: child.pid, phase, id, recovery, act5Route, execution, inventoryPolicy, creationTimestamp, startedAt: new Date().toISOString()
    }, null, 2), { flag: 'wx', mode: 0o600 });
    /** @type {Promise<{code: number|null, signal: NodeJS.Signals|null}>} */
    const completion = new Promise((resolve, reject) => {
      child.once('error', reject); child.once('close', (code, signal) => { resolve({ code, signal }); });
    });
    const exit = await completion;
    results.push({ id, report, log, ...exit });
  } finally { closeSync(fd); }
  const last = results.at(-1);
  console.log(JSON.stringify(last));
}
writeFileSync(path.join(output, 'execution.json'), JSON.stringify({ phase, recovery, act5Route, execution, inventoryPolicy, creationTimestamp, results }, null, 2), { flag: 'wx' });
process.exitCode = results.some(result => result.code !== 0) ? 1 : 0;
