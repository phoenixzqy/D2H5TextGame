import {createServer} from '/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2/node_modules/vite/dist/node/index.js';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const wt='/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2';
const root=path.dirname(fileURLToPath(import.meta.url)),mode=process.argv[2];assert.ok(['baseline','candidate'].includes(mode));
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=await readFile('/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-rogue-attack-mfx9_n49/arrow-route-report.json');
assert.equal(sha(bytes),'151f2f19fdcf840345eb28080470c4549f7795fc5e09c9083ce8197c3c916bae');
const prior=JSON.parse(bytes),opening=prior.runs.at(-1).waves.at(-1).opening;
const playerTeam=opening.playerTeam,exactSeed=(prior.seed^(4*0x9e3779b1))>>>0;
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','src','package.json','package-lock.json'],{cwd:wt,encoding:'utf8'}).split('\0').filter(Boolean);
const sources=async()=>Object.fromEntries(await Promise.all(files.map(async f=>[f,sha(await readFile(path.join(wt,f)))])));
const hashes=await sources(),report={mode,pid:process.pid,head:execFileSync('git',['rev-parse','HEAD'],{cwd:wt,encoding:'utf8'}).trim(),priorSha:sha(bytes),scriptSha:sha(await readFile(fileURLToPath(import.meta.url))),playerTeamSha:sha(JSON.stringify(playerTeam)),playerTeam,grid:[0,999],samples:[],sources:hashes};
let server;
try {
 server=await createServer({configFile:false,root:wt,cacheDir:path.join(root,mode+'-cache'),server:{middlewareMode:true,hmr:false,ws:false},resolve:{alias:{'@':path.join(wt,'src')}}});
 const load=p=>server.ssrLoadModule('/'+p);
 const {runBattleRecorded}=await load('src/engine/combat/combat.ts');
 const {resolveChallengeWavePlan}=await load('src/engine/combat/sub-area-run.ts');
 const {buildEnemiesForWave}=await load('src/stores/combatHelpers.ts');
 const {default:areas}=await load('src/data/maps/sub-areas/act1.json');
 const area=areas.find(a=>a.id==='areas/act1-burial-grounds');assert.ok(area);
 const plan=resolveChallengeWavePlan({subArea:area,seed:prior.seed,challengeOrdinal:104,fallbackLevel:12,fallbackArchetypeId:'monsters/act1.zombie'});
 const wave=plan.waves.at(-1);assert.equal(wave.spawns.length,4);report.wave=wave;
 const run=seed=>{
  const enemyTeam=buildEnemiesForWave(wave,seed),input={seed,act:1,playerTeam,enemyTeam},before=JSON.stringify(input),recorded=runBattleRecorded(input);
  assert.equal(JSON.stringify(input),before);
  const {result,events}=recorded;
  return {seed,winner:result.winner,durationMs:events.at(-1).simClockMs,heroDied:result.playerTeam.find(u=>u.kind==='hero').life<=0,
   mercDied:result.playerTeam.find(u=>u.kind==='merc').life<=0,remainingHp:result.enemyTeam.reduce((n,u)=>n+Math.max(0,u.life),0),summons:events.filter(e=>e.kind==='summon').length,
   enemyTeam,recorded};
 };
 for(let seed=0;seed<1000;seed++){const {enemyTeam,recorded,...s}=run(seed);report.samples.push(s);}
 report.exact=run(exactSeed);assert.deepEqual(run(exactSeed),report.exact);
 const wins=report.samples.filter(s=>s.winner==='player'),p=(a,q)=>a.length?[...a].sort((x,y)=>x-y)[Math.ceil(a.length*q)-1]:null;
 report.summary={wins:wins.length,draws:report.samples.filter(s=>s.winner===null).length,heroDeaths:report.samples.filter(s=>s.heroDied).length,mercDeaths:report.samples.filter(s=>s.mercDied).length,
  successfulTtkP50Ms:p(wins.map(s=>s.durationMs),.5),successfulTtkP95Ms:p(wins.map(s=>s.durationMs),.95),maximumSummons:Math.max(...report.samples.map(s=>s.summons))};
 assert.deepEqual(await sources(),hashes);report.sourcesUnchanged=true;console.log(JSON.stringify({mode,summary:report.summary,exact:{seed:report.exact.seed,winner:report.exact.winner,durationMs:report.exact.durationMs,remainingHp:report.exact.remainingHp}}));
}catch(e){report.error={message:e.message,stack:e.stack};process.exitCode=1;}finally{if(server)await server.close();await writeFile(path.join(root,mode+'-measure.json'),JSON.stringify(report,null,2)+'\n');}
